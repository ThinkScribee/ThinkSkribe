// controllers/userController.js
import User from '../models/User.js';
import File from '../models/File.js';
import ServiceAgreement from '../models/ServiceAgreement.js';
import Payment from '../models/Payment.js';
import Chat from '../models/Chat.js';
import { uploadToS3 } from '../utils/upload.js';
import { getIO } from '../socket.js';
import Notification from '../models/Notification.js';
import asyncHandler from '../middlewares/async.js';
import Order from '../models/Order.js';
import Agreement from '../models/Agreement.js';
import SupportTicket from '../models/Support.js';
import ErrorResponse from '../utils/errorResponse.js';

// Utility function to round monetary values to 2 decimal places
const roundMoney = (value) => Math.round(value * 100) / 100;

// Centralized function to calculate financial stats for a user
const calculateFinancialStats = async (userId, role) => {
  const payments = await Payment.find({ [role]: userId });

  // Total Spent (for students) or Total Earned (for writers)
  // This is the sum of all *completed* transactions.
  const totalCompleted = payments
    .filter(p => p.status === 'completed' || p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Pending Amount: Sum of all payments that are not yet completed.
  // This represents future payments (pending, scheduled, or due).
  const pendingAmount = payments
    .filter(p => ['pending', 'scheduled', 'due'].includes(p.status))
    .reduce((sum, p) => sum + (p.amount || 0), 0);
    
  return {
    totalCompleted: roundMoney(totalCompleted),
    pendingAmount: roundMoney(pendingAmount),
    payments, // Return payments to avoid re-fetching
  };
};

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    next(new ErrorResponse('Failed to fetch user profile', 500));
  }
});

/**
 * @desc    Update user profile
 * @route   PUT /api/user/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      location: req.body.location,
      preferences: req.body.preferences
    };

    // Handle writer profile updates
    if (req.user.role === 'writer' && req.body.writerProfile) {
      fieldsToUpdate.writerProfile = req.body.writerProfile;
    }

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    next(new ErrorResponse('Failed to update profile', 500));
  }
});

/**
 * @desc    Update payment terms (for students or writers)
 * @route   PUT /api/user/payment-terms
 * @access  Private
 */
export const updatePaymentTerms = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { paymentTerms: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user.paymentTerms
    });
  } catch (error) {
    console.error('Error updating payment terms:', error);
    next(new ErrorResponse('Failed to update payment terms', 500));
  }
});

/**
 * @desc    Upload avatar OR assignment 
 * @route   POST /api/user/files/:type
 * @access  Private
 */
export const uploadFile = asyncHandler(async (req, res) => {
  // Multer has buffered file into req.file
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const { type } = req.params; // expected values: 'avatar' or 'assignment'

  if (type === 'avatar') {
    // Upload to S3 → avatars/ folder
    const s3Data = await uploadToS3(req.file, 'avatars');
    
    // Save s3Data.Location to user.avatar
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.avatar = s3Data.Location;
    await user.save();
    
    // Return the complete avatar URL
    return res.json({
      success: true,
      message: 'Profile picture updated successfully!',
      data: { avatarUrl: s3Data.Location },
      avatarUrl: s3Data.Location, // Also return it at root level for backward compatibility
    });
  }

  if (type === 'assignment') {
    // Upload to S3 → assignments/ folder
    const s3Data = await uploadToS3(req.file, 'assignments');
    // Create a new File document
    const fileDoc = await File.create({
      user: req.user._id,
      filename: s3Data.Key,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      key: s3Data.Key,
      url: s3Data.Location,
    });
    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully!',
      data: fileDoc,
    });
  }

  return res.status(400).json({ message: 'Invalid upload type' });
});

/**
 * @desc    Get user's uploaded files
 * @route   GET /api/user/files
 * @access  Private
 */
export const getFiles = asyncHandler(async (req, res) => {
  try {
    // This would typically fetch files from a database or storage service
    // For now, return empty array
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    next(new ErrorResponse('Failed to fetch files', 500));
  }
});

/**
 * @desc    Get student dashboard data
 * @route   GET /api/user/dashboard/student
 * @access  Private (Student)
 */
