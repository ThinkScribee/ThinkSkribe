import express from 'express';
import {
  createInfluencer,
  getInfluencers,
  getInfluencer,
  updateInfluencer,
  deleteInfluencer,
  getInfluencerDashboard,
  getInfluencerByReferralCode,
  trackReferralSignup,
  getInfluencerAnalytics
} from '../controllers/influencerController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Public routes
router.get('/referral/:code', getInfluencerByReferralCode);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.get('/', authorize('admin'), getInfluencers);
router.post('/', authorize('admin'), createInfluencer);

router.get('/:id', authorize('admin'), getInfluencer);
router.put('/:id', authorize('admin'), updateInfluencer);
router.delete('/:id', authorize('admin'), deleteInfluencer);

router.get('/:id/dashboard', authorize('admin'), getInfluencerDashboard);
router.get('/analytics/overview', authorize('admin'), getInfluencerAnalytics);

// Track referral signup (for authenticated users)
router.post('/track-signup', trackReferralSignup);

export default router;
