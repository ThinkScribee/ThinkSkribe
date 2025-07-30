# Payment Gateway Setup Guide

## Overview
This guide covers the setup requirements for Paystack and Stripe payment gateways, including webhook URLs and IP whitelisting.

## 1. Environment Variables Required

Add these to your `.env` file:

```env
# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret

# Stripe Configuration (Already configured)
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Domain Configuration
DOMAIN=https://your-domain.com
```

## 2. Webhook URLs Setup

### Paystack Webhook Configuration
1. Log into your Paystack dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/paystack`
4. Subscribe to these events:
   - `charge.success`
   - `charge.failed`
   - `subscription.create`
   - `subscription.disable`
   - `invoice.create`
   - `invoice.payment_failed`

### Stripe Webhook Configuration
1. Log into your Stripe dashboard
2. Go to Developers → Webhooks
3. Add webhook URL: `https://your-domain.com/api/webhooks/stripe`
4. Subscribe to these events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 3. IP Whitelisting

### Paystack IP Addresses (Required)
Whitelist these IPs in your firewall/security settings:
```
52.31.139.75
52.49.173.169
52.214.14.220
```

### Stripe IP Addresses (Optional)
Stripe uses dynamic IPs, but we verify webhooks using webhook signatures for security.

## 4. Security Features

### Webhook Signature Verification
- **Paystack**: Uses SHA-512 HMAC with your webhook secret
- **Stripe**: Uses Stripe's webhook signature verification
- Both webhooks reject requests with invalid signatures

### Rate Limiting
- Webhook endpoints are protected against spam
- Failed webhook attempts are logged for monitoring

### Error Handling
- Webhook failures are logged with detailed error messages
- Automatic retry handling for failed webhook processing

## 5. Testing Webhooks

### Local Development
For local testing, use ngrok or similar tools:
```bash
ngrok http 3000
```
Then use the ngrok URL for webhook configuration:
- Paystack: `https://your-ngrok-url.ngrok.io/api/webhooks/paystack`
- Stripe: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`

### Production
Use your actual domain:
- Paystack: `https://your-domain.com/api/webhooks/paystack`
- Stripe: `https://your-domain.com/api/webhooks/stripe`

## 6. Monitoring and Logs

### Webhook Logs
Monitor webhook activity in your application logs:
```bash
# View webhook logs
tail -f logs/webhook.log

# Check for webhook errors
grep "webhook error" logs/application.log
```

### Payment Status Verification
The system automatically:
- Verifies payment status via webhooks
- Updates order status in the database
- Sends confirmation emails to users
- Handles failed payments gracefully

## 7. Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**
   - Check webhook URL is accessible
   - Verify webhook secret is correct
   - Check firewall/IP whitelisting

2. **Signature Verification Failed**
   - Ensure webhook secret matches dashboard configuration
   - Check request headers are being passed correctly

3. **Payment Status Not Updated**
   - Check webhook events are properly subscribed
   - Verify database connection in webhook handler
   - Check application logs for errors

### Support
- **Paystack**: support@paystack.com
- **Stripe**: support@stripe.com
- **Application**: Check application logs and error messages

## 8. Security Best Practices

1. **Keep Secrets Secure**
   - Never expose webhook secrets in client-side code
   - Use environment variables for all sensitive data
   - Rotate webhook secrets regularly

2. **Validate All Webhooks**
   - Always verify webhook signatures
   - Log suspicious webhook attempts
   - Implement rate limiting

3. **Monitor Webhook Activity**
   - Set up alerts for webhook failures
   - Monitor for unusual webhook patterns
   - Keep webhook logs for audit purposes

## 9. Implementation Status

✅ **Completed Features:**
- Multi-currency support (18+ currencies)
- Location-based gateway selection
- Secure webhook processing
- Signature verification
- Error handling and logging
- IP geolocation for African markets
- Smart payment gateway recommendations

🔄 **Next Steps:**
1. Configure webhook URLs in payment gateway dashboards
2. Set up IP whitelisting
3. Test webhook functionality
4. Monitor payment processing in production

## 10. API Endpoints

### Webhook Endpoints
- `POST /api/webhooks/paystack` - Paystack webhook handler
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Payment Endpoints
- `POST /api/agreements/:id/payment-recommendation` - Get payment recommendations
- `POST /api/payment/enhanced-checkout` - Create enhanced payment session
- `GET /api/payment/supported-currencies` - Get supported currencies
- `GET /api/payment/currency-rate` - Get currency exchange rates

### Location Endpoints
- `GET /api/location/detect` - Detect user location
- `GET /api/location/summary` - Get location summary
- `GET /api/location/is-african/:countryCode` - Check if country is African 