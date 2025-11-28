# RuneTalk Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
Install:
- Node.js 18+ ([nodejs.org](https://nodejs.org))
- PostgreSQL ([postgresql.org](https://postgresql.org))

Sign up for:
- Firebase ([firebase.google.com](https://firebase.google.com))
- Stripe ([stripe.com](https://stripe.com))
- OpenAI ([openai.com](https://openai.com)) OR Gemini ([ai.google.dev](https://ai.google.dev))

### Step 1: Database Setup (2 min)

```bash
# Create database
createdb runetalk

# Run migrations
cd backend
npm install
npm run migrate
```

### Step 2: Backend Setup (2 min)

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# Required:
# - DATABASE_URL (PostgreSQL connection string)
# - FIREBASE_SERVICE_ACCOUNT (from Firebase console)
# - OPENAI_API_KEY or GEMINI_API_KEY
# - STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

# Start backend
npm run dev
# ✅ Backend running on http://localhost:3000
```

### Step 3: Frontend Setup (1 min)

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Firebase config
# Get from Firebase Console > Project Settings > Web App

# Start frontend
npm run dev
# ✅ Frontend running on http://localhost:5173
```

### Step 4: Test the App

1. Open http://localhost:5173
2. Click "Create Account"
3. Sign up with email or Google
4. Click "New Story"
5. Fill in:
   - Title: "My First Adventure"
   - Genre: Fantasy
   - Native Language: English
   - Target Language: Spanish
   - Difficulty: Beginner
6. Click "Create Story"
7. ✨ AI generates your first chapter!

### Step 5: Mobile Setup (Optional)

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with same Firebase config

# Start Expo
npm start

# Scan QR code with Expo Go app
```

## 🎯 What You Built

### Backend Features
- ✅ REST API with Express
- ✅ PostgreSQL database with 11 tables
- ✅ Firebase authentication
- ✅ AI story generation (progressive language blending)
- ✅ Stripe subscription payments
- ✅ Vocabulary tracking with spaced repetition
- ✅ Chapter quizzes
- ✅ Progress analytics
- ✅ Admin dashboard
- ✅ Rate limiting & security

### Frontend Features
- ✅ React + Vite + TailwindCSS
- ✅ Login/Register with Firebase
- ✅ Create AI stories
- ✅ Interactive reader with hover translations
- ✅ Vocabulary management
- ✅ Learning analytics
- ✅ Subscription management
- ✅ Dark mode
- ✅ Responsive design

### Mobile Features
- ✅ React Native + Expo
- ✅ Offline story reading
- ✅ Biometric authentication
- ✅ Push notifications
- ✅ Cross-device sync

## 💰 Monetization

### Free Tier
- 3 story generations per day
- 100 vocabulary words max
- Basic features
- Ads supported

### Premium ($9.99/month or $99.99/year)
- Unlimited story generation
- Unlimited vocabulary
- Advanced quizzes
- Audio narration
- Offline mobile access
- No ads

## 🎨 Key Technologies

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | Firebase |
| Payments | Stripe |
| AI | OpenAI GPT-4 / Gemini |
| Frontend | React + Vite |
| Mobile | React Native + Expo |
| Styling | TailwindCSS + ShadCN |
| State | Zustand |

## 📊 Database Tables

1. **users** - User accounts & subscription status
2. **subscriptions** - Stripe subscription tracking
3. **stories** - Story metadata (title, genre, languages)
4. **chapters** - Generated chapter content
5. **vocabulary** - Saved words with SRS data
6. **progress** - Reading progress tracking
7. **quiz_results** - Quiz performance
8. **payments** - Payment records
9. **devices** - Mobile device sync
10. **ai_usage** - AI cost tracking
11. **admin_logs** - Admin actions

## 🔐 Security Features

- ✅ Firebase authentication tokens
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Stripe webhook signature verification
- ✅ Environment variable protection

## 🎓 How AI Story Generation Works

1. User selects: Genre, Native Lang, Target Lang, Difficulty
2. Backend calculates language mix:
   - Chapter 1: 90% native, 10% target
   - Chapter 2: 80% native, 20% target
   - ...
   - Chapter 9: 10% native, 90% target
3. AI prompt includes:
   - Genre-specific style
   - Difficulty-appropriate vocabulary
   - Previous chapter context
   - Character continuity
4. AI generates:
   - Story content with marked target words
   - Translations for each word
   - Grammar explanations
   - Contextual quiz questions
5. Backend parses and stores in database
6. Frontend renders with interactive tooltips

## 🚀 Next Steps

### Deploy to Production
See [DEPLOYMENT.md](./DEPLOYMENT.md) for:
- Deploy backend to Railway/Render
- Deploy frontend to Vercel
- Build mobile apps with EAS
- Configure Stripe webhooks
- Set up monitoring

### Customize
- Add more languages in `frontend/src/lib/utils.js`
- Adjust language progression in `backend/src/services/aiService.js`
- Customize AI prompts for different story styles
- Add more quiz types
- Implement TTS audio generation
- Add social sharing features

### Scale
- Add Redis for caching
- Implement CDN for assets
- Add read replicas for database
- Queue system for story generation
- Background jobs for vocabulary review reminders

## 📞 Support

- 📧 Email: support@runetalk.com
- 📖 Docs: [README.md](../README.md)
- 🚀 Deploy: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🎉 You're Ready!

Your production-ready language learning SaaS is complete.

**Start building your user base:**
1. Deploy to production
2. Set up Stripe products
3. Configure Firebase
4. Market your app
5. Scale and iterate

Happy language learning! 🌍📚
