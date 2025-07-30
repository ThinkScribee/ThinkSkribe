import express from 'express';
import { protect} from '../middlewares/auth.js';
import { 
  getUsers, 
  getUser, 
  updateUser, 
  getStats, 
  getWriters,
  approveWriter,
  publishWriter,
  unpublishWriter,
  getAllAgreements,
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

// Dashboard Statistics
router.get('/stats', getStats);

// Writer Management
router.get('/writers', getWriters);
router.post('/writers/:id/approve', approveWriter);
router.post('/writers/:id/publish', publishWriter);
router.post('/writers/:id/unpublish', unpublishWriter);

// Agreement Management
router.get('/agreements', getAllAgreements);

// System Fixes
router.post('/fix-payment-statuses', fixPaymentStatuses);
router.post('/fix-payment-calculations', fixPaymentCalculations);

// Debug endpoints
router.get('/debug-payments', debugPayments);

export default router;