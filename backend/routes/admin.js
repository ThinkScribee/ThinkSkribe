import express from 'express';
import { protect} from '../middlewares/auth.js';
import { 
  getUsers, 
  getUser, 
  updateUser, 
  deleteUser,
  getStats, 
  getWriters,
  approveWriter,
  publishWriter,
  unpublishWriter,
  getAllAgreements,
  getAllJobs,
  fixPaymentStatuses, 
  fixPaymentCalculations,
  debugPayments
} from '../controllers/adminController.js';
import {role} from '../middlewares/role.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, role('admin'));

// User Management
router.get('/users', getUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Dashboard Statistics
router.get('/stats', getStats);

// Writer Management
router.get('/writers', getWriters);
router.post('/writers/:id/approve', approveWriter);
router.post('/writers/:id/publish', publishWriter);
router.post('/writers/:id/unpublish', unpublishWriter);

// Agreement Management
router.get('/agreements', getAllAgreements);
// Job Management
router.get('/jobs', getAllJobs);

// System Fixes
router.post('/fix-payment-statuses', fixPaymentStatuses);
router.post('/fix-payment-calculations', fixPaymentCalculations);

// Debug endpoints
router.get('/debug-payments', debugPayments);

export default router;
