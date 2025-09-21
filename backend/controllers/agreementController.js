import ServiceAgreement from '../models/ServiceAgreement.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { ORDER_STATUS } from '../models/constants.js';
import { getIO } from '../socket.js';
import { generateOrderId } from '../utils/helpers.js';
import Stripe from 'stripe';
import currencyService from '../services/backendCurrencyService.js';
import paymentGatewayService from '../services/paymentGatewayService.js';
import locationService from '../services/locationService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc    Create a new service agreement
 * @route   POST /api/agreements
 * @access  Private (Student)
 */
export const createAgreement = async (req, res, next) => {
  try {
    const {
      writerId,
      projectDetails,
      totalAmount,
      installments,
      paymentPreferences
    } = req.body;

    console.log('Creating agreement with enhanced payment data:', {
      writerId,
      totalAmount,
      paymentPreferences,
      installments: installments?.length
    });

    // Validate writer exists
    const writer = await User.findById(writerId);
    if (!writer || writer.role !== 'writer') {
      return res.status(404).json({ message: 'Writer not found' });
    }

    // Enhanced payment preferences handling
    const enhancedPaymentPrefs = {
      currency: paymentPreferences?.currency || 'usd',
      gateway: paymentPreferences?.gateway || 'stripe',
      location: paymentPreferences?.location || {},
      nativeAmount: paymentPreferences?.nativeAmount || totalAmount,
      exchangeRate: paymentPreferences?.exchangeRate || 1
    };

    // Create the agreement with enhanced payment tracking
    const agreement = new ServiceAgreement({
      student: req.user._id,
      writer: writerId,
      projectDetails,
      totalAmount,
      paidAmount: 0,
      installments: installments.map(inst => ({
        amount: inst.amount,
        dueDate: new Date(inst.dueDate),
        percentage: inst.percentage,
        status: 'pending',
        isPaid: false
      })),
      paymentPreferences: enhancedPaymentPrefs,
      paymentHistory: [],
      status: 'pending',
      paymentStatus: 'pending'
    });

    await agreement.save();

    // Populate the response
    const populatedAgreement = await ServiceAgreement.findById(agreement._id)
      .populate('student', 'name email')
      .populate('writer', 'name email');

    console.log('✅ Agreement created successfully:', {
      agreementId: agreement._id,
      currency: enhancedPaymentPrefs.currency,
      gateway: enhancedPaymentPrefs.gateway,
      totalAmount,
      nativeAmount: enhancedPaymentPrefs.nativeAmount
    });

    // Emit socket notification to writer
    const io = getIO();
    io.to(`user-${writerId}`).emit('newAgreement', {
      agreement: populatedAgreement,
      message: `New service agreement from ${req.user.name}`,
      studentName: req.user.name,
      projectTitle: projectDetails.title
    });

    res.status(201).json({
      success: true,
      agreement: populatedAgreement,
      message: 'Service agreement created successfully'
    });

  } catch (error) {
    console.error('Error creating agreement:', error);
    res.status(500).json({
      message: 'Failed to create agreement',
      error: error.message
    });
  }
};

/**
 * @desc    Accept a service agreement (Writer)
 * @route   POST /api/agreements/:id/accept
 * @access  Private (Writer)
 */
export const acceptAgreement = async (req, res, next) => {
  try {
    console.log('🔄 [Agreement] Accepting agreement:', req.params.id, 'by writer:', req.user._id);
    
    // Find and update agreement status
    const agreement = await ServiceAgreement.findOneAndUpdate(
      { 
        _id: req.params.id, 
        writer: req.user._id,
        status: 'pending'
      },
      { 
        status: 'active',
        acceptedAt: new Date()
      },
      { new: true }
    ).populate([
      { path: 'student', select: 'name email' },
      { path: 'writer', select: 'name email' }
    ]);

    if (!agreement) {
      console.error('❌ [Agreement] Agreement not found or already accepted:', req.params.id);
      return res.status(404).json({ 
        success: false,
        message: 'Agreement not found, already accepted, or you are not the assigned writer' 
      });
    }

    console.log('✅ [Agreement] Agreement accepted successfully:', agreement._id);

    // Create corresponding order for backward compatibility
    try {
      const order = await Order.create({
        student: agreement.student._id,
        writer: agreement.writer._id,
        title: agreement.projectDetails.title,
        description: agreement.projectDetails.description,
        orderId: generateOrderId(),
        totalAmount: agreement.totalAmount,
        installments: agreement.installments.map(inst => ({
          amount: inst.amount,
          dueDate: inst.dueDate,
          status: inst.status
        })),
        status: ORDER_STATUS.ACTIVE,
        agreementId: agreement._id
      });
      
      console.log('✅ [Agreement] Order created for agreement:', order._id);
    } catch (orderError) {
      console.warn('⚠️ [Agreement] Failed to create order, but agreement accepted:', orderError.message);
    }

    // Notify student through socket
    try {
      getIO().to(`user-${agreement.student._id}`).emit('agreementAccepted', {
        agreementId: agreement._id,
        orderId: null, // Will be set if order creation succeeds
        writerName: req.user.name,
        title: agreement.projectDetails.title,
        message: `Your agreement "${agreement.projectDetails.title}" has been accepted by ${req.user.name}`
      });
    } catch (socketError) {
      console.warn('⚠️ [Agreement] Socket notification failed:', socketError.message);
    }

    res.status(200).json({ 
      success: true,
      message: 'Agreement accepted successfully',
      agreement 
    });
  } catch (err) {
    console.error('❌ [Agreement] Error accepting agreement:', err);
    next(err);
  }
};

