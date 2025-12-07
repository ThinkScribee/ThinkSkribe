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
router.get('/:id', getJob);

// Protected routes
router.use(protect);

// Job management routes (students)
router.post('/', authorize('student'), createJob);
router.get('/my-jobs', authorize('student'), getMyJobs);
router.put('/:id', authorize('student'), updateJob);
router.delete('/:id', authorize('student'), deleteJob);
router.post('/:id/attachments', authorize('student'), upload.single('file'), uploadJobAttachment);

// Application routes (writers)
router.post('/:id/apply', authorize('writer'), applyForJob);

// Application management routes (job owners)
router.put('/:id/accept-application/:applicationId', acceptApplication);

// Admin routes
router.get('/stats/overview', authorize('admin'), getJobStats);

export default router;
