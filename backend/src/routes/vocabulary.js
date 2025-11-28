import express from 'express';
import { query } from '../config/database.js';
import { verifyFirebaseToken, requirePremium } from '../middleware/auth.js';
import { generateTranslation } from '../services/aiService.js';

const router = express.Router();

// Save vocabulary word
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { storyId, chapterId, word, translation, language, contextSentence, partOfSpeech, difficulty } = req.body;

    // Check free tier limits
    if (req.user.subscription_tier !== 'premium') {
      const count = await query(
        'SELECT COUNT(*) FROM vocabulary WHERE user_id = $1',
        [req.user.id]
      );

      if (parseInt(count.rows[0].count) >= 100) {
        return res.status(403).json({
          error: 'Vocabulary limit reached',
          limit: 100,
          upgradeRequired: true
        });
      }
    }

    // Calculate next review date (spaced repetition)
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1); // Start with 1 day

    const result = await query(
      `INSERT INTO vocabulary (user_id, story_id, chapter_id, word, translation, language, context_sentence, part_of_speech, difficulty, next_review)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.user.id, storyId, chapterId, word, translation, language, contextSentence, partOfSpeech, difficulty, nextReview]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Save vocabulary error:', error);
    res.status(500).json({ error: 'Failed to save vocabulary' });
  }
});

// Get user's vocabulary
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { language, mastery } = req.query;

    let queryText = 'SELECT * FROM vocabulary WHERE user_id = $1';
    const params = [req.user.id];

    if (language) {
      queryText += ' AND language = $2';
      params.push(language);
    }

    if (mastery) {
      queryText += ` AND mastery_level ${mastery === 'low' ? '<' : '>='} 3`;
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch vocabulary error:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// Get vocabulary due for review
router.get('/review', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM vocabulary
       WHERE user_id = $1 AND next_review <= NOW()
       ORDER BY next_review ASC
       LIMIT 20`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch review vocabulary error:', error);
    res.status(500).json({ error: 'Failed to fetch review vocabulary' });
  }
});

// Update vocabulary review
router.post('/:id/review', verifyFirebaseToken, async (req, res) => {
  try {
    const { correct } = req.body;

    const vocabResult = await query(
      'SELECT * FROM vocabulary WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (vocabResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vocabulary not found' });
    }

    const vocab = vocabResult.rows[0];
    let newMastery = vocab.mastery_level;
    let intervalDays = 1;

    if (correct) {
      newMastery = Math.min(vocab.mastery_level + 1, 5);
      // Spaced repetition intervals: 1, 3, 7, 14, 30 days
      const intervals = [1, 3, 7, 14, 30];
      intervalDays = intervals[Math.min(newMastery, 4)];
    } else {
      newMastery = Math.max(vocab.mastery_level - 1, 0);
      intervalDays = 1;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + intervalDays);

    await query(
      `UPDATE vocabulary
       SET times_reviewed = times_reviewed + 1,
           last_reviewed = NOW(),
           next_review = $1,
           mastery_level = $2
       WHERE id = $3`,
      [nextReview, newMastery, req.params.id]
    );

    res.json({ success: true, newMastery, nextReview });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Translate word
router.post('/translate', verifyFirebaseToken, async (req, res) => {
  try {
    const { word, fromLang, toLang } = req.body;

    const translation = await generateTranslation(word, fromLang, toLang);

    res.json(translation);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Failed to translate' });
  }
});

// Delete vocabulary
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    await query(
      'DELETE FROM vocabulary WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Vocabulary deleted' });
  } catch (error) {
    console.error('Delete vocabulary error:', error);
    res.status(500).json({ error: 'Failed to delete vocabulary' });
  }
});

// Get vocabulary stats
router.get('/stats', verifyFirebaseToken, async (req, res) => {
  try {
    const stats = await query(
      `SELECT
        COUNT(*) as total_words,
        COUNT(*) FILTER (WHERE mastery_level >= 3) as mastered_words,
        COUNT(DISTINCT language) as languages,
        COUNT(*) FILTER (WHERE next_review <= NOW()) as due_for_review
       FROM vocabulary
       WHERE user_id = $1`,
      [req.user.id]
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
