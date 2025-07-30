#!/usr/bin/env node

/**
 * EDU-SAGE Stripe Configuration Validator
 * 
 * This script validates the Stripe payment configuration and runs basic tests
 * to ensure everything is properly set up for both frontend and backend.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 EDU-SAGE Stripe Configuration Validator');
console.log('==========================================\n');

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

// Validation results
const results = {
  backend: {
    envFile: false,
    stripeSecretKey: false,
    stripePublishableKey: false,
    stripeWebhookSecret: false,
    validKeys: false
  },
  frontend: {
    envFile: false,
    stripePublicKey: false,
    validKey: false
  },
  integration: {
    keysMatch: false,
    webhookEndpoint: false,
    testConnection: false
  }
};

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Helper functions
const success = (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`);
const error = (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`);
const warning = (text) => console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`);
const info = (text) => console.log(`${colors.blue}ℹ️  ${text}${colors.reset}`);

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
};

// Read environment file
const readEnvFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const vars = {};
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    });
    return vars;
  } catch {
    return {};
  }
};

// Validate Stripe key format
const validateStripeKey = (key, type) => {
  if (!key) return false;
  
  const patterns = {
    secret: /^sk_(test|live)_[a-zA-Z0-9]{99,}$/,
    publishable: /^pk_(test|live)_[a-zA-Z0-9]{99,}$/,
    webhook: /^whsec_[a-zA-Z0-9]{32,}$/
  };
  
  if (key.includes('REPLACE') || key.includes('your_') || key.includes('1234')) {
    return false;
  }
  
  return patterns[type] ? patterns[type].test(key) : false;
};

// Test Stripe connection
const testStripeConnection = async () => {
  try {
    // Dynamic import to avoid issues if Stripe isn't installed
    const { default: Stripe } = await import('stripe');
    
    if (!process.env.STRIPE_SECRET_KEY || !validateStripeKey(process.env.STRIPE_SECRET_KEY, 'secret')) {
      return { success: false, error: 'Invalid secret key' };
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Test API connection by retrieving account balance
    const balance = await stripe.balance.retrieve();
    
    return { 
      success: true, 
      data: {
        currency: balance.available[0]?.currency || 'usd',
        mode: process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test'
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message.includes('Invalid API Key') ? 'Invalid API key' : error.message 
    };
  }
};

// Main validation function
const validateConfiguration = async () => {
  console.log('🔧 Validating Backend Configuration...\n');
  
  // Check backend .env file
  const backendEnvPath = path.join(__dirname, 'backend', '.env');
  results.backend.envFile = fileExists(backendEnvPath);
  
  if (results.backend.envFile) {
    success('Backend .env file exists');
    
    const backendEnv = readEnvFile(backendEnvPath);
    
    // Check Stripe keys
    const secretKey = backendEnv.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
    const publishableKey = backendEnv.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY;
    const webhookSecret = backendEnv.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    
    results.backend.stripeSecretKey = !!secretKey;
    results.backend.stripePublishableKey = !!publishableKey;
    results.backend.stripeWebhookSecret = !!webhookSecret;
    
    if (secretKey) {
      if (validateStripeKey(secretKey, 'secret')) {
        success('Stripe secret key is valid');
        results.backend.validKeys = true;
      } else {
        error('Stripe secret key is invalid or contains placeholder');
      }
    } else {
      error('Stripe secret key is missing');
    }
    
    if (publishableKey) {
      if (validateStripeKey(publishableKey, 'publishable')) {
        success('Stripe publishable key is valid');
      } else {
        error('Stripe publishable key is invalid or contains placeholder');
      }
    } else {
      error('Stripe publishable key is missing');
    }
    
    if (webhookSecret) {
      if (validateStripeKey(webhookSecret, 'webhook')) {
        success('Stripe webhook secret is valid');
      } else {
        error('Stripe webhook secret is invalid or contains placeholder');
      }
    } else {
      warning('Stripe webhook secret is missing (required for production)');
    }
    
  } else {
    error('Backend .env file not found');
    info('Run: node setup-stripe.js to create environment files');
  }
  
  console.log('\n🎨 Validating Frontend Configuration...\n');
  
  // Check frontend .env file
  const frontendEnvPath = path.join(__dirname, 'frontend', '.env');
  results.frontend.envFile = fileExists(frontendEnvPath);
  
  if (results.frontend.envFile) {
    success('Frontend .env file exists');
    
    const frontendEnv = readEnvFile(frontendEnvPath);
    
    const reactKey = frontendEnv.REACT_APP_STRIPE_PUBLIC_KEY;
    const viteKey = frontendEnv.VITE_STRIPE_PUBLIC_KEY;
    
    results.frontend.stripePublicKey = !!(reactKey || viteKey);
    
    if (reactKey || viteKey) {
      const keyToValidate = reactKey || viteKey;
      if (validateStripeKey(keyToValidate, 'publishable')) {
        success('Frontend Stripe public key is valid');
        results.frontend.validKey = true;
      } else {
        error('Frontend Stripe public key is invalid or contains placeholder');
      }
    } else {
      error('Frontend Stripe public key is missing');
    }
    
  } else {
    error('Frontend .env file not found');
    info('Run: node setup-stripe.js to create environment files');
  }
  
  console.log('\n🔗 Validating Integration...\n');
  
  // Check if keys match between frontend and backend
  if (results.backend.envFile && results.frontend.envFile) {
    const backendEnv = readEnvFile(backendEnvPath);
    const frontendEnv = readEnvFile(frontendEnvPath);
    
    const backendPub = backendEnv.STRIPE_PUBLISHABLE_KEY;
    const frontendPub = frontendEnv.REACT_APP_STRIPE_PUBLIC_KEY || frontendEnv.VITE_STRIPE_PUBLIC_KEY;
    
    if (backendPub && frontendPub && backendPub === frontendPub) {
      success('Publishable keys match between frontend and backend');
      results.integration.keysMatch = true;
    } else {
      error('Publishable keys do not match between frontend and backend');
      info('Make sure both frontend and backend use the same publishable key');
    }
  }
  
  // Test Stripe connection
  if (results.backend.validKeys) {
    info('Testing Stripe API connection...');
    
    const connectionTest = await testStripeConnection();
    
    if (connectionTest.success) {
      success(`Stripe API connection successful (${connectionTest.data.mode} mode)`);
      results.integration.testConnection = true;
    } else {
      error(`Stripe API connection failed: ${connectionTest.error}`);
    }
  } else {
    warning('Skipping API connection test due to invalid keys');
  }
  
  // Check webhook endpoint file exists
  const webhookPath = path.join(__dirname, 'backend', 'routes', 'webhooks.js');
  if (fileExists(webhookPath)) {
    success('Webhook endpoint file exists');
    results.integration.webhookEndpoint = true;
  } else {
    error('Webhook endpoint file missing');
  }
};

// Generate summary report
const generateSummary = () => {
  console.log('\n📊 Configuration Summary');
  console.log('========================\n');
  
  const totalChecks = Object.values(results).reduce((acc, section) => 
    acc + Object.keys(section).length, 0
  );
  
  const passedChecks = Object.values(results).reduce((acc, section) => 
    acc + Object.values(section).filter(Boolean).length, 0
  );
  
  console.log(`Overall Score: ${passedChecks}/${totalChecks} checks passed\n`);
  
  // Backend summary
  console.log('🔧 Backend Configuration:');
  Object.entries(results.backend).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`  ${icon} ${key}: ${value ? 'OK' : 'FAIL'}`);
  });
  
  // Frontend summary
  console.log('\n🎨 Frontend Configuration:');
  Object.entries(results.frontend).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`  ${icon} ${key}: ${value ? 'OK' : 'FAIL'}`);
  });
  
  // Integration summary
  console.log('\n🔗 Integration Tests:');
  Object.entries(results.integration).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`  ${icon} ${key}: ${value ? 'OK' : 'FAIL'}`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  
  if (!results.backend.envFile || !results.frontend.envFile) {
    console.log('  • Run: node setup-stripe.js to create missing environment files');
  }
  
  if (!results.backend.validKeys) {
    console.log('  • Update backend/.env with valid Stripe keys from https://dashboard.stripe.com/apikeys');
  }
  
  if (!results.frontend.validKey) {
    console.log('  • Update frontend/.env with valid Stripe public key');
  }
  
  if (!results.integration.keysMatch) {
    console.log('  • Ensure both frontend and backend use the same Stripe publishable key');
  }
  
  if (!results.integration.testConnection) {
    console.log('  • Verify Stripe API keys are correctly configured');
  }
  
  if (passedChecks === totalChecks) {
    console.log('\n🎉 All checks passed! Stripe is properly configured.');
    console.log('You can now test payments using Stripe test cards:');
    console.log('  • Success: 4242 4242 4242 4242');
    console.log('  • Decline: 4000 0000 0000 0002');
  } else {
    console.log('\n⚠️  Configuration incomplete. Please address the issues above.');
  }
};

// Main execution
const main = async () => {
  try {
    await validateConfiguration();
    generateSummary();
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  }
};

// Run validation
main(); 