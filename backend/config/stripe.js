import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Enhanced Stripe Configuration for EDU-SAGE
 * 
 * Provides robust Stripe initialization with validation and error handling
 */

// Validate Stripe environment variables
const validateStripeConfig = () => {
  const requiredVars = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
  };

  const missing = [];
  const invalid = [];

  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      missing.push(key);
    } else if (value.includes('REPLACE') || value.length < 10) {
      invalid.push(key);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing Stripe environment variables:', missing.join(', '));
    console.error('💡 Please check your .env file and ensure all Stripe keys are set');
  }

  if (invalid.length > 0) {
    console.error('❌ Invalid Stripe environment variables (contains placeholder):', invalid.join(', '));
    console.error('💡 Please replace placeholder values with actual Stripe keys');
  }

  return missing.length === 0 && invalid.length === 0;
};

// Initialize Stripe with proper configuration
let stripe = null;

try {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY is not defined in environment variables');
    console.error('💡 Please run: node setup-stripe.js to configure Stripe');
  } else if (process.env.STRIPE_SECRET_KEY.includes('REPLACE')) {
    console.error('❌ STRIPE_SECRET_KEY contains placeholder value');
    console.error('💡 Please replace with your actual Stripe secret key from https://dashboard.stripe.com/apikeys');
  } else {
    // Validate configuration
    const isValid = validateStripeConfig();
    
    if (isValid) {
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16', // Use latest stable API version
        typescript: true,
        maxNetworkRetries: 3,
        timeout: 30000
      });
      
      console.log('✅ Stripe initialized successfully');
      console.log(`🔑 Using API version: 2023-10-16`);
      console.log(`🌍 Mode: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'TEST'}`);
    } else {
      console.error('❌ Stripe configuration validation failed');
    }
  }
} catch (error) {
  console.error('❌ Failed to initialize Stripe:', error.message);
  console.error('💡 Please check your STRIPE_SECRET_KEY and try again');
}

/**
 * Get Stripe configuration details
 */
export const getStripeConfig = () => {
  return {
    isConfigured: !!stripe,
    mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    hasValidConfig: validateStripeConfig()
  };
};

/**
 * Validate Stripe webhook signature
 */
export const validateWebhookSignature = (payload, signature, secret) => {
  try {
    if (!stripe) {
      throw new Error('Stripe not initialized');
    }
    return stripe.webhooks.constructEvent(payload, signature, secret || process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('❌ Webhook signature validation failed:', error.message);
    throw error;
  }
};

/**
 * Create a test payment method for development
 */
export const createTestPaymentMethod = async () => {
  if (!stripe || process.env.NODE_ENV === 'production') {
    return null;
  }

  try {
    return await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: new Date().getFullYear() + 1,
        cvc: '123'
      }
    });
  } catch (error) {
    console.error('❌ Failed to create test payment method:', error.message);
    return null;
  }
};

export default stripe; 