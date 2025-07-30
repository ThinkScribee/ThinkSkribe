import Stripe from 'stripe';
import asyncHandler from '../middleware/asyncHandler.js';
import ServiceAgreement from '../models/ServiceAgreement.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import paymentGatewayService from '../services/paymentGatewayService.js';
import locationService from '../services/locationService.js';
import currencyService from '../services/backendCurrencyService.js';
import ErrorResponse from '../utils/errorResponse.js';
import { getIO } from '../socket.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc    Ensure user has a Stripe customer ID
 * @access  Private
 */
const ensureStripeCustomer = async (user) => {
  if (!user.stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString()
      }
    });
    user.stripeCustomerId = customer.id;
    await user.save();
  }
  return user.stripeCustomerId;
};

/**
 * @desc    Create payment checkout session
 * @route   POST /api/payment/checkout
 * @access  Private
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { agreementId, installmentId, paymentType = 'full' } = req.body;

    const agreement = await ServiceAgreement.findById(agreementId)
      .populate('student', 'name email stripeCustomerId')
      .populate('writer', 'name email stripeAccountId');

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    if (agreement.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this agreement' });
    }

    // Ensure customer exists
    await ensureStripeCustomer(req.user);

    let paymentAmount;
    let installmentToUpdate;
    let description;

    if (paymentType === 'installment' && installmentId) {
      installmentToUpdate = agreement.installments.id(installmentId);
      if (!installmentToUpdate) {
        return res.status(404).json({ message: 'Installment not found' });
      }
      if (installmentToUpdate.isPaid) {
        return res.status(400).json({ message: 'Installment already paid' });
      }
      paymentAmount = installmentToUpdate.amount;
      description = `Installment payment for ${agreement.projectDetails.title}`;
    } else {
      const unpaidAmount = agreement.totalAmount - (agreement.paidAmount || 0);
      if (unpaidAmount <= 0) {
        return res.status(400).json({ message: 'Agreement already fully paid' });
      }
      paymentAmount = unpaidAmount;
      description = `Full payment for ${agreement.projectDetails.title}`;
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: agreement.projectDetails.title,
            description: description
          },
          unit_amount: Math.round(paymentAmount * 100) // Convert to cents
        },
        quantity: 1
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&agreement_id=${agreement._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/agreements/${agreement._id}?payment=cancelled`,
      metadata: {
        agreementId: agreement._id.toString(),
        installmentId: installmentToUpdate?._id?.toString() || 'full',
        studentId: req.user._id.toString(),
        writerId: agreement.writer._id.toString(),
        paymentType
      }
    });

    // Update installment status to processing if it's an installment payment
    if (installmentToUpdate) {
      installmentToUpdate.status = 'processing';
      await agreement.save();
    }

    res.json({ 
      sessionId: session.id,
      sessionUrl: session.url,
      installment: installmentToUpdate ? {
        id: installmentToUpdate._id,
        amount: installmentToUpdate.amount,
        dueDate: installmentToUpdate.dueDate
      } : null,
      paymentAmount
    });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ 
      message: 'Failed to create payment session',
      error: err.message 
    });
  }
};

/**
 * @desc    Handle successful payment webhook
 * @route   POST /api/payment/webhook
 * @access  Public
 */
