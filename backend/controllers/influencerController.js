import Influencer from '../models/Influencer.js';
import User from '../models/User.js';
import asyncHandler from '../middlewares/async.js';
import ErrorResponse from '../utils/errorResponse.js';

// @desc    Create new influencer
// @route   POST /api/influencers
// @access  Private (Admin only)
export const createInfluencer = asyncHandler(async (req, res, next) => {
  const { name, email, referralCode, platform, followers, commission, notes } = req.body;

  // Check if referral code already exists
  const existingInfluencer = await Influencer.findOne({ 
    $or: [{ email }, { referralCode: referralCode.toUpperCase() }] 
  });

  if (existingInfluencer) {
    return next(new ErrorResponse('Influencer with this email or referral code already exists', 400));
  }

  const influencer = await Influencer.create({
    name,
    email,
    referralCode: referralCode.toUpperCase(),
    platform,
    followers: followers || 0,
    commission: commission || 10,
    notes,
    isActive: true
  });

  res.status(201).json({
    success: true,
    data: influencer
  });
});

// @desc    Get all influencers
// @route   GET /api/influencers
// @access  Private (Admin only)
export const getInfluencers = asyncHandler(async (req, res, next) => {
  try {
    console.log('Fetching all influencers...');
    
    const influencers = await Influencer.find().sort({ createdAt: -1 });
    
    console.log(`Found ${influencers.length} influencers`);

    // Update each influencer with actual signup counts
    const influencersWithActualCounts = [];
    
    for (const influencer of influencers) {
      // Get actual signup count from database
      const actualSignupCount = await User.countDocuments({ 
        referredBy: influencer._id 
      });
      
      // Create influencer object with actual counts
      const influencerWithActualCount = {
        ...influencer.toObject(),
        stats: {
          ...influencer.stats,
          totalSignups: actualSignupCount // Use actual count instead of recorded
        }
      };
      
      influencersWithActualCounts.push(influencerWithActualCount);
    }

    console.log(`📊 Updated influencers with actual signup counts`);

    res.status(200).json({
      success: true,
      count: influencers.length,
      data: influencersWithActualCounts
    });
  } catch (error) {
    console.error('Error in getInfluencers:', error);
    return next(new ErrorResponse('Failed to fetch influencers', 500));
  }
});

