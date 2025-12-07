// routes/writer.js
import express from 'express';
import { protect } from '../middlewares/auth.js';
import { role } from '../middlewares/role.js';
import {
  requestWriter,
  getWriterAgreements,
  submitWork,
  completeWork,
  updateAssignmentProgress,
  getWriterProfile,
  searchWriters,
  updateWriterProfile
} from '../controllers/writerController.js';
import {
  getWriterDashboard,
  acceptServiceAgreement,
  completeServiceAgreement
} from '../controllers/writerDashboardController.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public writer routes (for students to view)
router.get('/search', searchWriters);
router.get('/:id/profile', getWriterProfile);

// Writer-specific routes
router.get('/dashboard', role('writer'), getWriterDashboard);
router.get('/agreements', role('writer'), getWriterAgreements);
router.post('/agreements/:id/accept', role('writer'), acceptServiceAgreement);
router.put('/agreements/:id/complete', role('writer'), completeServiceAgreement);
router.post('/assignments/:id/submit', role('writer'), submitWork);
router.put('/assignments/:id/complete', role('writer'), completeWork);
router.patch('/assignments/:id/progress', role('writer'), updateAssignmentProgress);
router.put('/profile', role('writer'), updateWriterProfile);

// Student routes for requesting writers
router.post('/request', role('student'), requestWriter);

export default router;