export const handlePaymentWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { agreementId, installmentId, studentId, writerId } = session.metadata;

      const agreement = await ServiceAgreement.findById(agreementId);
      if (!agreement) {
        return res.status(404).json({ message: 'Agreement not found' });
      }

      // Check if installments exist
      if (!agreement.installments || agreement.installments.length === 0) {
        console.error('No installments found for agreement:', agreementId);
        return res.status(400).json({ message: 'No installments found for this agreement' });
      }

      // Find and update the specific installment
      const installment = agreement.installments.id(installmentId);
      if (!installment) {
        return res.status(404).json({ message: 'Installment not found' });
      }

      // Update installment status
      installment.isPaid = true;
      installment.paymentDate = new Date();
      installment.status = 'paid';
      installment.stripePaymentIntentId = session.payment_intent;

      // Update agreement payment totals
      agreement.paidAmount += installment.amount;
      agreement.remainingAmount = agreement.totalAmount - agreement.paidAmount;

      // Update overall payment status
      if (Math.abs(agreement.remainingAmount) < 0.01) {
        agreement.paymentStatus = 'completed';
      } else if (agreement.paidAmount > 0) {
        agreement.paymentStatus = 'partial';
      }

      // Save the agreement
      await agreement.save();

      // Create payment record
      await Payment.create({
        user: studentId,
        agreement: agreementId,
        amount: installment.amount,
        currency: 'usd',
        status: 'completed',
        stripeChargeId: session.payment_intent,
        installment: installment._id,
        metadata: {
          type: 'installment',
          sessionId: session.id
        }
      });

      // Emit socket events for real-time updates
      if (getIO()) {
        getIO().to(`user_${studentId}`).emit('paymentProcessed', {
          agreementId,
          installmentId: installment._id,
          amount: installment.amount,
          type: 'installment'
        });

        getIO().to(`user_${writerId}`).emit('paymentReceived', {
          agreementId,
          installmentId: installment._id,
          amount: installment.amount,
          type: 'installment'
        });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

/**
 * @desc    Get payment methods for user
 * @route   GET /api/payment/methods
 * @access  Private
 */
export const getPaymentMethods = async (req, res, next) => {
  try {
    const customerId = await ensureStripeCustomer(req.user);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    res.json(paymentMethods);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Attach payment method to customer
 * @route   POST /api/payment/methods/attach
 * @access  Private
 */
export const attachPaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body;
    const customerId = await ensureStripeCustomer(req.user);

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create subscription
 * @route   POST /api/payment/subscription
 * @access  Private
 */
export const createSubscription = async (req, res, next) => {
  try {
    const { plan, paymentMethodId } = req.body;
    const user = await ensureStripeCustomer(req.user);
    const priceId = process.env[`STRIPE_${plan.toUpperCase()}_PRICE_ID`];

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user,
    });

    await stripe.customers.update(user, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    const subscription = await stripe.subscriptions.create({
      customer: user,
      items: [{ price: priceId }],
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    const newSubscription = await Subscription.create({
      user: req.user._id,
      plan,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(subscription.current_period_end * 1000),
      stripeSubscriptionId: subscription.id,
    });

    await Payment.create({
      user: req.user._id,
      amount: subscription.latest_invoice.amount_paid / 100,
      currency: subscription.latest_invoice.currency,
      status: 'completed',
      stripeChargeId: subscription.latest_invoice.payment_intent.charges.data[0].id,
      subscription: newSubscription._id,
    });

    req.user.subscription = newSubscription._id;
    await req.user.save();

    res.status(201).json(newSubscription);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel subscription
 * @route   DELETE /api/payment/subscription/:subscriptionId
 * @access  Private
 */
export const cancelSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);

    if (!subscription || subscription.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    await stripe.subscriptions.del(subscription.stripeSubscriptionId);

    subscription.status = 'canceled';
    await subscription.save();

    res.json({ message: 'Subscription canceled successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get payment history
 * @route   GET /api/payment/history
 * @access  Private
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('agreement', 'projectDetails')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Refund payment
 * @route   POST /api/payment/refund/:paymentId
 * @access  Private (Admin)
 */
export const refundPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const refund = await stripe.refunds.create({
      charge: payment.stripeChargeId,
      amount: Math.round(payment.amount * 100),
    });

    payment.status = 'refunded';
    await payment.save();

    await Payment.create({
      user: payment.user,
      amount: -payment.amount,
      currency: payment.currency,
      status: 'completed',
      stripeChargeId: refund.id,
      type: 'refund',
      originalPayment: payment._id,
    });

    res.json({ message: 'Payment refunded successfully', refund });
  } catch (err) {
    next(err);
  }
};

// Enhanced payment functionality with multiple gateways and currency support

/**
 * @desc    Create payment intent for direct card payments
 * @route   POST /api/payment/create-intent
 * @access  Private
 */
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency = 'usd', agreementId, installmentId } = req.body;

    // Validate agreement access
    const agreement = await ServiceAgreement.findOne({
      _id: agreementId,
      student: req.user._id
    });

    if (!agreement) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    // Validate installment if provided
    let installment = null;
    if (installmentId) {
      installment = agreement.installments.id(installmentId);
      if (!installment) return res.status(404).json({ message: 'Installment not found' });
      if (installment.isPaid) return res.status(400).json({ message: 'Installment already paid' });
    }

    // Ensure customer exists
    await ensureStripeCustomer(req.user);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: {
        agreementId: agreement._id.toString(),
        installmentId: installment?._id?.toString() || 'full',
        studentId: req.user._id.toString(),
        writerId: agreement.writer.toString()
      },
      payment_method_types: ['card'],
    });

    // Update installment status if applicable
    if (installment) {
      installment.stripePaymentIntentId = paymentIntent.id;
      await agreement.save();
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    res.status(500).json({ 
      message: 'Failed to create payment intent',
      error: err.message 
    });
  }
};

/**
 * @desc    Get payment session details
 * @route   GET /api/payment/session/:sessionId
 * @access  Private
 */
export const getPaymentSession = async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['payment_intent']
    });

    res.json({
      sessionId: session.id,
      paymentStatus: session.payment_status,
      paymentIntent: session.payment_intent,
      metadata: session.metadata
    });
  } catch (err) {
    console.error('Error retrieving session:', err);
    res.status(500).json({ 
      message: 'Failed to retrieve session',
      error: err.message 
    });
  }
};

