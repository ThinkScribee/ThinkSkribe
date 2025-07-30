// routes/user.js
import express from 'express';
import { protect } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js'; // Import role middleware
import { upload } from '../utils/upload.js'; // Import multer upload middleware
import {
  getProfile,
  updateProfile,
  updatePaymentTerms,
  getFiles,
  fetchStudentDashboardData, // Import new controller function
  getRecommendedWriters, // Import new controller function
  uploadFile
} from '../controllers/userController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/files/:type', upload.single('file'), uploadFile);

// Student-specific routes
router.get('/dashboard/student', role('student'), fetchStudentDashboardData); // Route for student dashboard data
router.get('/recommended-writers', role('student'), getRecommendedWriters); // Route for recommended writers

// Payment terms
router.put('/payment-terms', updatePaymentTerms);

// Files
router.get('/files', getFiles);

export default router;
