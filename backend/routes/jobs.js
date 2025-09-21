import express from 'express';
import {
  getJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
  applyForJob,
  acceptApplication,
  uploadJobAttachment,
  getJobPricing,
  getJobStats,
  searchJobs
} from '../controllers/jobController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

// Public routes
router.get('/pricing', getJobPricing);
router.get('/search', searchJobs);
router.get('/', getJobs);

// Protected routes
router.use(protect);

// Job management routes (students) - MUST come before /:id route
router.get('/my-jobs', authorize('student'), getMyJobs);
router.post('/', authorize('student'), createJob);
router.put('/:id', authorize('student'), updateJob);
router.delete('/:id', authorize('student'), deleteJob);

// Single job route (must come after specific routes)
router.get('/:id', getJob);
router.post('/:id/attachments', authorize('student'), upload.single('file'), uploadJobAttachment);

// Application routes (writers)
router.post('/:id/apply', authorize('writer'), applyForJob);

// Application management routes (job owners)
router.put('/:id/accept-application/:applicationId', acceptApplication);

// Admin routes
router.get('/stats/overview', authorize('admin'), getJobStats);

export default router;