/**
 * @desc    Create enhanced checkout session with multiple gateway support
 * @route   POST /api/payment/enhanced-checkout
 * @access  Private
 */
export const createEnhancedCheckoutSession = asyncHandler(async (req, res) => {
  const {
    agreementId,
    paymentType = 'next',
    installmentId,
    gateway = 'stripe',
    currency: requestedCurrency,
    amount: customAmount
  } = req.body;

  console.log('🔄 [Enhanced Checkout] Request received:', {
    agreementId,
    paymentType,
    installmentId,
    gateway,
    requestedCurrency,
    customAmount,
    userId: req.user._id
  });

  // Get agreement with populated data
  const agreement = await ServiceAgreement.findOne({
    _id: agreementId,
    student: req.user._id
  }).populate('writer', 'name email stripeAccountId').populate('student', 'name email');

  if (!agreement) {
    return res.status(404).json({
      message: 'Agreement not found or access denied'
    });
  }

  // Determine which installment to pay
  let installmentToUpdate = null;
  let paymentAmount = 0;

  if (paymentType === 'installment' && installmentId) {
    installmentToUpdate = agreement.installments.id(installmentId);
    if (!installmentToUpdate) {
      return res.status(404).json({ message: 'Installment not found' });
    }
    if (installmentToUpdate.status === 'paid') {
      return res.status(400).json({ message: 'Installment already paid' });
    }
    paymentAmount = installmentToUpdate.amount;
  } else if (paymentType === 'next') {
    // Find next unpaid installment
    installmentToUpdate = agreement.installments.find(inst => 
      inst.status === 'pending' || inst.status === 'overdue'
    );
    if (!installmentToUpdate) {
      return res.status(400).json({ message: 'No pending installments found' });
    }
    paymentAmount = installmentToUpdate.amount;
  } else if (paymentType === 'full') {
    // Pay all remaining amount
    const paidAmount = agreement.paidAmount || 0;
    paymentAmount = agreement.totalAmount - paidAmount;
    if (paymentAmount <= 0) {
      return res.status(400).json({ message: 'Agreement is already fully paid' });
    }
  } else if (paymentType === 'custom' && customAmount) {
    paymentAmount = customAmount;
  }

  if (paymentAmount <= 0) {
    return res.status(400).json({ message: 'Invalid payment amount' });
  }

  // Get user location for currency and gateway determination
  const ipAddress = locationService.getClientIP(req);
  const userLocation = await locationService.getLocationFromIP(ipAddress);
  const isNigerian = userLocation?.countryCode === 'ng';
  const isAfrican = userLocation?.isAfrican || false;

  // Currency and gateway determination
  let transactionCurrency = requestedCurrency;
  let transactionAmount = paymentAmount;
  let exchangeRate = 1;
  let dashboardCurrency = 'usd';
  let dashboardAmount = paymentAmount;

  // Only default to NGN if NO currency was explicitly requested
  if (!transactionCurrency) {
    transactionCurrency = isNigerian ? 'ngn' : 'usd';
  }
  // If user explicitly chose a currency (like USD), respect their choice
  console.log('💱 [Enhanced Checkout] Currency choice:', {
    requestedCurrency,
    transactionCurrency,
    isNigerian,
    respectingUserChoice: !!requestedCurrency
  });

  // Smart gateway selection based on currency compatibility
  let finalGateway = gateway;
  if (transactionCurrency === 'usd') {
    finalGateway = 'stripe'; // USD → Always use Stripe (global support)
    console.log('💳 [Enhanced Checkout] Auto-selected Stripe for USD payment');
  } else if (transactionCurrency === 'ngn') {
    finalGateway = 'paystack'; // NGN → Always use Paystack (optimized for Nigeria)
    console.log('💳 [Enhanced Checkout] Auto-selected Paystack for NGN payment');
  }

  console.log('💳 [Enhanced Checkout] Gateway selection:', {
    originalGateway: gateway,
    finalGateway,
    currency: transactionCurrency,
    reason: transactionCurrency === 'usd' ? 'USD requires Stripe' : 
            transactionCurrency === 'ngn' ? 'NGN optimized for Paystack' : 'User choice'
  });

  if (transactionCurrency !== 'usd') {
    // Get exchange rate
    const rates = await currencyService.getExchangeRates();
    exchangeRate = rates[transactionCurrency.toUpperCase()] || 1;
    transactionAmount = paymentAmount * exchangeRate;
  }

  // Dashboard always shows USD equivalent
  dashboardCurrency = 'usd';
  dashboardAmount = paymentAmount; // This is already in USD base

  console.log('💱 [Enhanced Checkout] Currency conversion:', {
    originalAmount: paymentAmount,
    transactionCurrency,
    transactionAmount,
    exchangeRate,
    dashboardCurrency,
    dashboardAmount
  });

  try {
    // Create payment based on gateway
    let paymentResult;
    
    if (finalGateway === 'paystack') {
      paymentResult = await paymentGatewayService.createPaystackPayment(
        transactionAmount,
        transactionCurrency,
        req.user.email,
        {
          agreementId: agreement._id.toString(),
          installmentId: installmentToUpdate?._id?.toString() || 'full',
          studentId: req.user._id.toString(),
          writerId: agreement.writer._id.toString(),
          paymentType,
          originalAmount: paymentAmount,
          originalCurrency: 'usd',
          dashboardAmount,
          dashboardCurrency,
          exchangeRate,
          isNigerian,
          isAfrican
        }
      );
    } else {
      paymentResult = await paymentGatewayService.createStripeCheckoutSession(
        transactionAmount,
        transactionCurrency,
        {
          agreementId: agreement._id.toString(),
          installmentId: installmentToUpdate?._id?.toString() || 'full',
          studentId: req.user._id.toString(),
          writerId: agreement.writer._id.toString(),
          paymentType,
          originalAmount: paymentAmount,
          originalCurrency: 'usd',
          dashboardAmount,
          dashboardCurrency,
          exchangeRate,
          isNigerian,
          isAfrican
        }
      );
    }

    if (!paymentResult.success) {
      return res.status(500).json({
        message: 'Failed to create payment',
        error: paymentResult.error
      });
    }

    // DO NOT update installment status here - only update after payment is verified
    // Removed: installmentToUpdate.status = 'processing'
    
    // Calculate platform fee and writer amount
    const feeRate = finalGateway === 'paystack' ? 0.05 : 0.10;
    const platformFee = dashboardAmount * feeRate;
    const writerAmount = dashboardAmount - platformFee;

    // Create payment record with enhanced currency tracking
    const paymentRecord = await Payment.create({
      paymentId: paymentResult.paymentIntentId || paymentResult.sessionId || paymentResult.reference,
      student: req.user._id,
      writer: agreement.writer._id,
      agreement: agreement._id,
      amount: dashboardAmount, // Store in USD for consistency
      originalAmount: paymentAmount,
      originalCurrency: 'usd', // Base currency for the system
      transactionAmount,
      transactionCurrency,
      dashboardAmount,
      dashboardCurrency,
      exchangeRate,
      platformFee,
      writerAmount,
      status: 'pending',
      paymentGateway: finalGateway, // Fixed: was 'gateway', now 'paymentGateway'
      installment: installmentToUpdate ? {
        installmentId: installmentToUpdate._id,
        amount: installmentToUpdate.amount,
        dueDate: installmentToUpdate.dueDate
      } : null,
      paymentMethod: finalGateway === 'stripe' ? 'card' : 'card_ng',
      location: userLocation,
      metadata: {
        paymentType,
        isNigerian,
        isAfrican,
        userAgent: req.headers['user-agent']
      },
      ...(finalGateway === 'stripe' ? {
        stripeSessionId: paymentResult.sessionId
      } : {
        paystackReference: paymentResult.reference,
        paystackPaymentId: paymentResult.paymentId
      })
    });

    console.log('💾 [Enhanced Checkout] Payment record created:', {
      paymentId: paymentRecord.paymentId,
      gateway: finalGateway,
      amount: dashboardAmount,
      currency: dashboardCurrency
    });

    // Return response with payment details
    res.json({
      success: true,
      gateway: finalGateway,
      paymentId: paymentResult.paymentIntentId || paymentResult.sessionId || paymentResult.reference,
      ...(finalGateway === 'stripe' ? {
        sessionUrl: paymentResult.sessionUrl,
        sessionId: paymentResult.sessionId
      } : {
        authorizationUrl: paymentResult.authorizationUrl,
        reference: paymentResult.reference
      }),
      amount: {
        dashboard: dashboardAmount,
        transaction: transactionAmount,
        currency: transactionCurrency,
        exchangeRate
      },
      installment: installmentToUpdate ? {
        id: installmentToUpdate._id,
        amount: installmentToUpdate.amount,
        dueDate: installmentToUpdate.dueDate,
        description: installmentToUpdate.description
      } : null,
      fees: {
        platformFee,
        writerAmount,
        feeRate
      }
    });

  } catch (error) {
    console.error('🔴 [Enhanced Checkout] Error:', error);
    res.status(500).json({
      message: 'Payment creation failed',
      error: error.message
    });
  }
});

