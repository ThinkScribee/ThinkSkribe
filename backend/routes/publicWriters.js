// routes/publicWriters.js
import express from 'express';
import { getRecommendedWriters } from '../controllers/userController.js';

const router = express.Router();

// Public routes for writers (no authentication required)
router.get('/recommended-writers', getRecommendedWriters);

export default router;
