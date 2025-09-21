import express from 'express';
import crypto from 'crypto';
import { handleEnhancedPaymentWebhook } from '../controllers/paymentController.js';

const router = express.Router();

// Middleware to verify Paystack webhook
const verifyPaystackWebhook = (req, res, next) => {
  const signature = req.headers['x-paystack-signature'];
  
  // Skip verification if no webhook secret is configured (for testing)
  if (!process.env.PAYSTACK_WEBHOOK_SECRET) {
    console.log('⚠️ PAYSTACK_WEBHOOK_SECRET not configured, skipping verification');
    return next();
  }
  
  if (!signature) {
    console.log('⚠️ No Paystack signature found in headers');
    return res.status(401).json({ error: 'No signature provided' });
  }
  
  const body = JSON.stringify(req.body);
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET).update(body).digest('hex');
  
  console.log('🔐 Signature verification:', {
    provided: signature,
    computed: hash,
    match: signature === hash
  });
  
  if (signature !== hash) {
    console.log('🔴 Paystack webhook signature verification failed');
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  console.log('✅ Paystack webhook signature verified');
  next();
};

// Middleware to verify Stripe webhook
const verifyStripeWebhook = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  try {
    const { default: Stripe } = await import('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const body = req.body;
    
    // Verify webhook signature
    stripe.webhooks.constructEvent(body, signature, endpointSecret);
    next();
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid signature' });
  }
};

// Paystack webhook endpoint
router.post('/paystack', verifyPaystackWebhook, async (req, res) => {
  console.log('🔔 PAYSTACK WEBHOOK RECEIVED!');
  console.log('🔔 Headers:', req.headers);
  console.log('🔔 Body:', JSON.stringify(req.body, null, 2));
  
  try {
    await handleEnhancedPaymentWebhook(req, res, 'paystack');
  } catch (error) {
    console.error('🔴 Paystack webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Stripe webhook endpoint
router.post('/stripe', verifyStripeWebhook, async (req, res) => {
  try {
    await handleEnhancedPaymentWebhook(req, res, 'stripe');
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Also add a simple test endpoint to check if webhooks are working
router.post('/test', (req, res) => {
  console.log('🔔 TEST WEBHOOK RECEIVED!');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({ success: true, message: 'Test webhook received', timestamp: new Date().toISOString() });
});

export default router; 