/**
 * @desc    Handle enhanced payment webhooks from multiple gateways
 * @route   POST /api/payment/enhanced-webhook
 * @access  Public (webhook)
 */
export const handleEnhancedPaymentWebhook = asyncHandler(async (req, res) => {
  console.log('🔔 Enhanced payment webhook received');
  
  try {
    const signature = req.headers['x-paystack-signature'] || req.headers['stripe-signature'];
    const gateway = req.headers['x-paystack-signature'] ? 'paystack' : 'stripe';
    
    console.log('🔔 Webhook details:', {
      gateway,
      hasSignature: !!signature,
      body: req.body
    });
    
    if (gateway === 'paystack') {
      // Verify Paystack webhook signature
      const crypto = await import('crypto');
      const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (hash !== signature) {
        console.log('🔴 Invalid Paystack webhook signature');
        return res.status(400).send('Invalid signature');
      }
      
      const { event, data } = req.body;
      console.log('🔔 Paystack webhook event:', event);
      
      if (event === 'charge.success') {
        await handlePaystackPaymentSuccess(data);
      }
    } else if (gateway === 'stripe') {
      // Verify Stripe webhook signature
      let event;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.log('🔴 Invalid Stripe webhook signature:', err.message);
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
      }
      
      console.log('🔔 Stripe webhook event:', event.type);
      
      if (event.type === 'checkout.session.completed') {
        await handleStripeCheckoutCompleted(event.data.object);
      }
    }
    
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('🔴 Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
});

/**
 * @desc    Manual payment verification (for success page)
 * @route   POST /api/payment/manual-verify/:reference
 * @access  Private
 */
export const manualVerifyPayment = asyncHandler(async (req, res) => {
  const { reference } = req.params;
  
  console.log('🔍 Manual payment verification requested for:', reference);
  
  try {
    let payment = null;
    
    // Check if it's a Stripe session ID (starts with 'cs_')
    if (reference.startsWith('cs_')) {
      payment = await Payment.findOne({
        stripeSessionId: reference
      }).populate('agreement');
      
      console.log('🔍 Looking for Stripe payment with session ID:', reference);
    } else {
      // Assume it's a Paystack reference
      payment = await Payment.findOne({
        $or: [
          { paystackReference: reference },
          { paymentId: reference }
        ]
      }).populate('agreement');
      
      console.log('🔍 Looking for Paystack payment with reference:', reference);
    }
    
    if (!payment) {
      console.log('❌ Payment record not found for reference:', reference);
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }
    
    console.log('✅ Payment record found:', {
      paymentId: payment.paymentId,
      status: payment.status,
      gateway: payment.paymentGateway,
      amount: payment.amount
    });
    
    // If payment is already succeeded, return success
    if (payment.status === 'succeeded') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        payment: {
          id: payment._id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.transactionCurrency,
          gateway: payment.paymentGateway,
          agreementId: payment.agreement?._id
        }
      });
    }
    
    // If payment is still pending, try to verify with gateway
    if (payment.status === 'pending') {
      console.log('💭 Payment still pending, attempting gateway verification...');
      
      if (payment.paymentGateway === 'stripe' && payment.stripeSessionId) {
        // Verify with Stripe
        try {
          const session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);
          
          if (session.payment_status === 'paid') {
            console.log('✅ Stripe session verified as paid');
            
            // Update payment status
            payment.status = 'succeeded';
            payment.processedAt = new Date();
            payment.stripePaymentIntentId = session.payment_intent;
            await payment.save();
            
            // Update agreement and installment
            await updateAgreementFromPayment(payment);
            
            return res.json({
              success: true,
              message: 'Payment verified and updated',
              payment: {
                id: payment._id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.transactionCurrency,
                gateway: payment.paymentGateway,
                agreementId: payment.agreement?._id
              }
            });
          }
        } catch (stripeError) {
          console.error('❌ Stripe verification failed:', stripeError.message);
        }
      } else if (payment.paymentGateway === 'paystack' && payment.paystackReference) {
        // Verify with Paystack
        try {
          const verifyResult = await paymentGatewayService.verifyPaystackPayment(payment.paystackReference);
          
          if (verifyResult.success && verifyResult.status === 'success') {
            console.log('✅ Paystack payment verified as successful');
            
            // Update payment status
            payment.status = 'succeeded';
            payment.processedAt = new Date();
            await payment.save();
            
            // Update agreement and installment
            await updateAgreementFromPayment(payment);
            
            return res.json({
              success: true,
              message: 'Payment verified and updated',
              payment: {
                id: payment._id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.transactionCurrency,
                gateway: payment.paymentGateway,
                agreementId: payment.agreement?._id
              }
            });
          }
        } catch (paystackError) {
          console.error('❌ Paystack verification failed:', paystackError.message);
        }
      }
    }
    
    // Return current status if verification didn't change anything
    res.json({
      success: payment.status === 'succeeded',
      message: `Payment status: ${payment.status}`,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.transactionCurrency,
        gateway: payment.paymentGateway,
        agreementId: payment.agreement?._id
      }
    });
    
  } catch (error) {
    console.error('🔴 Manual verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed',
      error: error.message
    });
  }
});

