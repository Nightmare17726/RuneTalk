import express from 'express';
import { query } from '../config/database.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// Update reading progress
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { storyId, chapterId, completionPercentage, lastPosition, timeSpent } = req.body;

    const result = await query(
      `INSERT INTO progress (user_id, story_id, chapter_id, completion_percentage, last_position, time_spent_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, story_id, chapter_id) DO UPDATE SET
         completion_percentage = $4,
         last_position = $5,
         time_spent_seconds = progress.time_spent_seconds + $6,
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, storyId, chapterId, completionPercentage, lastPosition, timeSpent]
    );

    // Mark chapter as completed if 100%
    if (completionPercentage >= 100) {
      await query(
        'UPDATE progress SET completed_at = NOW() WHERE id = $1',
        [result.rows[0].id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get progress for a story
router.get('/story/:storyId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, c.chapter_number, c.title
       FROM progress p
       JOIN chapters c ON p.chapter_id = c.id
       WHERE p.story_id = $1 AND p.user_id = $2
       ORDER BY c.chapter_number ASC`,
      [req.params.storyId, req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get overall stats
router.get('/stats', verifyFirebaseToken, async (req, res) => {
  try {
    const stats = await query(
      `SELECT
        COUNT(DISTINCT story_id) as stories_read,
        COUNT(DISTINCT CASE WHEN completion_percentage >= 100 THEN chapter_id END) as chapters_completed,
        SUM(time_spent_seconds) as total_time_seconds,
        AVG(completion_percentage) as avg_completion
       FROM progress
       WHERE user_id = $1`,
      [req.user.id]
    );

    const streakResult = await query(
      `SELECT COUNT(DISTINCT DATE(updated_at)) as streak
       FROM progress
       WHERE user_id = $1
       AND updated_at >= NOW() - INTERVAL '30 days'`,
      [req.user.id]
    );

    res.json({
      ...stats.rows[0],
      reading_streak: streakResult.rows[0].streak
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get learning analytics
router.get('/analytics', verifyFirebaseToken, async (req, res) => {
  try {
    // Daily reading time for last 30 days
    const dailyActivity = await query(
      `SELECT
        DATE(updated_at) as date,
        SUM(time_spent_seconds) as time_spent
       FROM progress
       WHERE user_id = $1 AND updated_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(updated_at)
       ORDER BY date ASC`,
      [req.user.id]
    );

    // Language breakdown
    const languageStats = await query(
      `SELECT
        s.target_language,
        COUNT(DISTINCT s.id) as story_count,
        COUNT(DISTINCT p.chapter_id) as chapters_read
       FROM progress p
       JOIN stories s ON p.story_id = s.id
       WHERE p.user_id = $1
       GROUP BY s.target_language`,
      [req.user.id]
    );

    // Genre preferences
    const genreStats = await query(
      `SELECT
        s.genre,
        COUNT(*) as count
       FROM stories s
       WHERE s.user_id = $1
       GROUP BY s.genre
       ORDER BY count DESC`,
      [req.user.id]
    );

    res.json({
      dailyActivity: dailyActivity.rows,
      languageStats: languageStats.rows,
      genreStats: genreStats.rows
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