export const fetchStudentDashboardData = asyncHandler(async (req, res, next) => {
  const studentId = req.user.id;

  const agreements = await Agreement.find({ student: studentId })
    .populate('writer', 'name email avatar writerProfile')
    .sort({ createdAt: -1 });

  const { totalCompleted, pendingAmount, payments } = await calculateFinancialStats(studentId, 'student');

  let activeProjects = 0, completedProjects = 0, cancelledProjects = 0;
  agreements.forEach(a => {
    if (a.status === 'active' || a.status === 'in-progress') activeProjects++;
    if (a.status === 'completed') completedProjects++;
    if (a.status === 'cancelled') cancelledProjects++;
  });
  
  const averageProjectValue = completedProjects > 0 ? roundMoney(totalCompleted / completedProjects) : 0;

  // Calculate monthly spending from payments and agreements
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  let monthlySpending = 0;
  let projectsThisMonth = 0;
  
  // Calculate from payments made this month
  payments.forEach(payment => {
    const paymentDate = new Date(payment.paymentDate || payment.createdAt);
    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
      if (payment.status === 'completed' || payment.status === 'succeeded') {
        monthlySpending += payment.amount || 0;
      }
    }
  });
  
  // Also check installments in agreements for this month's payments
  agreements.forEach(agreement => {
    if (agreement.installments && agreement.installments.length > 0) {
      agreement.installments.forEach(installment => {
        if (installment.status === 'paid' && installment.paymentDate) {
          const paymentDate = new Date(installment.paymentDate);
          if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
            monthlySpending += installment.amount || 0;
          }
        }
      });
    }
    
    // Count projects created this month
    const agreementDate = new Date(agreement.createdAt);
    if (agreementDate.getMonth() === currentMonth && agreementDate.getFullYear() === currentYear) {
      projectsThisMonth++;
    }
  });

  const recentActivity = payments.slice(0, 10).map(p => ({
    _id: p._id,
    type: 'payment',
    status: p.status,
    amount: p.amount,
    date: p.paymentDate || p.createdAt,
    description: `Payment for agreement: ${p.agreement?._id}`,
  }));

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalSpent: totalCompleted,
        pendingPayments: pendingAmount,
        activeProjects,
        completedProjects,
        averageProjectValue,
        monthlySpending: roundMoney(monthlySpending),
        projectsThisMonth,
      },
      agreements,
      payments,
      recentActivity,
    },
  });
});

/**
 * @desc    Get writer dashboard data
 * @route   GET /api/user/dashboard/writer
 * @access  Private (Writer)
 */
export const fetchWriterDashboardData = asyncHandler(async (req, res, next) => {
  const writerId = req.user.id;

  const agreements = await Agreement.find({ writer: writerId })
    .populate('student', 'name email avatar')
    .sort({ createdAt: -1 });

  const { totalCompleted, pendingAmount, payments } = await calculateFinancialStats(writerId, 'writer');

  let activeProjects = 0, completedProjects = 0, openAgreements = 0;
  agreements.forEach(a => {
    if (a.status === 'active' || a.status === 'in-progress') activeProjects++;
    if (a.status === 'completed') completedProjects++;
    if (a.status === 'pending') openAgreements++;
  });
  
  // Calculate average rating from completed agreements
  const ratedAgreements = agreements.filter(a => a.status === 'completed' && a.rating > 0);
  const averageRating = ratedAgreements.length > 0
    ? roundMoney(ratedAgreements.reduce((sum, a) => sum + a.rating, 0) / ratedAgreements.length)
    : 0;

  const recentActivity = payments.slice(0, 10).map(p => ({
    _id: p._id,
    type: 'payment',
    status: p.status,
    amount: p.amount,
    date: p.paymentDate || p.createdAt,
    description: `Payment from ${p.student?.name || 'student'}`,
  }));

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalEarnings: totalCompleted,
        pendingClearance: pendingAmount,
        activeProjects,
        completedProjects,
        openAgreements,
        averageRating,
      },
      agreements,
      payments,
      recentActivity,
    },
  });
});

export const getRecommendedWriters = asyncHandler(async (req, res, next) => {
  try {
    console.log('Fetching recommended writers for user:', req.user.id);
    
    // Find writers with good ratings and availability - ONLY PUBLISHED WRITERS
    const writers = await User.find({
      role: 'writer',
      isActive: { $ne: false }, // Include users where isActive is true or undefined
      'writerProfile.isApproved': true, // Only approved writers
      'writerProfile.isPublished': true, // Only published writers
      $or: [
        { 'writerProfile.availability': 'available' },
        { 'writerProfile.availability': { $exists: false } } // Include writers without availability set
      ]
    })
    .select('name email avatar writerProfile createdAt')
    .sort({ 'writerProfile.rating.average': -1, createdAt: -1 })
    .limit(10);
    
    console.log(`Found ${writers.length} recommended published writers`);
    
    // Format writers with proper default values
    const formattedWriters = writers.map(writer => ({
      _id: writer._id,
      name: writer.name || 'Writer',
      email: writer.email,
      avatar: writer.avatar,
      writerProfile: {
        bio: writer.writerProfile?.bio || 'Experienced academic writer',
        specialization: writer.writerProfile?.specialization || ['General Writing'],
        rating: {
          average: writer.writerProfile?.rating?.average || 4.5,
          count: writer.writerProfile?.rating?.count || 5
        },
        completedProjects: writer.writerProfile?.completedProjects || 10,
        availability: writer.writerProfile?.availability || 'available',
        hourlyRate: writer.writerProfile?.hourlyRate || 25,
        isApproved: writer.writerProfile?.isApproved || false,
        isPublished: writer.writerProfile?.isPublished || false
      }
    }));
    
    console.log('Formatted published writers:', formattedWriters.length);
    
    // Return writers directly at the top level for consistency with other endpoints
    res.status(200).json(formattedWriters);
  } catch (error) {
    console.error('Error fetching recommended writers:', error);
    next(new ErrorResponse('Failed to fetch recommended writers', 500));
  }
});