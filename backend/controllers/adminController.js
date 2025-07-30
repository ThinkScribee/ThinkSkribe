import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import Payment from '../models/Payment.js';
import ServiceAgreement from '../models/ServiceAgreement.js';
import Chat from '../models/Chat.js';
import Notification from '../models/Notification.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: { users }
    });
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json({
      success: true,
      data: { user }
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
export const getStats = async (req, res, next) => {
  try {
    // User Statistics
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({ role: 'student' });
    const writerCount = await User.countDocuments({ role: 'writer' });
    const adminCount = await User.countDocuments({ role: 'admin' });
    
    // Writer Statistics
    const publishedWriters = await User.countDocuments({ 
      role: 'writer', 
      'writerProfile.isPublished': true 
    });
    const approvedWriters = await User.countDocuments({ 
      role: 'writer', 
      'writerProfile.isApproved': true 
    });
    const pendingWriters = await User.countDocuments({ 
      role: 'writer', 
      'writerProfile.isApproved': false 
    });

    // Agreement Statistics
    const totalAgreements = await ServiceAgreement.countDocuments();
    const activeAgreements = await ServiceAgreement.countDocuments({ status: 'active' });
    const completedAgreements = await ServiceAgreement.countDocuments({ status: 'completed' });
    const pendingAgreements = await ServiceAgreement.countDocuments({ status: 'pending' });

    // Debug: Check what payments exist
    const debugPayments = await Payment.find({}).limit(5);
    console.log('🔍 [Debug] Sample payments found:', debugPayments.length);
    debugPayments.forEach(payment => {
      console.log(`  - Status: ${payment.status}, Amount: ${payment.amount}, Date: ${payment.paymentDate || payment.createdAt}`);
    });

    // Get all unique payment statuses to debug
    const allStatuses = await Payment.distinct('status');
    console.log('🎯 [Debug] All payment statuses in DB:', allStatuses);

    // Revenue Statistics - Use all payments regardless of status
    const allPayments = await Payment.find({});
    console.log('💰 [Debug] Total payments found:', allPayments.length);
    
    // Calculate revenue from payments
    let totalWriterEarningsFromPayments = 0;
    let totalGrossRevenue = 0;
    
    allPayments.forEach(payment => {
      const writerAmount = payment.writerAmount || (payment.amount * 1.0) || 0; // Platform fee removed
      totalWriterEarningsFromPayments += writerAmount;
      totalGrossRevenue += payment.amount || 0;
    });

    // Also calculate from ServiceAgreements (same as writer dashboard)
    const allAgreements = await ServiceAgreement.find({});
    let totalWriterEarningsFromAgreements = 0;
    
    console.log('📋 [Debug] ServiceAgreements found:', allAgreements.length);
    allAgreements.forEach(agreement => {
      if (agreement.paidAmount > 0) {
        console.log(`  - Agreement: ${agreement._id}, paidAmount: ${agreement.paidAmount}`);
        // Platform fee removed - writers get full amount
        const writerShare = agreement.paidAmount * 1.0;
        totalWriterEarningsFromAgreements += writerShare;
      }
    });

    // Use the higher value (same logic as writer dashboard)
    const actualWriterEarnings = Math.max(totalWriterEarningsFromAgreements, totalWriterEarningsFromPayments);
    const actualPlatformRevenue = totalGrossRevenue - actualWriterEarnings;

    // Monthly Revenue - Use ServiceAgreements since no Payment records exist
    let monthlyPlatformRevenue = [];
    
    if (allPayments.length > 0) {
      // Use payments if they exist
      monthlyPlatformRevenue = await Payment.aggregate([
        {
          $addFields: {
            effectiveDate: {
              $ifNull: [
                '$paymentDate',
                { $ifNull: ['$createdAt', '$updatedAt'] }
              ]
            }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: '$effectiveDate' },
              month: { $month: '$effectiveDate' }
            },
            platformRevenue: { 
              $sum: { 
                $ifNull: [
                  '$platformFee', 
                  { $multiply: ['$amount', 0.2] }
                ] 
              }
            },
            writerEarnings: { 
              $sum: { 
                $ifNull: [
                  '$writerAmount', 
                  { $multiply: ['$amount', 0.8] }
                ] 
              }
            },
            grossRevenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
    } else {
      // Use ServiceAgreements for monthly breakdown since no payments exist
      monthlyPlatformRevenue = await ServiceAgreement.aggregate([
        {
          $match: {
            paidAmount: { $gt: 0 } // Only include paid agreements
          }
        },
        {
          $addFields: {
            effectiveDate: {
              $ifNull: ['$updatedAt', '$createdAt']
            }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: '$effectiveDate' },
              month: { $month: '$effectiveDate' }
            },
            platformRevenue: { 
              $sum: { $multiply: ['$paidAmount', 0.2] }
            },
            writerEarnings: { 
              $sum: { $multiply: ['$paidAmount', 0.8] }
            },
            grossRevenue: { $sum: '$paidAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
    }

    console.log('📊 [Debug] Monthly breakdown result:', monthlyPlatformRevenue);
    console.log('💰 [Debug] actualPlatformRevenue:', actualPlatformRevenue);
    console.log('💰 [Debug] actualWriterEarnings:', actualWriterEarnings);
    console.log('💰 [Debug] totalGrossRevenue:', totalGrossRevenue);
    
    // If no monthly data from payments, try ServiceAgreements
    if (monthlyPlatformRevenue.length === 0) {
      console.log('🔄 [Debug] No monthly payment data, trying ServiceAgreements...');
      const monthlyFromAgreements = await ServiceAgreement.aggregate([
        {
          $match: {
            paidAmount: { $gt: 0 }
          }
        },
        {
          $addFields: {
            effectiveDate: {
              $ifNull: ['$updatedAt', '$createdAt']
            }
          }
        },
        {
          $group: {
            _id: { 
              year: { $year: '$effectiveDate' },
              month: { $month: '$effectiveDate' }
            },
            platformRevenue: { 
              $sum: { $multiply: ['$paidAmount', 0.2] }
            },
            writerEarnings: { 
              $sum: { $multiply: ['$paidAmount', 0.8] }
            },
            grossRevenue: { $sum: '$paidAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]);
      
      console.log('📈 [Debug] Monthly from ServiceAgreements:', monthlyFromAgreements);
      
      // Use agreement data if available
      if (monthlyFromAgreements.length > 0) {
        monthlyPlatformRevenue = monthlyFromAgreements;
      }
    }

    // Recent Activities
    const recentUsers = await User.find()
      .select('name email role createdAt isActive')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentAgreements = await ServiceAgreement.find()
      .populate('student', 'name email')
      .populate('writer', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    console.log('👥 [Debug] Recent users found:', recentUsers.length);
    console.log('📄 [Debug] Recent agreements found:', recentAgreements.length);
    recentUsers.slice(0, 2).forEach(user => {
      console.log(`  - User: ${user.name}, Role: ${user.role}, Created: ${user.createdAt}`);
    });
    recentAgreements.slice(0, 2).forEach(agreement => {
      console.log(`  - Agreement: ${agreement._id}, Amount: ${agreement.totalAmount || agreement.paidAmount}, Status: ${agreement.status}`);
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          students: studentCount,
          writers: writerCount,
          admins: adminCount
        },
        writers: {
          total: writerCount,
          published: publishedWriters,
          approved: approvedWriters,
          pending: pendingWriters
        },
        agreements: {
          total: totalAgreements,
          active: activeAgreements,
          completed: completedAgreements,
          pending: pendingAgreements
        },
        revenue: {
          platformRevenue: Math.round(actualPlatformRevenue * 100) / 100,
          writerEarnings: Math.round(actualWriterEarnings * 100) / 100,
          grossRevenue: Math.round(totalGrossRevenue * 100) / 100,
          transactions: allPayments.length,
          monthlyBreakdown: monthlyPlatformRevenue
        },
        recentActivity: {
          users: recentUsers,
          agreements: recentAgreements
        }
      }
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    next(err);
  }
};

/**
 * @desc    Get all writers with pagination and filtering (including earnings)
 * @route   GET /api/admin/writers
 * @access  Private (Admin)
 */
export const getWriters = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    
    let query = { role: 'writer' };
    
    // Filter by approval status
    if (status === 'approved') {
      query['writerProfile.isApproved'] = true;
    } else if (status === 'pending') {
      query['writerProfile.isApproved'] = false;
    } else if (status === 'published') {
      query['writerProfile.isPublished'] = true;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const writers = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get earnings data for each writer (using same logic as writerDashboardController)
    const writersWithEarnings = await Promise.all(
      writers.map(async (writer) => {
        const writerId = writer._id;
        
        // Method 1: Calculate from ServiceAgreements (same as writer dashboard)
        const agreements = await ServiceAgreement.find({ writer: writerId });
        let totalEarningsFromAgreements = 0;
        
        agreements.forEach(agreement => {
          if (agreement.paidAmount > 0) {
            // Platform fee removed - writers get full amount
            const writerShare = agreement.paidAmount * 1.0;
            totalEarningsFromAgreements += writerShare;
          }
        });

        // Method 2: Calculate from Payment model (same as writer dashboard)
        const payments = await Payment.find({ 
          writer: writerId, 
          status: { $in: ['completed', 'succeeded', 'paid'] } 
        });
        const totalEarningsFromPayments = payments.reduce((sum, p) => 
          sum + (p.writerAmount || p.amount || 0), 0
        );

        // Use the higher of the two calculations (same as writer dashboard)
        const totalEarnings = Math.max(totalEarningsFromAgreements, totalEarningsFromPayments);

        return {
          ...writer.toObject(),
          earnings: {
            total: Math.round(totalEarnings * 100) / 100,
            payments: payments.length,
            average: payments.length > 0 ? Math.round((totalEarnings / payments.length) * 100) / 100 : 0,
            lastPaymentDate: payments.length > 0 ? payments[payments.length - 1].paymentDate : null
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        writers: writersWithEarnings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching writers:', err);
    next(err);
  }
};

/**
 * @desc    Approve a writer
 * @route   POST /api/admin/writers/:id/approve
 * @access  Private (Admin)
 */
export const approveWriter = async (req, res, next) => {
  try {
    const writer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'writer' },
      { 
        'writerProfile.isApproved': true,
        'writerProfile.approvedAt': new Date()
      },
      { new: true }
    ).select('-password');

    if (!writer) {
      return res.status(404).json({
        success: false,
        message: 'Writer not found'
      });
    }

    // Create notification for the writer
    await Notification.create({
      user: writer._id,
      type: 'system',
      title: 'Writer Application Approved',
      message: 'Congratulations! Your writer application has been approved. You can now start accepting projects.',
      link: '/writer/dashboard'
    });

    res.json({
      success: true,
      message: 'Writer approved successfully',
      data: writer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Publish a writer (make visible to students)
 * @route   POST /api/admin/writers/:id/publish
 * @access  Private (Admin)
 */
export const publishWriter = async (req, res, next) => {
  try {
    const writer = await User.findOneAndUpdate(
      { 
        _id: req.params.id, 
        role: 'writer',
        'writerProfile.isApproved': true // Can only publish approved writers
      },
      { 
        'writerProfile.isPublished': true,
        'writerProfile.publishedAt': new Date()
      },
      { new: true }
    ).select('-password');

    if (!writer) {
      return res.status(404).json({
        success: false,
        message: 'Writer not found or not approved'
      });
    }

    // Create notification for the writer
    await Notification.create({
      user: writer._id,
      type: 'system',
      title: 'Profile Published',
      message: 'Your writer profile is now live and visible to students. Start receiving project requests!',
      link: '/writer/dashboard'
    });

    res.json({
      success: true,
      message: 'Writer published successfully',
      data: writer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Unpublish a writer (hide from students)
 * @route   POST /api/admin/writers/:id/unpublish
 * @access  Private (Admin)
 */
export const unpublishWriter = async (req, res, next) => {
  try {
    const writer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'writer' },
      { 
        'writerProfile.isPublished': false,
        'writerProfile.unpublishedAt': new Date()
      },
      { new: true }
    ).select('-password');

    if (!writer) {
      return res.status(404).json({
        success: false,
        message: 'Writer not found'
      });
    }

    res.json({
      success: true,
      message: 'Writer unpublished successfully',
      data: writer
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all agreements with comprehensive details
 * @route   GET /api/admin/agreements
 * @access  Private (Admin)
 */
export const getAllAgreements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { 'projectDetails.title': { $regex: search, $options: 'i' } },
        { 'projectDetails.subject': { $regex: search, $options: 'i' } }
      ];
    }

    const agreements = await ServiceAgreement.find(query)
      .populate('student', 'name email avatar')
      .populate('writer', 'name email avatar writerProfile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ServiceAgreement.countDocuments(query);

    res.json({
      success: true,
      data: {
        agreements,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Fix payment statuses that are stuck in processing
 * @route   POST /api/admin/fix-payment-statuses
 * @access  Private (Admin)
 */
export const fixPaymentStatuses = async (req, res, next) => {
  try {
    // Find all agreements with processing installments
    const agreements = await ServiceAgreement.find({
      'installments.status': 'processing'
    });
    
    let fixedCount = 0;
    
    // Update each agreement
    for (const agreement of agreements) {
      let updated = false;
      
      // Fix each processing installment
      agreement.installments.forEach(installment => {
        if (installment.status === 'processing') {
          installment.status = 'paid';
          installment.isPaid = true;
          if (!installment.paymentDate) {
            installment.paymentDate = new Date();
          }
          updated = true;
          fixedCount++;
        }
      });
      
      if (updated) {
        await agreement.save();
      }
    }
    
    // Also update any processing payments
    const paymentsResult = await Payment.updateMany(
      { status: 'processing' },
      { $set: { status: 'completed' } }
    );
    
    res.json({
      success: true,
      message: `Fixed ${fixedCount} installments and ${paymentsResult.modifiedCount} payments`,
      fixedInstallments: fixedCount,
      fixedPayments: paymentsResult.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Fix payment calculations by recalculating paidAmount from installments
 * @route   POST /api/admin/fix-payment-calculations
 * @access  Private (Admin)
 */
export const fixPaymentCalculations = async (req, res, next) => {
  try {
    console.log('🔧 Starting payment calculation fix...');
    
    // Find all agreements
    const agreements = await ServiceAgreement.find({});
    
    let fixedCount = 0;
    let totalProcessed = 0;
    
    // Process each agreement
    for (const agreement of agreements) {
      totalProcessed++;
      
      let calculatedPaidAmount = 0;
      let hasChanges = false;
      
      if (agreement.installments && agreement.installments.length > 0) {
        // Calculate based on installments
        agreement.installments.forEach((installment) => {
          // Fix any 'processing' status to 'paid' 
          if (installment.status === 'processing') {
            installment.status = 'paid';
            installment.isPaid = true;
            if (!installment.paymentDate) {
              installment.paymentDate = new Date();
            }
            hasChanges = true;
          }
          
          // Count paid installments
          if (installment.status === 'paid') {
            calculatedPaidAmount += installment.amount || 0;
          }
        });
        
        // Update the agreement if paidAmount is incorrect
        if (Math.abs(agreement.paidAmount - calculatedPaidAmount) > 0.01) {
          agreement.paidAmount = calculatedPaidAmount;
          hasChanges = true;
        }
        
        // Update payment status
        const remainingAmount = (agreement.totalAmount || 0) - calculatedPaidAmount;
        if (Math.abs(remainingAmount) < 0.01) {
          if (agreement.paymentStatus !== 'completed') {
            agreement.paymentStatus = 'completed';
            hasChanges = true;
          }
        } else if (calculatedPaidAmount > 0) {
          if (agreement.paymentStatus !== 'partial') {
            agreement.paymentStatus = 'partial';
            hasChanges = true;
          }
        } else {
          if (agreement.paymentStatus !== 'pending') {
            agreement.paymentStatus = 'pending';
            hasChanges = true;
          }
        }
      }
      
      // Save if there are changes
      if (hasChanges) {
        await agreement.save();
        fixedCount++;
      }
    }
    
    res.json({
      success: true,
      message: `Fixed payment calculations for ${fixedCount} out of ${totalProcessed} agreements`,
      fixedCount,
      totalProcessed
    });
  } catch (err) {
    console.error('Error fixing payment calculations:', err);
    next(err);
  }
};
/**
 * @desc    Debug payments - check actual payment statuses and amounts
 * @route   GET /api/admin/debug-payments
 * @access  Private (Admin)
 */
export const debugPayments = async (req, res, next) => {
  try {
    console.log('🔍 [Debug] Checking payments in database...');
    
    // Get all payments
    const allPayments = await Payment.find({}).sort({ createdAt: -1 });
    console.log('💰 [Debug] Total payments found:', allPayments.length);
    
    // Get payment statuses breakdown
    const statusBreakdown = {};
    let totalAmountAll = 0;
    let totalAmountSucceeded = 0;
    let totalAmountCompleted = 0;
    
    allPayments.forEach(payment => {
      const status = payment.status;
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      totalAmountAll += payment.amount || 0;
      
      if (status === 'succeeded') totalAmountSucceeded += payment.amount || 0;
      if (status === 'completed') totalAmountCompleted += payment.amount || 0;
    });
    
    console.log('📊 [Debug] Status breakdown:', statusBreakdown);
    console.log('💵 [Debug] Total amount (all statuses):', totalAmountAll);
    console.log('💵 [Debug] Total amount (succeeded):', totalAmountSucceeded);
    console.log('💵 [Debug] Total amount (completed):', totalAmountCompleted);
    
    // Test the current revenue query
    const currentRevenueQuery = await Payment.aggregate([
      { $match: { status: { $in: ['completed', 'succeeded'] } } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);
    
    // Test alternative revenue query (all successful Stripe statuses)
    const alternativeRevenueQuery = await Payment.aggregate([
      { $match: { status: { $in: ['paid', 'succeeded', 'completed', 'success'] } } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      debug: {
        totalPayments: allPayments.length,
        statusBreakdown,
        totalAmountAll,
        currentRevenueResult: currentRevenueQuery[0] || { totalRevenue: 0, totalTransactions: 0 },
        alternativeRevenueResult: alternativeRevenueQuery[0] || { totalRevenue: 0, totalTransactions: 0 },
        samplePayments: allPayments.slice(0, 3).map(p => ({
          id: p._id,
          amount: p.amount,
          status: p.status,
          paymentDate: p.paymentDate,
          createdAt: p.createdAt
        }))
      }
    });
  } catch (err) {
    console.error('❌ [Debug] Error:', err);
    next(err);
  }
};