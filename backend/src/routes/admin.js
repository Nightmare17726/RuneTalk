import express from 'express';
import { query } from '../config/database.js';
import { verifyFirebaseToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin
router.use(verifyFirebaseToken);
router.use(requireAdmin);

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT
        u.*,
        COUNT(DISTINCT s.id) as story_count,
        COUNT(DISTINCT sub.id) as has_subscription
       FROM users u
       LEFT JOIN stories s ON u.id = s.user_id
       LEFT JOIN subscriptions sub ON u.id = sub.user_id AND sub.status = 'active'
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM users');

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:id', async (req, res) => {
  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [req.params.id]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const stories = await query('SELECT * FROM stories WHERE user_id = $1', [req.params.id]);
    const subscription = await query('SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [req.params.id]);
    const vocabulary = await query('SELECT COUNT(*) FROM vocabulary WHERE user_id = $1', [req.params.id]);

    res.json({
      user,
      stories: stories.rows,
      subscription: subscription.rows[0] || null,
      vocabularyCount: parseInt(vocabulary.rows[0].count)
    });
  } catch (error) {
    console.error('Admin user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update user
router.patch('/users/:id', async (req, res) => {
  try {
    const { subscription_tier, subscription_status, is_admin } = req.body;

    const result = await query(
      `UPDATE users
       SET subscription_tier = COALESCE($1, subscription_tier),
           subscription_status = COALESCE($2, subscription_status),
           is_admin = COALESCE($3, is_admin),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [subscription_tier, subscription_status, is_admin, req.params.id]
    );

    // Log action
    await query(
      `INSERT INTO admin_logs (admin_user_id, action, target_user_id, details)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, 'update_user', req.params.id, JSON.stringify(req.body)]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Revenue dashboard
router.get('/revenue', async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const revenueResult = await query(
      `SELECT
        DATE(created_at) as date,
        SUM(amount) as total,
        COUNT(*) as count
       FROM payments
       WHERE status = 'succeeded' AND created_at >= NOW() - INTERVAL '${parseInt(period)} days'
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    const summaryResult = await query(
      `SELECT
        SUM(amount) as total_revenue,
        COUNT(*) as total_payments,
        COUNT(DISTINCT user_id) as paying_users
       FROM payments
       WHERE status = 'succeeded' AND created_at >= NOW() - INTERVAL '${parseInt(period)} days'`
    );

    const subscriptionResult = await query(
      `SELECT
        plan_type,
        status,
        COUNT(*) as count
       FROM subscriptions
       GROUP BY plan_type, status`
    );

    res.json({
      dailyRevenue: revenueResult.rows,
      summary: summaryResult.rows[0],
      subscriptionBreakdown: subscriptionResult.rows
    });
  } catch (error) {
    console.error('Admin revenue error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue data' });
  }
});

// AI usage analytics
router.get('/ai-usage', async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const usageResult = await query(
      `SELECT
        DATE(created_at) as date,
        provider,
        SUM(tokens_used) as tokens,
        SUM(cost_usd) as cost,
        COUNT(*) as operations
       FROM ai_usage
       WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
       GROUP BY DATE(created_at), provider
       ORDER BY date ASC`
    );

    const summaryResult = await query(
      `SELECT
        provider,
        SUM(tokens_used) as total_tokens,
        SUM(cost_usd) as total_cost,
        COUNT(*) as total_operations,
        AVG(response_time_ms) as avg_response_time
       FROM ai_usage
       WHERE created_at >= NOW() - INTERVAL '${parseInt(period)} days'
       GROUP BY provider`
    );

    res.json({
      dailyUsage: usageResult.rows,
      summary: summaryResult.rows
    });
  } catch (error) {
    console.error('Admin AI usage error:', error);
    res.status(500).json({ error: 'Failed to fetch AI usage data' });
  }
});

// Platform stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await query(
      `SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
        (SELECT COUNT(*) FROM users WHERE subscription_tier = 'premium' AND subscription_status = 'active') as premium_users,
        (SELECT COUNT(*) FROM stories) as total_stories,
        (SELECT COUNT(*) FROM chapters) as total_chapters,
        (SELECT COUNT(*) FROM vocabulary) as total_vocabulary,
        (SELECT SUM(time_spent_seconds) FROM progress) as total_reading_time,
        (SELECT COUNT(*) FROM quiz_results) as total_quizzes`
    );

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Content moderation
router.get('/content/recent', async (req, res) => {
  try {
    const stories = await query(
      `SELECT s.*, u.email, u.display_name
       FROM stories s
       JOIN users u ON s.user_id = u.id
       ORDER BY s.created_at DESC
       LIMIT 50`
    );

    res.json(stories.rows);
  } catch (error) {
    console.error('Admin content error:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = $1', [req.params.id]);

    await query(
      `INSERT INTO admin_logs (admin_user_id, action, target_user_id)
       VALUES ($1, $2, $3)`,
      [req.user.id, 'delete_user', req.params.id]
    );

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get admin logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await query(
      `SELECT l.*, u.email as admin_email, t.email as target_email
       FROM admin_logs l
       LEFT JOIN users u ON l.admin_user_id = u.id
       LEFT JOIN users t ON l.target_user_id = t.id
       ORDER BY l.created_at DESC
       LIMIT 100`
    );

    res.json(logs.rows);
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

export default router;
