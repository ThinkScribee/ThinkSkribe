import express from 'express';
import { protect } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import {
  createAgreement,
  acceptAgreement,
  getAgreements,
  getAgreement,
  updateProgress,
  cancelAgreement,
  createPaymentSession,
  completeAgreement,
  getPaymentRecommendation
} from '../controllers/agreementController.js';

const router = express.Router();

// All agreement routes require authentication
router.use(protect);

// Create a new service agreement (students only)
router.post('/', role('student'), createAgreement);

// Get all agreements for current user
router.get('/', getAgreements);

// Get specific agreement by ID
router.get('/:id', getAgreement);

// Accept agreement (writers only) - Fixed to use consistent :id parameter
router.post('/:id/accept', role('writer'), acceptAgreement);

// Complete agreement (writers only)
router.post('/:id/complete', role('writer'), completeAgreement);

// Cancel agreement (writers only)
router.post('/:id/cancel', role('writer'), cancelAgreement);

// Update agreement progress (writers only)
router.put('/:id/progress', role('writer'), updateProgress);

// Get payment recommendation for agreement (students only)
router.get('/:id/payment-recommendation', role('student'), getPaymentRecommendation);

// Create payment session for agreement (students only)
router.post('/:id/payment', role('student'), createPaymentSession);

export default router;