// Helper function to handle successful Paystack payments
async function handlePaystackPaymentSuccess(data) {
  try {
    console.log('💰 Processing Paystack payment success:', data.reference);
    
    // Find payment record
    const payment = await Payment.findOne({
      paystackReference: data.reference
    }).populate('agreement');
    
    if (!payment) {
      console.log('Payment record not found for reference:', data.reference);
      return;
    }
    
    // Update payment status
    payment.status = 'succeeded';
    payment.processedAt = new Date();
    payment.paystackTransactionId = data.id;
    await payment.save();
    
    // Update agreement
    const agreement = payment.agreement;
    if (agreement && payment.installment) {
      // Update installment
      const installment = agreement.installments.id(payment.installment.installmentId);
      if (installment) {
        installment.status = 'paid';
        installment.paidDate = new Date();
        if (payment.gateway === 'stripe') {
          installment.stripePaymentIntentId = payment.paymentId;
        }
      }
      
      // Update agreement totals
      agreement.paidAmount = (agreement.paidAmount || 0) + payment.amount;
      agreement.remainingAmount = agreement.totalAmount - agreement.paidAmount;
      
      if (agreement.remainingAmount <= 0.01) {
        agreement.paymentStatus = 'completed';
        agreement.status = 'active';
      } else {
        agreement.paymentStatus = 'partial';
      }
      
      await agreement.save();
    }
  } catch (error) {
    console.error('Error processing Paystack payment:', error);
  }
}

