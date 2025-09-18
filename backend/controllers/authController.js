// authController.js - Fixed version without duplicate referral tracking
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Influencer from '../models/Influencer.js';
import { generateToken } from '../utils/generateToken.js';
import asyncHandler from '../middlewares/async.js';
import ErrorResponse from '../utils/errorResponse.js';
import { sendWelcomeEmail, sendPasswordResetEmail, testEmailService } from '../services/emailService.js';
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
  const { name, email, password, role, referralCode } = req.body;
  
  console.log('Registration attempt:', { name, email, role, referralCode });
  
  // Validate role - only student and writer are allowed for registration
  if (role && !['student', 'writer'].includes(role)){
    return next(new ErrorResponse('Invalid role. Only student and writer registration is allowed.', 400));
  }
  
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new ErrorResponse('User already exists', 400));
  }

  // Check referral code if provided
  let influencer = null;
  if (referralCode) {
    console.log('Checking referral code:', referralCode);
    
    influencer = await Influencer.findOne({ 
      referralCode: referralCode.toUpperCase(),
      isActive: true
    });
    
    if (!influencer) {
      console.log('Invalid referral code provided:', referralCode);
      return next(new ErrorResponse('Invalid referral code', 400));
    }
    
    console.log('Found valid influencer for referral:', influencer.name);
  }

  const verificationToken = crypto.randomBytes(20).toString('hex');
  const user = await User.create({ 
    name, 
    email, 
    password, 
    role: role || 'student', // Default to student if no role provided
    verificationToken,
    isVerified: true,
    referredBy: influencer?._id,
    referralCode: influencer?.referralCode
  });
  
  console.log('User created successfully:', user._id);
    
  // Create subscription based on role
  if (role === 'student' || role === 'writer') {
    await Subscription.create({ user: user._id, plan: 'free' });
    console.log('Subscription created for user:', user._id);
  }

  // Track referral signup for influencer
  if (influencer) {
    try {
      console.log('🔄 Tracking referral signup for influencer:', influencer.name, 'Code:', influencer.referralCode);
      
      // Ensure we have the latest influencer data
      const freshInfluencer = await Influencer.findById(influencer._id);
      if (!freshInfluencer) {
        console.error('❌ Influencer not found during tracking:', influencer._id);
        return;
      }
      
      // Increment signup count and save
      await freshInfluencer.incrementSignup();
      console.log('✅ Referral signup tracked successfully for influencer:', freshInfluencer.name, 'Code:', freshInfluencer.referralCode);
      console.log('📊 New signup count:', freshInfluencer.stats.totalSignups);
    } catch (error) {
      console.error('❌ Error tracking referral signup:', error);
      console.error('❌ Error details:', error.message);
      // Don't fail registration if referral tracking fails, but log the issue
    }
  }

  // Send welcome email
  try {
    await sendWelcomeEmail(user);
    console.log('✅ Welcome email sent to:', user.email);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error.message);
    // Don't fail registration if welcome email fails, but log the issue
  }

  sendTokenResponse(user, 201, res);
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }
  
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.matchPassword(password))) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

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

  // Create reset url using CLIENT_URL environment variable
  const resetUrl = `${process.env.CLIENT_URL || 'https://thinqscribe.com'}/reset-password/${resetToken}`;

  console.log('🔗 Generated reset URL:', resetUrl);

  try {
    // Send password reset email
    await sendPasswordResetEmail(user, resetToken);
    console.log('✅ Password reset email sent to:', user.email);

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.error('❌ Failed to send password reset email:', err.message);
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

// Test email functionality
export const testEmail = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return next(new ErrorResponse('Email is required for testing', 400));
  }

  try {
    const result = await testEmailService(email);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Test email sent successfully',
        data: result.result
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Email service error',
      error: error.message
    });
  }
});
