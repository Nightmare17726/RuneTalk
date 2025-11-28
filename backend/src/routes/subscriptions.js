import express from 'express';
import { verifyFirebaseToken } from '../middleware/auth.js';
import {
  createSubscription,
  cancelSubscription,
  getSubscriptionStatus,
  createPortalSession,
  handleWebhook
} from '../services/stripeService.js';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
router.post('/checkout', verifyFirebaseToken, async (req, res) => {
  try {
    const { planType } = req.body;

    if (!['monthly', 'yearly'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const session = await createSubscription(req.user.id, planType);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Get subscription status
router.get('/status', verifyFirebaseToken, async (req, res) => {
  try {
    const subscription = await getSubscriptionStatus(req.user.id);

    res.json({
      subscription,
      isPremium: req.user.subscription_tier === 'premium' && req.user.subscription_status === 'active'
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Cancel subscription
router.post('/cancel', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await cancelSubscription(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Create portal session
router.post('/portal', verifyFirebaseToken, async (req, res) => {
  try {
    const session = await createPortalSession(req.user.id);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await handleWebhook(event);

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
