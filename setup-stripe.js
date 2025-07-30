#!/usr/bin/env node

/**
 * EDU-SAGE Stripe Payment Configuration Setup
 * 
 * This script helps configure Stripe payment integration for the EDU-SAGE platform.
 * It creates necessary environment files and validates the Stripe configuration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎨 EDU-SAGE Stripe Payment Configuration Setup');
console.log('===============================================\n');

// Backend environment template
const backendEnvTemplate = `# ========================================
# EDU-SAGE BACKEND ENVIRONMENT VARIABLES
# ========================================

# Database Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/edu-sage
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30d

# Server Configuration
PORT=5000
FRONTEND_URL=http://localhost:5173

# ========================================
# STRIPE PAYMENT CONFIGURATION
# ========================================

# Stripe Secret Key (Backend only) - REPLACE WITH YOUR KEY
# Get this from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY

# Stripe Publishable Key - REPLACE WITH YOUR KEY
# Get this from: https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY

# Stripe Webhook Secret - REPLACE WITH YOUR WEBHOOK SECRET
# Get this from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_WITH_YOUR_WEBHOOK_SECRET

# ========================================
# PAYSTACK PAYMENT CONFIGURATION
# ========================================

# Paystack Configuration (for Nigerian users)
PAYSTACK_SECRET_KEY=sk_test_REPLACE_WITH_YOUR_PAYSTACK_SECRET_KEY
PAYSTACK_PUBLIC_KEY=pk_test_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY
PAYSTACK_WEBHOOK_SECRET=whsec_REPLACE_WITH_YOUR_PAYSTACK_WEBHOOK_SECRET

# ========================================
# OTHER CONFIGURATIONS
# ========================================

# Email Service Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Debugging
DEBUG=true
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=your-session-secret-change-in-production
`;

// Frontend environment template
const frontendEnvTemplate = `# ========================================
# EDU-SAGE FRONTEND ENVIRONMENT VARIABLES
# ========================================

# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_BASE_URL=http://localhost:5000

# ========================================
# STRIPE PAYMENT CONFIGURATION
# ========================================

# Stripe Publishable Key (Frontend) - REPLACE WITH YOUR KEY
# Get this from: https://dashboard.stripe.com/apikeys
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY
VITE_STRIPE_PUBLIC_KEY=pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY

# ========================================
# PAYSTACK PAYMENT CONFIGURATION
# ========================================

# Paystack Public Key (Frontend) - REPLACE WITH YOUR KEY
# Get this from: https://dashboard.paystack.com/settings/developer
REACT_APP_PAYSTACK_PUBLIC_KEY=pk_test_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY
VITE_PAYSTACK_PUBLIC_KEY=pk_test_REPLACE_WITH_YOUR_PAYSTACK_PUBLIC_KEY

# ========================================
# APPLICATION CONFIGURATION
# ========================================

VITE_NODE_ENV=development
VITE_FRONTEND_URL=http://localhost:5173
VITE_BACKEND_URL=http://localhost:5000
VITE_DEBUG=true
VITE_SHOW_DEV_TOOLS=true
`;

// Function to create environment files
const createEnvFiles = () => {
  console.log('📝 Creating environment configuration files...\n');

  // Backend .env
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(backendEnvPath)) {
    fs.writeFileSync(backendEnvPath, backendEnvTemplate);
    console.log('✅ Created backend/.env file');
  } else {
    console.log('⚠️  backend/.env already exists - skipping');
  }

  // Frontend .env
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  if (!fs.existsSync(frontendEnvPath)) {
    fs.writeFileSync(frontendEnvPath, frontendEnvTemplate);
    console.log('✅ Created frontend/.env file');
  } else {
    console.log('⚠️  frontend/.env already exists - skipping');
  }

  // Create example files
  fs.writeFileSync(path.join(__dirname, 'backend', '.env.example'), backendEnvTemplate);
  fs.writeFileSync(path.join(__dirname, 'frontend', '.env.example'), frontendEnvTemplate);
  console.log('✅ Created .env.example files');
};

// Function to validate Stripe configuration
const validateStripeConfig = () => {
  console.log('\n🔍 Validating Stripe configuration...\n');

  try {
    // Check backend environment
    const backendEnvPath = path.join(__dirname, 'backend', '.env');
    if (fs.existsSync(backendEnvPath)) {
      const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');
      
      const stripeSecretKey = backendEnv.match(/STRIPE_SECRET_KEY=(.+)/)?.[1];
      const stripePublishableKey = backendEnv.match(/STRIPE_PUBLISHABLE_KEY=(.+)/)?.[1];
      const stripeWebhookSecret = backendEnv.match(/STRIPE_WEBHOOK_SECRET=(.+)/)?.[1];

      console.log('Backend Stripe Configuration:');
      console.log(`  Secret Key: ${stripeSecretKey ? (stripeSecretKey.includes('REPLACE') ? '❌ Not configured' : '✅ Configured') : '❌ Missing'}`);
      console.log(`  Publishable Key: ${stripePublishableKey ? (stripePublishableKey.includes('REPLACE') ? '❌ Not configured' : '✅ Configured') : '❌ Missing'}`);
      console.log(`  Webhook Secret: ${stripeWebhookSecret ? (stripeWebhookSecret.includes('REPLACE') ? '❌ Not configured' : '✅ Configured') : '❌ Missing'}`);
    }

    // Check frontend environment
    const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
    if (fs.existsSync(frontendEnvPath)) {
      const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
      
      const reactStripeKey = frontendEnv.match(/REACT_APP_STRIPE_PUBLIC_KEY=(.+)/)?.[1];
      const viteStripeKey = frontendEnv.match(/VITE_STRIPE_PUBLIC_KEY=(.+)/)?.[1];

      console.log('\nFrontend Stripe Configuration:');
      console.log(`  React App Key: ${reactStripeKey ? (reactStripeKey.includes('REPLACE') ? '❌ Not configured' : '✅ Configured') : '❌ Missing'}`);
      console.log(`  Vite Key: ${viteStripeKey ? (viteStripeKey.includes('REPLACE') ? '❌ Not configured' : '✅ Configured') : '❌ Missing'}`);
    }

  } catch (error) {
    console.error('❌ Error validating configuration:', error.message);
  }
};

// Function to show setup instructions
const showInstructions = () => {
  console.log('\n📋 Stripe Setup Instructions');
  console.log('============================\n');

  console.log('1. 🔑 Get your Stripe API keys:');
  console.log('   - Go to https://dashboard.stripe.com/apikeys');
  console.log('   - Copy your "Publishable key" (starts with pk_test_ or pk_live_)');
  console.log('   - Copy your "Secret key" (starts with sk_test_ or sk_live_)');
  console.log('');

  console.log('2. 🪝 Set up Stripe webhooks:');
  console.log('   - Go to https://dashboard.stripe.com/webhooks');
  console.log('   - Click "Add endpoint"');
  console.log('   - Add endpoint URL: http://localhost:5000/api/webhooks/stripe');
  console.log('   - Select events: checkout.session.completed, payment_intent.succeeded');
  console.log('   - Copy the webhook signing secret (starts with whsec_)');
  console.log('');

  console.log('3. ✏️  Update environment files:');
  console.log('   - Edit backend/.env and replace STRIPE_* values with your keys');
  console.log('   - Edit frontend/.env and replace STRIPE_* values with your keys');
  console.log('   - Make sure to use the same publishable key in both files');
  console.log('');

  console.log('4. 🔄 Restart your development servers:');
  console.log('   - Stop the servers (Ctrl+C)');
  console.log('   - Run: npm run dev');
  console.log('');

  console.log('5. 🧪 Test the integration:');
  console.log('   - Create a test agreement');
  console.log('   - Use Stripe test card: 4242 4242 4242 4242');
  console.log('   - Any future date for expiry, any CVC');
  console.log('');

  console.log('💡 For Nigerian users: Also configure Paystack keys for local payments');
  console.log('💡 For production: Replace test keys with live keys and update webhook URLs');
};

// Main execution
const main = () => {
  createEnvFiles();
  validateStripeConfig();
  showInstructions();

  console.log('\n🎉 Stripe configuration setup complete!');
  console.log('Remember to replace the placeholder keys with your actual Stripe keys.');
};

// Run the setup
main(); 