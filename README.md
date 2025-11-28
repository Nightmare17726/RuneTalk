# RuneTalk 📖

> Learn languages through AI-powered interactive stories

RuneTalk is a full-stack SaaS application that helps users learn new languages through immersive, AI-generated stories. Stories progressively blend the user's native language with their target language, creating a natural learning experience.

## ✨ Features

### Core Features
- 🤖 **AI Story Generation** - Dynamic stories using OpenAI/Gemini
- 📚 **Progressive Language Blending** - Start 90% native, gradually increase target language
- 🎯 **Hover Translations** - Instant word translations on hover
- 📝 **Grammar Explanations** - Contextual grammar notes
- 🗂️ **Vocabulary Tracking** - Save and review words with spaced repetition
- 🎧 **Audio Narration** - TTS for both languages
- 📊 **Learning Analytics** - Track progress, streaks, and mastery
- 🎮 **Chapter Quizzes** - Test comprehension and retention
- 🔖 **Bookmarks & Progress** - Save and resume stories
- 📱 **Mobile App** - React Native with offline support
- 🌙 **Dark Mode** - Eye-friendly reading

### Monetization
- **Free Tier**: 3 stories/day, 100 vocabulary words, ads
- **Premium**: Unlimited stories, vocabulary, advanced features, no ads
- **Stripe Integration**: Monthly ($9.99) and yearly ($99.99) subscriptions

### Admin Dashboard
- User management
- Revenue analytics
- AI usage tracking
- Content moderation
- System monitoring

## 🏗️ Tech Stack

### Frontend
- **Web**: React + Vite + TailwindCSS + ShadCN UI
- **Mobile**: React Native + Expo
- **State**: Zustand
- **Auth**: Firebase Authentication

### Backend
- **Server**: Node.js + Express
- **Database**: PostgreSQL
- **Auth**: Firebase Admin SDK
- **Payments**: Stripe
- **AI**: OpenAI GPT-4 / Google Gemini

### Infrastructure
- **Web Hosting**: Vercel
- **Backend**: Railway / Render / Supabase
- **Database**: PostgreSQL (managed)
- **Mobile**: Expo EAS

## 📁 Project Structure

```
RuneTalk/
├── backend/               # Express API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, rate limiting
│   │   ├── config/       # Database, env
│   │   └── server.js     # Entry point
│   └── package.json
│
├── frontend/             # React web app
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── lib/          # API, Firebase, utils
│   │   ├── store/        # Zustand state
│   │   └── main.jsx      # Entry point
│   └── package.json
│
├── mobile/               # React Native app
│   ├── app/              # Expo Router pages
│   ├── lib/              # API, Firebase
│   ├── store/            # State management
│   └── package.json
│
├── database/             # SQL schema
│   └── schema.sql        # PostgreSQL schema
│
└── docs/                 # Documentation
    ├── DEPLOYMENT.md     # Deployment guide
    └── API.md            # API documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL
- Firebase project
- Stripe account
- OpenAI or Gemini API key

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/RuneTalk.git
cd RuneTalk
```

### 2. Setup Backend
```bash
cd backend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials

# Run migrations
npm run migrate

# Start server
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials

# Start dev server
npm run dev
```

### 4. Setup Mobile (Optional)
```bash
cd mobile
npm install

# Copy environment file
cp .env.example .env

# Start Expo
npm start
```

## 📝 Environment Variables

### Backend
```env
DATABASE_URL=postgresql://...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend
```env
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

See `.env.example` files for complete configuration.

## 📊 Database Schema

```sql
- users (Firebase auth + subscription data)
- subscriptions (Stripe subscription tracking)
- stories (User-created story metadata)
- chapters (Generated chapter content)
- vocabulary (Saved words with SRS)
- progress (Reading progress tracking)
- quiz_results (Quiz performance)
- payments (Stripe payment records)
- ai_usage (Cost tracking)
- admin_logs (Admin actions)
```

## 🔐 Authentication Flow

1. User signs up via Firebase (Email or Google)
2. Frontend gets Firebase ID token
3. Backend verifies token and creates/updates user
4. User data stored in PostgreSQL
5. JWT session maintained for API calls

## 💳 Payment Flow

1. User clicks "Subscribe"
2. Frontend creates Stripe Checkout session
3. User completes payment
4. Stripe webhook notifies backend
5. Backend updates user subscription status
6. Frontend reflects premium access

## 🤖 Story Generation

1. User selects: genre, native lang, target lang, difficulty
2. Backend calculates language mix (10% increase per chapter)
3. AI generates story with:
   - Progressive language blending
   - Target words marked with translations
   - Grammar explanations
   - Quiz questions
4. Content parsed and stored in database
5. Frontend renders with interactive translations

## 📱 Mobile Features

- Full feature parity with web
- Offline story reading
- Offline vocabulary drills
- Downloaded TTS audio
- Biometric login
- Push notifications for study reminders
- Background sync

## 🎨 Design System

Using ShadCN UI components with Tailwind CSS:
- Consistent spacing, typography, colors
- Dark mode support
- Responsive layouts
- Accessible components

## 📈 Analytics

Track:
- Daily reading time
- Words learned
- Chapter completion
- Quiz scores
- Language progress
- Reading streaks

## 🔒 Security

- Environment variables for secrets
- Firebase auth tokens
- Stripe webhook signature verification
- SQL injection protection (parameterized queries)
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js security headers

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

## 📖 API Documentation

See [docs/API.md](docs/API.md) for detailed API documentation.

Key endpoints:
- `POST /api/stories` - Create story
- `POST /api/stories/:id/chapters` - Generate chapter
- `POST /api/vocabulary` - Save word
- `POST /api/subscriptions/checkout` - Create checkout
- `GET /api/progress/stats` - Get user stats

## 🚢 Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment guide.

Quick deploy:
```bash
# Deploy backend to Railway
railway up

# Deploy frontend to Vercel
vercel

# Build mobile apps
eas build --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 💬 Support

- Email: support@runetalk.com
- Documentation: https://docs.runetalk.com
- Issues: GitHub Issues

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Google for Gemini API
- Stripe for payment processing
- Firebase for authentication
- Expo for mobile framework
- All open-source contributors

---

Built with ❤️ by the RuneTalk team