/**
 * @desc    Get all agreements for a user
 * @route   GET /api/agreements
 * @access  Private
 */
export const getAgreements = async (req, res, next) => {
  try {
    const query = req.user.role === 'student' 
      ? { student: req.user._id }
      : { writer: req.user._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const agreements = await ServiceAgreement.find(query)
      .populate('student', 'name email avatar')
      .populate('writer', 'name email avatar writerProfile')
      .sort('-createdAt');

    res.json(agreements);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get a single agreement by ID
 * @route   GET /api/agreements/:id
 * @access  Private
 */
export const getAgreement = async (req, res, next) => {
  try {
    const agreement = await ServiceAgreement.findOne({
      _id: req.params.id,
      $or: [
        { student: req.user._id },
        { writer: req.user._id }
      ]
    })
    .populate('student', 'name email avatar')
    .populate('writer', 'name email avatar writerProfile');

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    // Calculate total paid amount
    const totalPaid = agreement.installments
      ? agreement.installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
      : 0;

    // Add calculated fields
    const responseData = {
      ...agreement.toObject(),
      totalPaid,
      remainingAmount: agreement.totalAmount - totalPaid
    };

    res.json(responseData);
  } catch (err) {
    console.error('Error fetching agreement:', err);
    next(err);
  }
};

/**
 * @desc    Update agreement progress
 * @route   PUT /api/agreements/:id/progress
 * @access  Private (Writer)
 */
export const updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be a number between 0 and 100' });
    }

    const agreement = await ServiceAgreement.findOneAndUpdate(
      { 
        _id: req.params.id, 
        writer: req.user._id,
        status: 'active'
      },
      { progress },
      { new: true }
    ).populate([
      { path: 'student', select: 'name email' },
      { path: 'writer', select: 'name email' }
    ]);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found or not active' });
    }

    // Notify student of progress update
    getIO().to(`user-${agreement.student._id}`).emit('agreementProgressUpdated', {
      agreementId: agreement._id,
      progress,
      title: agreement.projectDetails.title
    });

    res.json(agreement);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel an agreement
 * @route   POST /api/agreements/:id/cancel
 * @access  Private (Writer)
 */
export const cancelAgreement = async (req, res, next) => {
  try {
    const agreement = await ServiceAgreement.findOneAndUpdate(
      { 
        _id: req.params.id, 
        writer: req.user._id,
        status: 'pending'
      },
      { status: 'cancelled' },
      { new: true }
    ).populate([
      { path: 'student', select: 'name email' },
      { path: 'writer', select: 'name email' }
    ]);

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found or cannot be cancelled' });
    }

    // Notify student of cancellation
    getIO().to(`user-${agreement.student._id}`).emit('agreementCancelled', {
      agreementId: agreement._id,
      writerName: req.user.name,
      title: agreement.projectDetails.title
    });

    res.json(agreement);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create an enhanced payment session for an agreement
 * @route   POST /api/agreements/:id/payment
 * @access  Private (Student)
 */
export const createPaymentSession = async (req, res, next) => {
  try {
    const { currency, gateway, paymentMethod = 'card' } = req.body;
    
    const agreement = await ServiceAgreement.findOne({
      _id: req.params.id,
      student: req.user._id,
      status: 'pending'
    }).populate('writer', 'name email');

    if (!agreement) {
      return res.status(404).json({ 
        message: 'Agreement not found or not eligible for payment' 
      });
    }

    // Get user's location for gateway recommendation
    const userIP = locationService.getClientIP(req);
    const locationData = await locationService.getLocationSummary(userIP);
    
    // Determine payment gateway and currency
    let selectedGateway = gateway;
    let selectedCurrency = currency;
    
    if (!selectedGateway) {
      const recommendation = paymentGatewayService.getRecommendedGateway(
        locationData.summary.countryCode
      );
      selectedGateway = recommendation.gateway;
    }
    
    if (!selectedCurrency) {
      selectedCurrency = paymentGatewayService.getDefaultCurrency(
        locationData.summary.countryCode
      );
    }

    // Convert amount to selected currency
    let convertedAmount = agreement.totalAmount;
    let exchangeRate = 1;
    
    if (selectedCurrency !== 'usd') {
      const conversion = await currencyService.convertCurrency(
        agreement.totalAmount, 
        'usd', 
        selectedCurrency
      );
      convertedAmount = conversion.amount;
      exchangeRate = conversion.rate;
    }

    // Create payment session based on gateway
    let paymentResult;
    
    if (selectedGateway === 'paystack') {
      paymentResult = await paymentGatewayService.createPaystackPayment(
        convertedAmount,
        selectedCurrency,
        req.user.email,
        {
          agreementId: agreement._id.toString(),
          studentId: req.user._id.toString(),
          writerId: agreement.writer._id.toString(),
          originalAmount: agreement.totalAmount,
          originalCurrency: 'usd',
          exchangeRate,
          projectTitle: agreement.projectDetails.title,
          customerName: req.user.name,
          customerEmail: req.user.email
        }
      );
    } else {
      // Create Stripe checkout session with enhanced features
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/agreements/${agreement._id}/success`,
        cancel_url: `${process.env.FRONTEND_URL}/agreements/${agreement._id}`,
        customer_email: req.user.email,
        client_reference_id: agreement._id.toString(),
        metadata: {
          agreementId: agreement._id.toString(),
          studentId: req.user._id.toString(),
          writerId: agreement.writer._id.toString(),
          originalAmount: agreement.totalAmount.toString(),
          originalCurrency: 'usd',
          exchangeRate: exchangeRate.toString(),
          gateway: selectedGateway,
          countryCode: locationData.summary.countryCode,
          projectTitle: agreement.projectDetails.title
        },
        line_items: [
          {
            price_data: {
              currency: selectedCurrency,
              product_data: {
                name: agreement.projectDetails.title,
                description: `Academic writing service by ${agreement.writer.name}`,
                metadata: {
                  agreementId: agreement._id.toString(),
                  gateway: selectedGateway
                }
              },
              unit_amount: Math.round(convertedAmount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
      });

      paymentResult = {
        success: true,
        sessionUrl: session.url,
        sessionId: session.id,
        gateway: selectedGateway
      };
    }

    if (!paymentResult.success) {
      return res.status(500).json({
        message: 'Failed to create payment session',
        error: paymentResult.error
      });
    }

    // Create enhanced response
    const response = {
      success: true,
      gateway: selectedGateway,
      currency: selectedCurrency,
      amount: convertedAmount,
      originalAmount: agreement.totalAmount,
      exchangeRate,
      location: locationData.summary,
      paymentMethods: paymentGatewayService.getAvailablePaymentMethods(
        selectedGateway, 
        locationData.summary.countryCode
      ),
      ...(selectedGateway === 'stripe' ? {
        sessionUrl: paymentResult.sessionUrl,
        sessionId: paymentResult.sessionId
      } : {
        authorizationUrl: paymentResult.authorizationUrl,
        accessCode: paymentResult.accessCode,
        reference: paymentResult.reference
      })
    };

    res.json(response);
  } catch (err) {
    console.error('Error creating enhanced payment session:', err);
    res.status(500).json({
      message: 'Failed to create payment session',
      error: err.message
    });
  }
};

/**
 * @desc    Get payment gateway recommendation for agreement
 * @route   GET /api/agreements/:id/payment-recommendation
 * @access  Private (Student)
 */
export const getPaymentRecommendation = async (req, res, next) => {
  try {
    const agreement = await ServiceAgreement.findOne({
      _id: req.params.id,
      student: req.user._id
    });

    if (!agreement) {
      return res.status(404).json({ 
        message: 'Agreement not found' 
      });
    }

    // Get user's location
    const userIP = locationService.getClientIP(req);
    const locationData = await locationService.getLocationSummary(userIP);
    
    // Get gateway recommendation
    const recommendation = paymentGatewayService.getRecommendedGateway(
      locationData.summary.countryCode
    );
    
    // Get available payment methods
    const paymentMethods = paymentGatewayService.getAvailablePaymentMethods(
      recommendation.gateway, 
      locationData.summary.countryCode
    );
    
    // Get supported currencies
    const supportedCurrencies = currencyService.getSupportedCurrencies();
    
    // Calculate fees
    const fees = paymentGatewayService.calculateFees(
      agreement.totalAmount, 
      recommendation.gateway,
      locationData.summary.countryCode !== 'us'
    );

    res.json({
      success: true,
      recommendation,
      location: locationData.summary,
      paymentMethods,
      supportedCurrencies,
      fees,
      defaultCurrency: paymentGatewayService.getDefaultCurrency(
        locationData.summary.countryCode
      ),
      agreementAmount: agreement.totalAmount,
      agreementCurrency: 'usd'
    });
  } catch (err) {
    console.error('Error getting payment recommendation:', err);
    res.status(500).json({
      message: 'Failed to get payment recommendation',
      error: err.message
    });
  }
};

/**
 * @desc    Mark agreement as completed (Writer)
 * @route   POST /api/agreements/:id/complete
 * @access  Private (Writer)
 */
export const completeAgreement = async (req, res, next) => {
  try {
    console.log('🔄 [Agreement] Completing agreement:', req.params.id, 'by writer:', req.user._id);
    
    const agreement = await ServiceAgreement.findOneAndUpdate(
      { 
        _id: req.params.id, 
        writer: req.user._id,
        status: 'active'
      },
      { 
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      },
      { new: true }
    ).populate([
      { path: 'student', select: 'name email' },
      { path: 'writer', select: 'name email' }
    ]);

    if (!agreement) {
      console.error('❌ [Agreement] Agreement not found or not completable:', req.params.id);
      return res.status(404).json({ 
        success: false,
        message: 'Agreement not found, not active, or you are not the assigned writer' 
      });
    }

    // 🔥 NEW: Auto-complete payment when agreement is completed
    // Mark all pending installments as paid and update paidAmount
    let totalPaid = 0;
    let hasUpdates = false;
    
    if (agreement.installments && agreement.installments.length > 0) {
      agreement.installments.forEach(installment => {
        if (installment.status === 'pending' || installment.status === 'processing') {
          installment.status = 'paid';
          installment.isPaid = true;
          installment.paymentDate = new Date();
          hasUpdates = true;
        }
        if (installment.status === 'paid') {
          totalPaid += installment.amount;
        }
      });
      
      // Update paidAmount to reflect completion
      if (hasUpdates) {
        agreement.paidAmount = totalPaid;
        agreement.paymentStatus = 'completed';
        await agreement.save();
        console.log('💰 [Agreement] Payment updated: paidAmount =', totalPaid);
      }
    } else {
      // If no installments, mark the full amount as paid
      agreement.paidAmount = agreement.totalAmount;
      agreement.paymentStatus = 'completed';
      await agreement.save();
      console.log('💰 [Agreement] Full payment marked: paidAmount =', agreement.totalAmount);
    }

    console.log('✅ [Agreement] Agreement completed successfully:', agreement._id);

    // Notify student through socket
    try {
      getIO().to(`user-${agreement.student._id}`).emit('agreementCompleted', {
        agreementId: agreement._id,
        writerName: req.user.name,
        title: agreement.projectDetails.title,
        message: `Your project "${agreement.projectDetails.title}" has been completed by ${req.user.name}`,
        paidAmount: agreement.paidAmount,
        totalAmount: agreement.totalAmount
      });
      
      // Also emit payment completion for dashboard updates
      getIO().to(`user-${agreement.student._id}`).emit('paymentCompleted', {
        agreementId: agreement._id,
        amount: agreement.paidAmount,
        type: 'completion'
      });
      
      console.log('📡 [Agreement] Socket notifications sent for completion');
    } catch (socketError) {
      console.warn('⚠️ [Agreement] Socket notification failed:', socketError.message);
    }

    res.status(200).json({ 
      success: true,
      message: 'Agreement marked as completed successfully',
      agreement 
    });
  } catch (err) {
    console.error('❌ [Agreement] Error completing agreement:', err);
    next(err);
  }
};
