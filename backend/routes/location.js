import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import {
  detectLocation,
  getLocationSummary,
  getLocationCurrency,
  getLocationByIP,
  isAfricanCountry,
  getCacheStats,
  clearCache,
  getExternalIPLocation
} from '../controllers/locationController.js';

const router = Router();

// Public routes (no authentication required)
router.get('/detect', detectLocation);
router.get('/summary', getLocationSummary);
router.get('/currency', getLocationCurrency);
router.get('/external-ip', getExternalIPLocation);
router.get('/is-african/:countryCode', isAfricanCountry);

// Protected routes (authentication required)
router.use(protect);

// Admin/authenticated routes
router.post('/ip', getLocationByIP);
router.get('/cache-stats', getCacheStats);
router.delete('/cache', clearCache);

export default router; 