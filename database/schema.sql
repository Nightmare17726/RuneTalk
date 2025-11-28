-- RuneTalk Database Schema

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  firebase_uid VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  avatar_url TEXT,
  native_language VARCHAR(10) NOT NULL DEFAULT 'en',
  subscription_tier VARCHAR(20) NOT NULL DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'inactive',
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  is_admin BOOLEAN DEFAULT FALSE,
  daily_generation_count INTEGER DEFAULT 0,
  daily_generation_reset TIMESTAMP DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  status VARCHAR(20) NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  genre VARCHAR(100) NOT NULL,
  native_language VARCHAR(10) NOT NULL,
  target_language VARCHAR(10) NOT NULL,
  difficulty_level VARCHAR(20) NOT NULL,
  total_chapters INTEGER DEFAULT 0,
  current_chapter INTEGER DEFAULT 0,
  cover_image_url TEXT,
  description TEXT,
  characters JSONB DEFAULT '[]'::jsonb,
  plot_summary TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  is_bookmarked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chapters table
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title VARCHAR(500),
  content TEXT NOT NULL,
  native_percentage INTEGER NOT NULL,
  target_percentage INTEGER NOT NULL,
  word_count INTEGER,
  highlighted_words JSONB DEFAULT '[]'::jsonb,
  grammar_notes JSONB DEFAULT '[]'::jsonb,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(story_id, chapter_number)
);

-- Vocabulary table
CREATE TABLE vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  word VARCHAR(255) NOT NULL,
  translation VARCHAR(255) NOT NULL,
  language VARCHAR(10) NOT NULL,
  context_sentence TEXT,
  part_of_speech VARCHAR(50),
  difficulty VARCHAR(20),
  times_reviewed INTEGER DEFAULT 0,
  last_reviewed TIMESTAMP,
  next_review TIMESTAMP,
  mastery_level INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vocabulary_user_review ON vocabulary(user_id, next_review);
CREATE INDEX idx_vocabulary_user_word ON vocabulary(user_id, word);

-- Progress tracking table
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  completion_percentage INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, story_id, chapter_id)
);

-- Quiz results table
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  quiz_data JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_invoice_id VARCHAR(255),
  amount INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(20) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Devices table (for mobile sync)
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_token VARCHAR(500) UNIQUE NOT NULL,
  device_type VARCHAR(20) NOT NULL,
  device_name VARCHAR(255),
  push_token VARCHAR(500),
  last_sync TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI usage analytics table
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  response_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_date ON ai_usage(created_at);
CREATE INDEX idx_ai_usage_user ON ai_usage(user_id);

-- Admin logs table
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_stories_user ON stories(user_id);
CREATE INDEX idx_chapters_story ON chapters(story_id);
CREATE INDEX idx_progress_user ON progress(user_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_quiz_user ON quiz_results(user_id);
