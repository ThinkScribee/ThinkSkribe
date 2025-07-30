// auth.js - Fixed routes
import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  verifyEmail
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.get('/verify/:token', verifyEmail);

// Protected routes
router.get('/me', protect, getMe);

export default router;