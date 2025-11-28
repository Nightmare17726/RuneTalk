import express from 'express';
import { query } from '../config/database.js';
import { verifyFirebaseToken } from '../middleware/auth.js';
import { generateQuiz } from '../services/aiService.js';

const router = express.Router();

// Generate quiz for chapter
router.post('/generate/:chapterId', verifyFirebaseToken, async (req, res) => {
  try {
    const chapterResult = await query(
      `SELECT c.*, s.target_language, s.difficulty_level
       FROM chapters c
       JOIN stories s ON c.story_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [req.params.chapterId, req.user.id]
    );

    if (chapterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    const chapter = chapterResult.rows[0];

    const quiz = await generateQuiz(
      chapter.id,
      chapter.content,
      chapter.target_language,
      chapter.difficulty_level
    );

    res.json(quiz);
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Submit quiz results
router.post('/submit', verifyFirebaseToken, async (req, res) => {
  try {
    const { chapterId, quizData, score, totalQuestions, timeTaken } = req.body;

    const result = await query(
      `INSERT INTO quiz_results (user_id, chapter_id, quiz_data, score, total_questions, time_taken_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, chapterId, JSON.stringify(quizData), score, totalQuestions, timeTaken]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

// Get quiz results for chapter
router.get('/chapter/:chapterId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT qr.*
       FROM quiz_results qr
       JOIN chapters c ON qr.chapter_id = c.id
       JOIN stories s ON c.story_id = s.id
       WHERE qr.chapter_id = $1 AND s.user_id = $2
       ORDER BY qr.completed_at DESC`,
      [req.params.chapterId, req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch quiz results error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz results' });
  }
});

// Get quiz stats
router.get('/stats', verifyFirebaseToken, async (req, res) => {
  try {
    const stats = await query(
      `SELECT
        COUNT(*) as total_quizzes,
        AVG(score::float / total_questions * 100) as avg_score,
        SUM(score) as total_correct,
        SUM(total_questions) as total_questions
       FROM quiz_results
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Fetch quiz stats error:', error);
    res.status(500).json({ error: 'Failed to fetch quiz stats' });
  }
});

export default router;