async function handleStripeCheckoutCompleted(session) {
  try {
    console.log('💰 Processing Stripe checkout.session.completed webhook:', session.id);

    // Find the existing payment record by session ID
    const payment = await Payment.findOne({
      stripeSessionId: session.id
    }).populate('agreement');

    if (!payment) {
      console.error('Payment record not found for Stripe session:', session.id);
      return;
    }

    // Update payment status
    payment.status = 'succeeded';
    payment.processedAt = new Date();
    payment.stripePaymentIntentId = session.payment_intent;
    await payment.save();

    console.log('💰 Updated payment record status to succeeded for session:', session.id);

    // Update agreement
    const agreement = payment.agreement;
    if (agreement && payment.installment) {
      // Update installment
      const installment = agreement.installments.id(payment.installment.installmentId);
      if (installment) {
        installment.status = 'paid';
        installment.isPaid = true;
        installment.paidDate = new Date();
        installment.stripePaymentIntentId = session.payment_intent;
        
        console.log('💰 Updated installment status to paid:', installment._id);
      }
      
      // Update agreement totals
      agreement.paidAmount = (agreement.paidAmount || 0) + payment.amount;
      agreement.remainingAmount = agreement.totalAmount - agreement.paidAmount;
      
      if (agreement.remainingAmount <= 0.01) {
        agreement.paymentStatus = 'completed';
        agreement.status = 'active';
      } else {
        agreement.paymentStatus = 'partial';
      }
      
      await agreement.save();
      console.log('💰 Updated agreement payment status:', agreement.paymentStatus);
      
      // Emit socket events for real-time updates
      if (getIO()) {
        getIO().to(`user_${payment.student}`).emit('paymentProcessed', {
          agreementId: agreement._id,
          installmentId: installment?._id,
          amount: payment.amount,
          type: 'installment',
          paymentId: payment._id
        });

        getIO().to(`user_${payment.writer}`).emit('paymentReceived', {
          agreementId: agreement._id,
          installmentId: installment?._id,
          amount: payment.amount,
          type: 'installment',
          paymentId: payment._id
        });
        
        console.log('📡 Socket events emitted for payment completion');
      }
    }
  } catch (err) {
    console.error('🔴 Error handling Stripe checkout completed webhook:', err);
  }
}

// Helper function to update agreement when payment is verified
async function updateAgreementFromPayment(payment) {
  try {
    const agreement = payment.agreement;
    if (!agreement || !payment.installment) return;
    
    // Update installment
    const installment = agreement.installments.id(payment.installment.installmentId);
    if (installment) {
      installment.status = 'paid';
      installment.isPaid = true;
      installment.paidDate = new Date();
      
      if (payment.paymentGateway === 'stripe') {
        installment.stripePaymentIntentId = payment.stripePaymentIntentId;
      }
    }
    
    // Update agreement totals
    agreement.paidAmount = (agreement.paidAmount || 0) + payment.amount;
    agreement.remainingAmount = agreement.totalAmount - agreement.paidAmount;
    
    if (agreement.remainingAmount <= 0.01) {
      agreement.paymentStatus = 'completed';
      agreement.status = 'active';
    } else {
      agreement.paymentStatus = 'partial';
    }
    
    await agreement.save();
    
    console.log('✅ Agreement updated from manual verification');
    
  } catch (error) {
    console.error('❌ Error updating agreement from payment:', error);
  }
}