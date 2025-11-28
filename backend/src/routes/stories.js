import express from 'express';
import { query } from '../config/database.js';
import { verifyFirebaseToken, checkDailyLimit, incrementDailyGeneration, requirePremium } from '../middleware/auth.js';
import { generateStoryChapter, generateQuiz } from '../services/aiService.js';

const router = express.Router();

// Create a new story
router.post('/', verifyFirebaseToken, checkDailyLimit, async (req, res) => {
  try {
    const { title, genre, nativeLanguage, targetLanguage, difficultyLevel, description } = req.body;

    const result = await query(
      `INSERT INTO stories (user_id, title, genre, native_language, target_language, difficulty_level, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, title, genre, nativeLanguage, targetLanguage, difficultyLevel, description]
    );

    const story = result.rows[0];

    // Generate first chapter
    const chapter = await generateStoryChapter({
      userId: req.user.id,
      storyId: story.id,
      chapterNumber: 1,
      genre,
      nativeLanguage,
      targetLanguage,
      difficulty: difficultyLevel,
      previousContext: null,
      characters: [],
      plotSummary: description
    });

    const chapterResult = await query(
      `INSERT INTO chapters (story_id, chapter_number, title, content, native_percentage, target_percentage, highlighted_words, grammar_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [story.id, 1, chapter.title, chapter.content, chapter.nativePercentage, chapter.targetPercentage, JSON.stringify(chapter.highlightedWords), JSON.stringify(chapter.grammarNotes)]
    );

    await query(
      'UPDATE stories SET total_chapters = 1, current_chapter = 1 WHERE id = $1',
      [story.id]
    );

    await incrementDailyGeneration(req.user.id);

    res.json({
      story,
      firstChapter: chapterResult.rows[0]
    });
  } catch (error) {
    console.error('Story creation error:', error);
    res.status(500).json({ error: 'Failed to create story' });
  }
});

// Get user's stories
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT s.*,
        (SELECT COUNT(*) FROM chapters WHERE story_id = s.id) as chapter_count,
        (SELECT chapter_number FROM progress WHERE story_id = s.id AND user_id = $1 ORDER BY updated_at DESC LIMIT 1) as last_read_chapter
       FROM stories s
       WHERE s.user_id = $1
       ORDER BY s.updated_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch stories error:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
});

// Get single story
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM stories WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch story error:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
});

// Generate next chapter
router.post('/:id/chapters', verifyFirebaseToken, checkDailyLimit, async (req, res) => {
  try {
    const storyResult = await query(
      'SELECT * FROM stories WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    if (storyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Story not found' });
    }

    const story = storyResult.rows[0];
    const nextChapterNumber = story.total_chapters + 1;

    // Get previous chapters for context
    const prevChapters = await query(
      'SELECT content FROM chapters WHERE story_id = $1 ORDER BY chapter_number DESC LIMIT 3',
      [story.id]
    );

    const previousContext = prevChapters.rows.map(c => c.content).join('\n\n');

    const chapter = await generateStoryChapter({
      userId: req.user.id,
      storyId: story.id,
      chapterNumber: nextChapterNumber,
      genre: story.genre,
      nativeLanguage: story.native_language,
      targetLanguage: story.target_language,
      difficulty: story.difficulty_level,
      previousContext,
      characters: story.characters,
      plotSummary: story.plot_summary
    });

    const chapterResult = await query(
      `INSERT INTO chapters (story_id, chapter_number, title, content, native_percentage, target_percentage, highlighted_words, grammar_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [story.id, nextChapterNumber, chapter.title, chapter.content, chapter.nativePercentage, chapter.targetPercentage, JSON.stringify(chapter.highlightedWords), JSON.stringify(chapter.grammarNotes)]
    );

    await query(
      'UPDATE stories SET total_chapters = $1, updated_at = NOW() WHERE id = $2',
      [nextChapterNumber, story.id]
    );

    await incrementDailyGeneration(req.user.id);

    res.json(chapterResult.rows[0]);
  } catch (error) {
    console.error('Chapter generation error:', error);
    res.status(500).json({ error: 'Failed to generate chapter' });
  }
});

// Get chapters for a story
router.get('/:id/chapters', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.* FROM chapters c
       JOIN stories s ON c.story_id = s.id
       WHERE s.id = $1 AND s.user_id = $2
       ORDER BY c.chapter_number ASC`,
      [req.params.id, req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Fetch chapters error:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// Get specific chapter
router.get('/:storyId/chapters/:chapterNumber', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT c.* FROM chapters c
       JOIN stories s ON c.story_id = s.id
       WHERE s.id = $1 AND c.chapter_number = $2 AND s.user_id = $3`,
      [req.params.storyId, req.params.chapterNumber, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Chapter not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Fetch chapter error:', error);
    res.status(500).json({ error: 'Failed to fetch chapter' });
  }
});

// Toggle bookmark
router.patch('/:id/bookmark', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      `UPDATE stories SET is_bookmarked = NOT is_bookmarked WHERE id = $1 AND user_id = $2 RETURNING is_bookmarked`,
      [req.params.id, req.user.id]
    );

    res.json({ bookmarked: result.rows[0].is_bookmarked });
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ error: 'Failed to update bookmark' });
  }
});

// Delete story
router.delete('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    await query(
      'DELETE FROM stories WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Story deleted' });
  } catch (error) {
    console.error('Delete story error:', error);
    res.status(500).json({ error: 'Failed to delete story' });
  }
});

export default router;
