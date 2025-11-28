# RuneTalk Deployment Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Firebase project
- Stripe account
- OpenAI or Gemini API key
- Vercel account (for frontend)
- Railway/Render/Supabase (for backend)

## Environment Setup

### Backend (.env)

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-domain.com

DATABASE_URL=postgresql://user:password@host:5432/database

FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

OPENAI_API_KEY=sk-...
# or
GEMINI_API_KEY=...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

JWT_SECRET=your-super-secret-key
```

### Frontend (.env)

```env
VITE_API_URL=https://api.your-domain.com
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Mobile (.env)

```env
EXPO_PUBLIC_API_URL=https://api.your-domain.com
EXPO_PUBLIC_FIREBASE_API_KEY=...
# ... (same Firebase config as frontend)
```

## Database Setup

1. Create PostgreSQL database:
```bash
createdb runetalk
```

2. Run migrations:
```bash
cd backend
npm install
npm run migrate
```

## Backend Deployment

### Option 1: Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add PostgreSQL:
```bash
railway add postgresql
```

4. Deploy:
```bash
railway up
```

5. Set environment variables in Railway dashboard

### Option 2: Render

1. Create new Web Service
2. Connect GitHub repository
3. Build command: `cd backend && npm install`
4. Start command: `cd backend && npm start`
5. Add PostgreSQL database
6. Set environment variables

### Option 3: Supabase + Backend on Cloud

1. Create Supabase project
2. Use Supabase PostgreSQL connection string
3. Deploy backend to any Node.js hosting
4. Configure webhooks

## Frontend Deployment (Vercel)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd frontend
vercel
```

3. Set environment variables in Vercel dashboard

4. Configure custom domain

## Mobile Deployment

### iOS

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure EAS:
```bash
cd mobile
eas build:configure
```

3. Build for iOS:
```bash
eas build --platform ios
```

4. Submit to App Store:
```bash
eas submit --platform ios
```

### Android

1. Build for Android:
```bash
eas build --platform android
```

2. Submit to Google Play:
```bash
eas submit --platform android
```

## Stripe Setup

1. Create products in Stripe Dashboard:
   - Monthly Premium ($9.99/month)
   - Yearly Premium ($99.99/year)

2. Copy price IDs to environment variables

3. Configure webhook endpoint:
   - URL: `https://api.your-domain.com/api/subscriptions/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

4. Copy webhook secret to environment variables

## Firebase Setup

1. Create Firebase project
2. Enable Authentication:
   - Email/Password
   - Google Sign-In
3. Add web app and mobile apps
4. Download service account JSON for backend
5. Copy config to environment variables

## Post-Deployment

1. Test authentication flow
2. Create test story
3. Test payment flow (use Stripe test mode first)
4. Test mobile sync
5. Monitor error logs
6. Set up monitoring (e.g., Sentry)

## Monitoring

Recommended tools:
- **Backend**: Sentry, LogRocket
- **Frontend**: Vercel Analytics, Sentry
- **Database**: Supabase Dashboard, pgAdmin
- **Payments**: Stripe Dashboard
- **AI Usage**: Custom dashboard at `/admin`

## Scaling Considerations

1. **Database**:
   - Add indexes for frequently queried fields
   - Enable connection pooling
   - Consider read replicas for heavy load

2. **Backend**:
   - Use Redis for session caching
   - Implement rate limiting
   - Add CDN for static assets

3. **AI**:
   - Monitor token usage
   - Implement queue for story generation
   - Cache common translations

4. **Mobile**:
   - Implement offline-first architecture
   - Use local database (SQLite)
   - Sync in background

## Security Checklist

- [ ] All API keys in environment variables
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] Stripe webhook signature verification
- [ ] Firebase rules configured
- [ ] Biometric auth enabled on mobile

## Backup Strategy

1. **Database**: Daily automated backups
2. **User data**: Weekly exports
3. **Payment records**: Stripe handles this
4. **Environment configs**: Store securely in password manager

## Support

For issues:
1. Check error logs
2. Review Stripe webhook logs
3. Check Firebase console
4. Monitor AI usage dashboard
5. Contact support@runetalk.com
