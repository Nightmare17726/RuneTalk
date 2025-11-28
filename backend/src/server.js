import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { generalLimiter, aiLimiter } from './middleware/rateLimiter.js';

// Route imports
import storiesRouter from './routes/stories.js';
import vocabularyRouter from './routes/vocabulary.js';
import progressRouter from './routes/progress.js';
import quizzesRouter from './routes/quizzes.js';
import subscriptionsRouter from './routes/subscriptions.js';
import adminRouter from './routes/admin.js';
import usersRouter from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing - Stripe webhook needs raw body
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', generalLimiter);
app.use('/api/stories', aiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/stories', storiesRouter);
app.use('/api/vocabulary', vocabularyRouter);
app.use('/api/progress', progressRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api/subscriptions', subscriptionsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDev && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RuneTalk API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;
