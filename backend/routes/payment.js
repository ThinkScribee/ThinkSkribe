import express from 'express';
import { protect } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import {
  createCheckoutSession,
  handlePaymentWebhook,
  getPaymentMethods,
  attachPaymentMethod,
  createSubscription,
  cancelSubscription,
  getPaymentHistory,
  refundPayment,
  getPaymentSession,
  createPaymentIntent,
  createEnhancedCheckoutSession,
  handleEnhancedPaymentWebhook,
  manualVerifyPayment
} from '../controllers/paymentController.js';

const router = express.Router();

// Payment checkout routes
router.post('/checkout', protect, createCheckoutSession);
router.post('/enhanced-checkout', protect, createEnhancedCheckoutSession);

// Payment intent routes
router.post('/create-intent', protect, createPaymentIntent);

// Manual verification route
router.post('/manual-verify/:reference', protect, manualVerifyPayment);

// Webhook routes (no authentication needed)
router.post('/webhook', handlePaymentWebhook);
router.post('/enhanced-webhook', handleEnhancedPaymentWebhook);

// Payment session routes
router.get('/session/:sessionId', protect, getPaymentSession);

// Payment method management
router.get('/methods', protect, getPaymentMethods);
router.post('/methods/attach', protect, attachPaymentMethod);

// Subscription management
router.post('/subscription', protect, createSubscription);
router.delete('/subscription/:subscriptionId', protect, cancelSubscription);

// Payment history and management
router.get('/history', protect, getPaymentHistory);
router.post('/refund/:paymentId', protect, role('admin'), refundPayment);

export default router;