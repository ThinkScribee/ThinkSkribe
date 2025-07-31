// Production Configuration for Backend
export const PRODUCTION_CONFIG = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: 'production',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'your_mongodb_connection_string',
  
  // CORS Configuration
  CORS_ORIGINS: [
    'https://thinqscribe.com',
    'https://www.thinqscribe.com',
    'http://localhost:5173' // For development
  ],
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production',
  JWT_EXPIRES_IN: '7d',
  
  // Stripe Configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_live_your_stripe_secret_key',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_live_your_stripe_publishable_key',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret',
  
  // Paystack Configuration
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || 'sk_live_your_paystack_secret_key',
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY || 'pk_live_your_paystack_public_key',
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || 'whsec_your_paystack_webhook_secret',
  
  // Email Configuration
  MAILTRAP_HOST: process.env.MAILTRAP_HOST || 'smtp.mailtrap.io',
  MAILTRAP_PORT: process.env.MAILTRAP_PORT || '2525',
  MAILTRAP_USER: process.env.MAILTRAP_USER || 'your_mailtrap_user',
  MAILTRAP_PASS: process.env.MAILTRAP_PASS || 'your_mailtrap_password',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@thinqscribe.com',
  
  // Client URL
  CLIENT_URL: process.env.CLIENT_URL || 'https://thinqscribe.com',
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://thinqscribe.com',
  
  // Session Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'your_session_secret_change_in_production',
  
  // AWS Configuration (if using S3)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'edusage-ai-files',
  
  // API Keys
  SERP_API_KEY: process.env.SERP_API_KEY,
  NEWS_API_KEY: process.env.NEWS_API_KEY
};

// Environment variables for backend
export const BACKEND_ENV = {
  PORT: PRODUCTION_CONFIG.PORT,
  NODE_ENV: PRODUCTION_CONFIG.NODE_ENV,
  MONGODB_URI: PRODUCTION_CONFIG.MONGODB_URI,
  JWT_SECRET: PRODUCTION_CONFIG.JWT_SECRET,
  JWT_EXPIRES_IN: PRODUCTION_CONFIG.JWT_EXPIRES_IN,
  STRIPE_SECRET_KEY: PRODUCTION_CONFIG.STRIPE_SECRET_KEY,
  STRIPE_PUBLISHABLE_KEY: PRODUCTION_CONFIG.STRIPE_PUBLISHABLE_KEY,
  STRIPE_WEBHOOK_SECRET: PRODUCTION_CONFIG.STRIPE_WEBHOOK_SECRET,
  PAYSTACK_SECRET_KEY: PRODUCTION_CONFIG.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: PRODUCTION_CONFIG.PAYSTACK_PUBLIC_KEY,
  PAYSTACK_WEBHOOK_SECRET: PRODUCTION_CONFIG.PAYSTACK_WEBHOOK_SECRET,
  MAILTRAP_HOST: PRODUCTION_CONFIG.MAILTRAP_HOST,
  MAILTRAP_PORT: PRODUCTION_CONFIG.MAILTRAP_PORT,
  MAILTRAP_USER: PRODUCTION_CONFIG.MAILTRAP_USER,
  MAILTRAP_PASS: PRODUCTION_CONFIG.MAILTRAP_PASS,
  EMAIL_FROM: PRODUCTION_CONFIG.EMAIL_FROM,
  CLIENT_URL: PRODUCTION_CONFIG.CLIENT_URL,
  FRONTEND_URL: PRODUCTION_CONFIG.FRONTEND_URL,
  SESSION_SECRET: PRODUCTION_CONFIG.SESSION_SECRET,
  AWS_ACCESS_KEY_ID: PRODUCTION_CONFIG.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: PRODUCTION_CONFIG.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: PRODUCTION_CONFIG.AWS_REGION,
  AWS_S3_BUCKET: PRODUCTION_CONFIG.AWS_S3_BUCKET,
  SERP_API_KEY: PRODUCTION_CONFIG.SERP_API_KEY,
  NEWS_API_KEY: PRODUCTION_CONFIG.NEWS_API_KEY
}; 