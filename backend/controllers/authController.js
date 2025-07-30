// authController.js - Fixed version
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { generateToken } from '../utils/generateToken.js';
import asyncHandler from '../middlewares/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import crypto from 'crypto';

// Helper function for sending token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    }
  });
};

export const register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  
  // Validate role - only student and writer are allowed for registration
  if (role && !['student', 'writer'].includes(role)) {
    return next(new ErrorResponse('Invalid role. Only student and writer registration is allowed.', 400));
  }
  
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ErrorResponse('User already exists', 400));
  }

  const verificationToken = crypto.randomBytes(20).toString('hex');
  const user = await User.create({ 
    name, 
    email, 
    password, 
    role: role || 'student', // Default to student if no role provided
    verificationToken,
    isVerified: true
  });
    
  // Create subscription based on role
  if (role === 'student' || role === 'writer') {
    await Subscription.create({ user: user._id, plan: 'free' });
  }

  sendTokenResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  sendTokenResponse(user, 200, res);
});

export const logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({ 
      success: true,
    message: 'Logged out successfully!' 
  });
});

export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('-password'); 
    if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  res.status(200).json({
      success: true,
    data: user
  });
});

export const forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    // Here you would send email
    console.log('Password reset email would be sent to:', user.email);
    console.log('Reset URL:', resetUrl);

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.log(err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

export const resetPassword = asyncHandler(async (req, res, next) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

    const user = await User.findOne({ 
    resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
    return next(new ErrorResponse('Invalid token', 400));
    }

  // Set new password
  user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

  sendTokenResponse(user, 200, res);
});

export const verifyEmail = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({
    emailVerificationToken: req.params.token,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid verification token', 400));
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

    res.status(200).json({
      success: true,
    message: 'Email verified successfully'
  });
});