import Stripe from 'stripe';
import { query } from '../config/database.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID,
    amount: 999, // $9.99
    interval: 'month'
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID,
    amount: 9999, // $99.99
    interval: 'year'
  }
};

export const createCustomer = async (userId, email, name) => {
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: { userId }
  });

  await query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customer.id, userId]
  );

  return customer;
};

export const createSubscription = async (userId, planType) => {
  // Get or create customer
  const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
  const user = userResult.rows[0];

  let customerId = user.stripe_customer_id;

  if (!customerId) {
    const customer = await createCustomer(userId, user.email, user.display_name);
    customerId = customer.id;
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: PLANS[planType].priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    metadata: {
      userId,
      planType
    }
  });

  return session;
};

export const cancelSubscription = async (userId) => {
  const subResult = await query(
    'SELECT * FROM subscriptions WHERE user_id = $1 AND status = $2',
    [userId, 'active']
  );

  if (subResult.rows.length === 0) {
    throw new Error('No active subscription found');
  }

  const subscription = subResult.rows[0];

  // Cancel at period end
  await stripe.subscriptions.update(subscription.stripe_subscription_id, {
    cancel_at_period_end: true
  });

  await query(
    'UPDATE subscriptions SET cancel_at_period_end = true WHERE id = $1',
    [subscription.id]
  );

  return { message: 'Subscription will cancel at period end' };
};

export const handleWebhook = async (event) => {
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutComplete(event.data.object);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

async function handleCheckoutComplete(session) {
  const userId = session.metadata.userId;
  const customerId = session.customer;

  await query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customerId, userId]
  );
}

async function handleSubscriptionUpdate(subscription) {
  const customerId = subscription.customer;

  // Find user
  const userResult = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length === 0) return;

  const userId = userResult.rows[0].id;
  const status = subscription.status;
  const planType = subscription.items.data[0].price.recurring.interval === 'month' ? 'monthly' : 'yearly';

  // Upsert subscription
  await query(
    `INSERT INTO subscriptions (
      user_id, stripe_subscription_id, stripe_price_id, status, plan_type,
      current_period_start, current_period_end, cancel_at_period_end
    ) VALUES ($1, $2, $3, $4, $5, to_timestamp($6), to_timestamp($7), $8)
    ON CONFLICT (stripe_subscription_id) DO UPDATE SET
      status = $4,
      current_period_start = to_timestamp($6),
      current_period_end = to_timestamp($7),
      cancel_at_period_end = $8,
      updated_at = NOW()`,
    [
      userId,
      subscription.id,
      subscription.items.data[0].price.id,
      status,
      planType,
      subscription.current_period_start,
      subscription.current_period_end,
      subscription.cancel_at_period_end
    ]
  );

  // Update user subscription status
  const tier = status === 'active' ? 'premium' : 'free';
  await query(
    'UPDATE users SET subscription_tier = $1, subscription_status = $2 WHERE id = $3',
    [tier, status, userId]
  );
}

async function handleSubscriptionDeleted(subscription) {
  await query(
    'UPDATE subscriptions SET status = $1 WHERE stripe_subscription_id = $2',
    ['canceled', subscription.id]
  );

  const userResult = await query(
    'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
    [subscription.id]
  );

  if (userResult.rows.length > 0) {
    await query(
      'UPDATE users SET subscription_tier = $1, subscription_status = $2 WHERE id = $3',
      ['free', 'inactive', userResult.rows[0].user_id]
    );
  }
}

async function handlePaymentSucceeded(invoice) {
  const customerId = invoice.customer;
  const userResult = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length === 0) return;

  await query(
    `INSERT INTO payments (user_id, stripe_payment_intent_id, stripe_invoice_id, amount, currency, status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userResult.rows[0].id,
      invoice.payment_intent,
      invoice.id,
      invoice.amount_paid,
      invoice.currency,
      'succeeded',
      `Payment for ${invoice.lines.data[0]?.description || 'subscription'}`
    ]
  );
}

async function handlePaymentFailed(invoice) {
  const customerId = invoice.customer;
  const userResult = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length === 0) return;

  await query(
    `INSERT INTO payments (user_id, stripe_payment_intent_id, stripe_invoice_id, amount, currency, status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userResult.rows[0].id,
      invoice.payment_intent,
      invoice.id,
      invoice.amount_due,
      invoice.currency,
      'failed',
      'Payment failed'
    ]
  );
}

export const getSubscriptionStatus = async (userId) => {
  const result = await query(
    `SELECT s.*, u.subscription_tier, u.subscription_status
     FROM subscriptions s
     JOIN users u ON s.user_id = u.id
     WHERE s.user_id = $1 AND s.status IN ('active', 'trialing')
     ORDER BY s.created_at DESC LIMIT 1`,
    [userId]
  );

  return result.rows[0] || null;
};

export const createPortalSession = async (userId) => {
  const userResult = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [userId]);

  if (!userResult.rows[0]?.stripe_customer_id) {
    throw new Error('No customer found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: userResult.rows[0].stripe_customer_id,
    return_url: `${process.env.FRONTEND_URL}/settings`,
  });

  return session;
};
