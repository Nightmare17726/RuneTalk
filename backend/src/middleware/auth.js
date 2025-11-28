import admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';

// Initialize Firebase Admin
let firebaseInitialized = false;

export const initFirebase = () => {
  if (!firebaseInitialized && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firebaseInitialized = true;
  }
};

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify Firebase token
    initFirebase();
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get or create user in database
    const userResult = await query(
      'SELECT * FROM users WHERE firebase_uid = $1',
      [decodedToken.uid]
    );

    let user;
    if (userResult.rows.length === 0) {
      // Create new user
      const insertResult = await query(
        `INSERT INTO users (firebase_uid, email, display_name, avatar_url)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [decodedToken.uid, decodedToken.email, decodedToken.name, decodedToken.picture]
      );
      user = insertResult.rows[0];
    } else {
      user = userResult.rows[0];

      // Update last login
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const requirePremium = async (req, res, next) => {
  if (req.user.subscription_tier !== 'premium' || req.user.subscription_status !== 'active') {
    return res.status(403).json({ error: 'Premium subscription required' });
  }
  next();
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const checkDailyLimit = async (req, res, next) => {
  const user = req.user;

  // Premium users have unlimited access
  if (user.subscription_tier === 'premium' && user.subscription_status === 'active') {
    return next();
  }

  // Check if we need to reset daily count
  const resetTime = new Date(user.daily_generation_reset);
  const now = new Date();
  const hoursSinceReset = (now - resetTime) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    // Reset count
    await query(
      'UPDATE users SET daily_generation_count = 0, daily_generation_reset = NOW() WHERE id = $1',
      [user.id]
    );
    user.daily_generation_count = 0;
  }

  // Free tier limit: 3 generations per day
  const FREE_TIER_LIMIT = 3;

  if (user.daily_generation_count >= FREE_TIER_LIMIT) {
    return res.status(429).json({
      error: 'Daily generation limit reached',
      limit: FREE_TIER_LIMIT,
      upgradeRequired: true
    });
  }

  next();
};

export const incrementDailyGeneration = async (userId) => {
  await query(
    'UPDATE users SET daily_generation_count = daily_generation_count + 1 WHERE id = $1',
    [userId]
  );
};
