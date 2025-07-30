import Stripe from 'stripe';
import axios from 'axios';
import crypto from 'crypto';

class PaymentGatewayService {
  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    this.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    this.paystackPublicKey = process.env.PAYSTACK_PUBLIC_KEY;
    
    // African countries that should use Paystack
    this.africanCountries = new Set([
      'ng', 'gh', 'ke', 'za', 'ug', 'tz', 'rw', 'zm', 'bw', 'mu',
      'eg', 'ma', 'dz', 'tn', 'cm', 'sn', 'ml', 'bf', 'ne', 'td',
      'et', 'ao', 'mz', 'sl', 'lr', 'gn', 'cd', 'mg', 'km', 'dj',
      'so', 'st', 'cv', 'gm', 'bi', 'gq', 'ga', 'cg', 'cf', 'td',
      'mw', 'sz', 'ls', 'bj', 'tg', 'gw', 'gn', 'ci', 'mr', 'na',
      'er', 'ss', 'sd', 'ly', 'td', 'mz', 'mg', 'km', 'sc', 'mu'
    ]);
  }

  // Determine which payment gateway to use based on location
  getRecommendedGateway(countryCode) {
    const country = countryCode?.toLowerCase();
    
    if (this.africanCountries.has(country)) {
      return {
        gateway: 'paystack',
        reason: 'lower_fees_africa',
        confidence: 'high'
      };
    }
    
    return {
      gateway: 'stripe',
      reason: 'global_coverage',
      confidence: 'high'
    };
  }

  // Get available payment methods for a gateway and country
  getAvailablePaymentMethods(gateway, countryCode) {
    const country = countryCode?.toLowerCase();
    
    if (gateway === 'paystack') {
      const methods = ['card'];
      
      // Add country-specific payment methods
      if (country === 'ng') {
        methods.push('bank_transfer', 'ussd', 'mobile_money', 'qr');
      } else if (country === 'gh') {
        methods.push('mobile_money', 'bank_transfer');
      } else if (country === 'ke') {
        methods.push('mobile_money', 'bank_transfer');
      } else if (country === 'za') {
        methods.push('bank_transfer');
      }
      
      return methods;
    }
    
    // Stripe payment methods
    const methods = ['card'];
    
    // Add regional payment methods for Stripe
    if (country === 'us') {
      methods.push('bank_transfer', 'paypal');
    } else if (country === 'gb') {
      methods.push('bank_transfer', 'paypal');
    } else if (['de', 'fr', 'it', 'es', 'nl', 'be', 'at'].includes(country)) {
      methods.push('sepa_debit', 'paypal');
    } else if (country === 'cn') {
      methods.push('alipay', 'wechat_pay');
    }
    
    return methods;
  }

  // Get gateway configuration
  getGatewayConfig(gateway, countryCode) {
    const country = countryCode?.toLowerCase();
    
    if (gateway === 'paystack') {
      return {
        name: 'Paystack',
        publicKey: this.paystackPublicKey,
        secretKey: this.paystackSecretKey,
        baseUrl: 'https://api.paystack.co',
        currency: this.getDefaultCurrency(country),
        fees: {
          domestic: 0.015, // 1.5% for domestic transactions
          international: 0.039 // 3.9% for international
        },
        features: {
          subscriptions: true,
          refunds: true,
          webhooks: true,
          multiplePaymentMethods: true
        }
      };
    }
    
    // Stripe configuration
    return {
      name: 'Stripe',
      publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      currency: this.getDefaultCurrency(country),
      fees: {
        domestic: 0.029, // 2.9% + 30¢ for domestic
        international: 0.029 // 2.9% + 30¢ for international
      },
      features: {
        subscriptions: true,
        refunds: true,
        webhooks: true,
        multiplePaymentMethods: true,
        globalCoverage: true
      }
    };
  }

  // Get default currency for a country
  getDefaultCurrency(countryCode) {
    const currencyMap = {
      'ng': 'ngn', 'gh': 'ghs', 'ke': 'kes', 'za': 'zar',
      'ug': 'ugx', 'tz': 'tzs', 'rw': 'rwf', 'zm': 'zmw',
      'bw': 'bwp', 'mu': 'mur', 'eg': 'egp', 'ma': 'mad',
      'us': 'usd', 'gb': 'gbp', 'de': 'eur', 'fr': 'eur',
      'it': 'eur', 'es': 'eur', 'nl': 'eur', 'be': 'eur',
      'at': 'eur', 'jp': 'jpy', 'cn': 'cny', 'in': 'inr',
      'ca': 'cad', 'au': 'aud'
    };
    
    return currencyMap[countryCode?.toLowerCase()] || 'usd';
  }

  // Create payment intent with Stripe
  async createStripePaymentIntent(amount, currency, metadata = {}) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata,
        payment_method_types: ['card']
      });
      
      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        gateway: 'stripe'
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'stripe'
      };
    }
  }

  // Create checkout session with Stripe (for redirect)
  async createStripeCheckoutSession(amount, currency, metadata = {}) {
    try {
      console.log('🔵 Creating Stripe checkout session:', {
        amount,
        amountInCents: Math.round(amount * 100),
        currency,
        metadata
      });

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'EDU-SAGE Assignment Payment',
              description: `Payment for agreement ${metadata.agreementId || 'N/A'}`
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        }],
        metadata,
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&agreement=${metadata.agreementId}&status=success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled?agreement=${metadata.agreementId}`,
        client_reference_id: metadata.agreementId,
      });
      
      return {
        success: true,
        sessionUrl: session.url,
        sessionId: session.id,
        gateway: 'stripe'
      };
    } catch (error) {
      console.error('Stripe checkout session creation failed:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'stripe'
      };
    }
  }

  // Create payment with Paystack
  async createPaystackPayment(amount, currency, email, metadata = {}) {
    try {
      console.log('🔵 Creating Paystack payment:', {
        amount,
        amountInKobo: Math.round(amount * 100),
        currency,
        email,
        metadata,
        hasSecretKey: !!this.paystackSecretKey
      });

      if (!this.paystackSecretKey) {
        throw new Error('Paystack secret key not configured');
      }

      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          amount: Math.round(amount * 100), // Convert to kobo/cents
          currency: currency.toUpperCase(),
          email,
          metadata: {
            ...metadata,
            agreementId: metadata.agreementId // Ensure agreement ID is passed
          },
          callback_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancelled`
        },
        {
          headers: {
            'Authorization': `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('🔵 Paystack response:', response.data);
      
      if (response.data.status) {
        return {
          success: true,
          authorizationUrl: response.data.data.authorization_url,
          accessCode: response.data.data.access_code,
          reference: response.data.data.reference,
          gateway: 'paystack'
        };
      }
      
      return {
        success: false,
        error: response.data.message || 'Payment initialization failed',
        gateway: 'paystack'
      };
    } catch (error) {
      console.error('🔴 Paystack payment creation failed:', error);
      console.error('🔴 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        gateway: 'paystack'
      };
    }
  }

  // Verify Paystack payment
  async verifyPaystackPayment(reference) {
    try {
      console.log('🔍 Verifying Paystack payment:', reference);
      
      if (!this.paystackSecretKey) {
        throw new Error('Paystack secret key not configured');
      }
      
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${this.paystackSecretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('🔍 Paystack verification response:', response.data);
      
      if (response.data.status) {
        const data = response.data.data;
        return {
          success: true,
          status: data.status, // 'success', 'failed', 'abandoned'
          reference: data.reference,
          amount: data.amount / 100, // Convert from kobo/cents
          currency: data.currency,
          paidAt: data.paid_at,
          customer: data.customer,
          gateway_response: data.gateway_response,
          channel: data.channel
        };
      }
      
      return {
        success: false,
        status: 'failed',
        error: response.data.message || 'Verification failed'
      };
    } catch (error) {
      console.error('🔴 Paystack verification failed:', error);
      console.error('🔴 Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      return {
        success: false,
        status: 'error',
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Get payment status from Stripe
  async getStripePaymentStatus(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        status: paymentIntent.status,
        data: paymentIntent,
        gateway: 'stripe'
      };
    } catch (error) {
      console.error('Stripe payment status retrieval failed:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'stripe'
      };
    }
  }

  // Calculate fees for a payment
  calculateFees(amount, gateway, isInternational = false) {
    const config = this.getGatewayConfig(gateway);
    
    if (gateway === 'paystack') {
      const feeRate = isInternational ? config.fees.international : config.fees.domestic;
      const fee = amount * feeRate;
      const cappedFee = Math.min(fee, 2000); // Cap at ₦2000 for Paystack
      
      return {
        fee: cappedFee,
        rate: feeRate,
        total: amount + cappedFee
      };
    }
    
    // Stripe fees
    const feeRate = config.fees.domestic;
    const fee = amount * feeRate + 0.30; // 2.9% + 30¢
    
    return {
      fee: fee,
      rate: feeRate,
      total: amount + fee
    };
  }

  // Create webhook endpoint handler
  async handleWebhook(gateway, body, signature) {
    if (gateway === 'stripe') {
      return this.handleStripeWebhook(body, signature);
    } else if (gateway === 'paystack') {
      return this.handlePaystackWebhook(body, signature);
    }
    
    return { success: false, error: 'Unknown gateway' };
  }

  // Handle Stripe webhook
  async handleStripeWebhook(body, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      return {
        success: true,
        event,
        gateway: 'stripe'
      };
    } catch (error) {
      console.error('Stripe webhook verification failed:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'stripe'
      };
    }
  }

  // Handle Paystack webhook
  async handlePaystackWebhook(body, signature) {
    try {
      const hash = crypto.createHmac('sha512', this.paystackSecretKey)
        .update(JSON.stringify(body))
        .digest('hex');
      
      if (hash !== signature) {
        return {
          success: false,
          error: 'Invalid signature',
          gateway: 'paystack'
        };
      }
      
      return {
        success: true,
        event: body,
        gateway: 'paystack'
      };
    } catch (error) {
      console.error('Paystack webhook verification failed:', error);
      return {
        success: false,
        error: error.message,
        gateway: 'paystack'
      };
    }
  }

  // Get supported countries for each gateway
  getSupportedCountries(gateway) {
    if (gateway === 'paystack') {
      return Array.from(this.africanCountries);
    }
    
    // Stripe has global coverage
    return ['global'];
  }
}

export default new PaymentGatewayService(); 