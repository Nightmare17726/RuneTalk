import express from 'express';
import { query } from '../config/database.js';
import { verifyFirebaseToken } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.patch('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const { display_name, avatar_url, native_language } = req.body;

    const result = await query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           avatar_url = COALESCE($2, avatar_url),
           native_language = COALESCE($3, native_language),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [display_name, avatar_url, native_language, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Register/sync device
router.post('/devices', verifyFirebaseToken, async (req, res) => {
  try {
    const { device_token, device_type, device_name, push_token } = req.body;

    const result = await query(
      `INSERT INTO devices (user_id, device_token, device_type, device_name, push_token)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (device_token) DO UPDATE SET
         last_sync = NOW(),
         push_token = $5
       RETURNING *`,
      [req.user.id, device_token, device_type, device_name, push_token]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Register device error:', error);
    res.status(500).json({ error: 'Failed to register device' });
  }
});

// Get user devices
router.get('/devices', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM devices WHERE user_id = $1 ORDER BY last_sync DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Delete device
router.delete('/devices/:id', verifyFirebaseToken, async (req, res) => {
  try {
    await query(
      'DELETE FROM devices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Device deleted' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

export default router;
