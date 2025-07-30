# 🎨 EDU-SAGE Stripe Payment Configuration Guide

This guide helps you configure Stripe payments for the EDU-SAGE platform, ensuring secure payment processing for both international users (via Stripe) and Nigerian users (via Paystack).

## 📋 Prerequisites

- Stripe account (https://stripe.com)
- Basic understanding of environment variables
- EDU-SAGE project cloned and dependencies installed

## 🔧 Setup Steps

### 1. Create Stripe Account and Get API Keys

1. **Sign up for Stripe**: Go to https://stripe.com and create an account
2. **Access Dashboard**: Navigate to https://dashboard.stripe.com
3. **Get API Keys**: Go to https://dashboard.stripe.com/apikeys
   - Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2. Set Up Webhook Endpoints

1. **Go to Webhooks**: Navigate to https://dashboard.stripe.com/webhooks
2. **Add Endpoint**: Click "Add endpoint"
3. **Configure Endpoint**:
   - **URL**: `http://localhost:5000/api/webhooks/stripe` (development)
   - **URL**: `https://yourdomain.com/api/webhooks/stripe` (production)
4. **Select Events**:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `invoice.payment_succeeded` (if using subscriptions)
5. **Copy Webhook Secret**: After creating, copy the webhook signing secret (starts with `whsec_`)

### 3. Configure Environment Variables

#### Backend Configuration (`backend/.env`)

```bash
# ========================================
# STRIPE PAYMENT CONFIGURATION
# ========================================

# Replace these with your actual Stripe keys
STRIPE_SECRET_KEY=sk_test_your_actual_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# Other required variables
MONGODB_URI=mongodb://127.0.0.1:27017/edu-sage
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### Frontend Configuration (`frontend/.env`)

```bash
# ========================================
# STRIPE PAYMENT CONFIGURATION
# ========================================

# Replace with your actual Stripe publishable key (same as backend)
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_actual_stripe_publishable_key
VITE_STRIPE_PUBLIC_KEY=pk_test_your_actual_stripe_publishable_key

# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_BASE_URL=http://localhost:5000
VITE_NODE_ENV=development
```

### 4. Test the Configuration

#### Run the Setup Script
```bash
node setup-stripe.js
```

#### Check Configuration Status
```bash
# Start the backend server
cd backend && npm run dev

# Check Stripe status endpoint
curl http://localhost:5000/api/payment/stripe/status
```

#### Test Payment Flow
1. Start both frontend and backend servers
2. Create a test agreement
3. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **Insufficient funds**: `4000 0000 0000 9995`
   - **Exp date**: Any future date
   - **CVC**: Any 3-digit number

## 🔐 Security Best Practices

### Environment Variables Security
- ✅ **Never commit** `.env` files to version control
- ✅ Use different keys for development and production
- ✅ Regularly rotate your API keys
- ✅ Use webhook secrets to verify webhook authenticity

### Production Deployment
- ✅ Replace test keys (`sk_test_`, `pk_test_`) with live keys (`sk_live_`, `pk_live_`)
- ✅ Update webhook URLs to your production domain
- ✅ Enable HTTPS for all payment-related endpoints
- ✅ Set up proper error monitoring and logging

## 🌍 Multi-Gateway Support

The system supports both Stripe and Paystack:

- **🇳🇬 Nigerian Users**: Automatically use Paystack (NGN currency)
- **🌍 International Users**: Automatically use Stripe (USD currency)

### Paystack Configuration (for Nigerian users)
```bash
# Add to backend/.env
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_paystack_webhook_secret
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. "Stripe not configured" Error
**Problem**: Environment variables not set or contain placeholder values
**Solution**: 
- Check your `.env` files exist and contain actual Stripe keys
- Run `node setup-stripe.js` to verify configuration
- Restart your development servers

#### 2. Webhook Signature Verification Failed
**Problem**: Webhook secret mismatch or missing
**Solution**:
- Verify `STRIPE_WEBHOOK_SECRET` matches your Stripe dashboard
- Ensure webhook endpoint URL is correct
- Check that webhook is receiving POST requests

#### 3. Payment Intent Creation Failed
**Problem**: Invalid API key or insufficient permissions
**Solution**:
- Verify `STRIPE_SECRET_KEY` is correct and has proper permissions
- Check if you're using test keys in development
- Ensure Stripe account is properly activated

#### 4. Frontend Can't Load Stripe
**Problem**: Missing or incorrect publishable key
**Solution**:
- Verify `REACT_APP_STRIPE_PUBLIC_KEY` and `VITE_STRIPE_PUBLIC_KEY` are set
- Ensure both frontend and backend use the same publishable key
- Clear browser cache and restart development server

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env.STRIPE_SECRET_KEY ? 'Secret key set' : 'Secret key missing')"

# Test Stripe connection
node -e "
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
stripe.balance.retrieve().then(console.log).catch(console.error);
"

# Validate webhook endpoint
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: test" \
  -d '{"type":"test"}'
```

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook testing

## 🎯 Production Checklist

Before going live:

- [ ] Replace all test keys with live keys
- [ ] Update webhook URLs to production domain
- [ ] Enable HTTPS
- [ ] Set up proper error monitoring
- [ ] Test payment flow end-to-end
- [ ] Configure proper logging
- [ ] Set up backup payment methods
- [ ] Review Stripe Dashboard settings
- [ ] Test webhook delivery
- [ ] Configure rate limiting

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Test with Stripe's test cards
4. Verify environment variable configuration
5. Contact the development team with specific error messages

---

**Note**: This configuration enables secure payment processing for the EDU-SAGE platform with proper multi-gateway support for different regions. 