// @desc    Get single influencer
// @route   GET /api/influencers/:id
// @access  Private (Admin only)
export const getInfluencer = asyncHandler(async (req, res, next) => {
  const influencer = await Influencer.findById(req.params.id);

  if (!influencer) {
    return next(new ErrorResponse(`Influencer not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: influencer
  });
});

// @desc    Update influencer
// @route   PUT /api/influencers/:id
// @access  Private (Admin only)
export const updateInfluencer = asyncHandler(async (req, res, next) => {
  let influencer = await Influencer.findById(req.params.id);

  if (!influencer) {
    return next(new ErrorResponse(`Influencer not found with id of ${req.params.id}`, 404));
  }

  // If updating referral code, check for uniqueness
  if (req.body.referralCode) {
    req.body.referralCode = req.body.referralCode.toUpperCase();
    const existingInfluencer = await Influencer.findOne({ 
      referralCode: req.body.referralCode,
      _id: { $ne: req.params.id }
    });

    if (existingInfluencer) {
      return next(new ErrorResponse('Referral code already exists', 400));
    }
  }

  influencer = await Influencer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: influencer
  });
});

// @desc    Delete influencer
// @route   DELETE /api/influencers/:id
// @access  Private (Admin only)
export const deleteInfluencer = asyncHandler(async (req, res, next) => {
  const influencer = await Influencer.findById(req.params.id);

  if (!influencer) {
    return next(new ErrorResponse(`Influencer not found with id of ${req.params.id}`, 404));
  }

  // Use deleteOne instead of remove (deprecated)
  await Influencer.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get influencer dashboard stats
// @route   GET /api/influencers/:id/dashboard
// @access  Private (Admin only)
export const getInfluencerDashboard = asyncHandler(async (req, res, next) => {
  const influencer = await Influencer.findById(req.params.id);

  if (!influencer) {
    return next(new ErrorResponse(`Influencer not found with id of ${req.params.id}`, 404));
  }

  // Get referred users using the influencer's _id (not req.params.id as string)
  const referredUsers = await User.find({ referredBy: influencer._id })
    .select('name email role createdAt')
    .sort({ createdAt: -1 });

  // Get monthly stats
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const monthlySignups = await User.countDocuments({
    referredBy: influencer._id,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
  });

  // Get recent signups (last 30 days)
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentSignups = await User.countDocuments({
    referredBy: influencer._id,
    createdAt: { $gte: thirtyDaysAgo }
  });

  // Calculate actual signup count from database
  const actualSignupCount = referredUsers.length;
  const recordedSignupCount = influencer.stats?.totalSignups || 0;

  // Log any discrepancies for debugging
  if (actualSignupCount !== recordedSignupCount) {
    console.log(`⚠️ [Dashboard] Signup count discrepancy for ${influencer.name}:`);
    console.log(`   Recorded: ${recordedSignupCount}, Actual: ${actualSignupCount}`);
  }

  res.status(200).json({
    success: true,
    data: {
      influencer,
      stats: {
        totalSignups: actualSignupCount, // Use actual count from database
        totalRevenue: influencer.stats?.totalRevenue || 0,
        totalCommission: influencer.stats?.totalCommission || 0,
        monthlySignups,
        recentSignups,
        conversionRate: influencer.followers > 0 ? 
          ((actualSignupCount / influencer.followers) * 100).toFixed(2) : 0,
        // Add discrepancy info for debugging
        discrepancy: actualSignupCount !== recordedSignupCount ? {
          recorded: recordedSignupCount,
          actual: actualSignupCount,
          difference: actualSignupCount - recordedSignupCount
        } : null
      },
      referredUsers
    }
  });
});

// @desc    Get influencer by referral code
// @route   GET /api/influencers/referral/:code
// @access  Public
export const getInfluencerByReferralCode = asyncHandler(async (req, res, next) => {
  const { code } = req.params;

  console.log('Looking for influencer with code:', code.toUpperCase());

  const influencer = await Influencer.findOne({ 
    referralCode: code.toUpperCase(),
    isActive: true
  });

  if (!influencer) {
    console.log('Influencer not found for code:', code.toUpperCase());
    return next(new ErrorResponse('Invalid referral code', 404));
  }

  console.log('Found influencer:', influencer.name, influencer.platform);

  res.status(200).json({
    success: true,
    data: {
      _id: influencer._id,
      name: influencer.name,
      platform: influencer.platform || 'other', // Provide default if platform is missing
      referralCode: influencer.referralCode,
      referralUrl: influencer.referralUrl,
      writersReferralUrl: influencer.writersReferralUrl
    }
  });
});

// @desc    Track referral visit (public)
// @route   POST /api/influencers/track-visit
// @access  Public
export const trackReferralVisit = asyncHandler(async (req, res, next) => {
  try {
    const { referralCode, page } = req.body || {};

    if (!referralCode) {
      return next(new ErrorResponse('Referral code is required', 400));
    }

    const influencer = await Influencer.findOne({
      referralCode: referralCode.toUpperCase(),
      isActive: true
    });

    if (!influencer) {
      return next(new ErrorResponse('Invalid referral code', 404));
    }

    await influencer.incrementVisit(page);

    return res.status(200).json({
      success: true,
      message: 'Referral visit tracked',
      data: {
        referralCode: influencer.referralCode,
        page: page || 'unknown'
      }
    });
  } catch (error) {
    console.error('Error tracking referral visit:', error);
    return next(new ErrorResponse('Failed to track referral visit', 500));
  }
});

// @desc    Track referral signup
// @route   POST /api/influencers/track-signup
// @access  Private
export const trackReferralSignup = asyncHandler(async (req, res, next) => {
  const { referralCode, userId } = req.body;

  console.log('Tracking referral signup:', { referralCode, userId });

  if (!referralCode || !userId) {
    return next(new ErrorResponse('Referral code and user ID are required', 400));
  }

  const influencer = await Influencer.findOne({ 
    referralCode: referralCode.toUpperCase(),
    isActive: true
  });

  if (!influencer) {
    console.log('Influencer not found for referral tracking:', referralCode);
    return next(new ErrorResponse('Invalid referral code', 404));
  }

  // Update user with referral information
  const user = await User.findByIdAndUpdate(userId, {
    referredBy: influencer._id,
    referralCode: influencer.referralCode
  }, { new: true });

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Increment influencer stats
  await influencer.incrementSignup();

  console.log('Referral tracked successfully for:', influencer.name);

  res.status(200).json({
    success: true,
    message: 'Referral tracked successfully',
    data: {
      influencer: influencer.name,
      referralCode: influencer.referralCode
    }
  });
});

// @desc    Get overall influencer analytics
// @route   GET /api/influencers/analytics/overview
// @access  Private (Admin only)
export const getInfluencerAnalytics = asyncHandler(async (req, res, next) => {
  try {
    const influencers = await Influencer.find({ isActive: true });

    console.log(`Found ${influencers.length} active influencers for analytics`);

    // Calculate actual signup counts from database instead of using recorded stats
    let totalSignups = 0;
    let totalRevenue = 0;
    let totalCommission = 0;
    const influencersWithActualCounts = [];

    for (const influencer of influencers) {
      // Get actual signup count from database
      const actualSignupCount = await User.countDocuments({ 
        referredBy: influencer._id 
      });
      
      // Create influencer object with actual counts
      const influencerWithActualCount = {
        ...influencer.toObject(),
        actualSignupCount,
        stats: {
          ...influencer.stats,
          totalSignups: actualSignupCount // Use actual count
        }
      };
      
      influencersWithActualCounts.push(influencerWithActualCount);
      
      // Add to totals
      totalSignups += actualSignupCount;
      totalRevenue += influencer.stats?.totalRevenue || 0;
      totalCommission += influencer.stats?.totalCommission || 0;
    }

    console.log(`📊 Analytics totals: ${totalSignups} total signups, ${totalRevenue} revenue, ${totalCommission} commission`);

    // Get top performing influencers using actual counts
    const topInfluencers = influencersWithActualCounts
      .sort((a, b) => b.actualSignupCount - a.actualSignupCount)
      .slice(0, 5);

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({
      referredBy: { $exists: true, $ne: null },
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalInfluencers: influencers.length,
          totalSignups,
          totalRevenue,
          totalCommission,
          recentSignups
        },
        topInfluencers,
        platformBreakdown: influencersWithActualCounts.reduce((acc, inf) => {
          const platform = inf.platform || 'other';
          acc[platform] = (acc[platform] || 0) + inf.actualSignupCount;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error in getInfluencerAnalytics:', error);
    return next(new ErrorResponse('Failed to fetch analytics', 500));
  }
});

// @desc    Sync referral counts for all influencers
// @route   POST /api/influencers/sync-referral-counts
// @access  Private (Admin only)
export const syncReferralCounts = asyncHandler(async (req, res, next) => {
  try {
    console.log('🔄 Starting referral count sync...');
    
    const influencers = await Influencer.find({});
    const syncResults = [];
    
    for (const influencer of influencers) {
      console.log(`\n📊 Syncing ${influencer.name} (${influencer.referralCode}):`);
      
      // Count actual users referred by this influencer
      const actualReferredUsers = await User.find({ 
        referredBy: influencer._id 
      });
      
      const actualSignupCount = actualReferredUsers.length;
      const recordedSignupCount = influencer.stats?.totalSignups || 0;
      
      console.log(`   - Recorded: ${recordedSignupCount}, Actual: ${actualSignupCount}`);
      
      if (actualSignupCount !== recordedSignupCount) {
        console.log(`   🔧 Updating count from ${recordedSignupCount} to ${actualSignupCount}`);
        
        // Update the influencer's stats
        await Influencer.findByIdAndUpdate(influencer._id, {
          $set: {
            'stats.totalSignups': actualSignupCount,
            'stats.lastSignup': actualReferredUsers.length > 0 
              ? new Date(Math.max(...actualReferredUsers.map(u => new Date(u.createdAt)))) 
              : undefined,
            updatedAt: new Date()
          }
        });
        
        syncResults.push({
          influencer: influencer.name,
          referralCode: influencer.referralCode,
          oldCount: recordedSignupCount,
          newCount: actualSignupCount,
          updated: true
        });
      } else {
        console.log(`   ✅ Count is accurate`);
        syncResults.push({
          influencer: influencer.name,
          referralCode: influencer.referralCode,
          oldCount: recordedSignupCount,
          newCount: actualSignupCount,
          updated: false
        });
      }
    }
    
    const updatedCount = syncResults.filter(r => r.updated).length;
    
    console.log(`\n✅ Sync completed! Updated ${updatedCount} out of ${influencers.length} influencers`);
    
    res.status(200).json({
      success: true,
      message: `Referral counts synced successfully. Updated ${updatedCount} influencers.`,
      data: {
        totalInfluencers: influencers.length,
        updatedInfluencers: updatedCount,
        results: syncResults
      }
    });
  } catch (error) {
    console.error('Error in syncReferralCounts:', error);
    return next(new ErrorResponse('Failed to sync referral counts', 500));
  }
});
