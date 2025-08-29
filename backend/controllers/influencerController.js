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

    res.status(200).json({
      success: true,
      count: influencers.length,
      data: influencers
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

  res.status(200).json({
    success: true,
    data: {
      influencer,
      stats: {
        totalSignups: influencer.stats.totalSignups,
        totalRevenue: influencer.stats.totalRevenue,
        totalCommission: influencer.stats.totalCommission,
        monthlySignups,
        recentSignups,
        conversionRate: influencer.followers > 0 ? 
          ((influencer.stats.totalSignups / influencer.followers) * 100).toFixed(2) : 0
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
      referralUrl: influencer.referralUrl
    }
  });
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

    const totalSignups = influencers.reduce((sum, inf) => sum + (inf.stats?.totalSignups || 0), 0);
    const totalRevenue = influencers.reduce((sum, inf) => sum + (inf.stats?.totalRevenue || 0), 0);
    const totalCommission = influencers.reduce((sum, inf) => sum + (inf.stats?.totalCommission || 0), 0);

    // Get top performing influencers
    const topInfluencers = influencers
      .sort((a, b) => (b.stats?.totalSignups || 0) - (a.stats?.totalSignups || 0))
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
        platformBreakdown: influencers.reduce((acc, inf) => {
          const platform = inf.platform || 'other';
          acc[platform] = (acc[platform] || 0) + (inf.stats?.totalSignups || 0);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error in getInfluencerAnalytics:', error);
    return next(new ErrorResponse('Failed to fetch analytics', 500));
  }
});
