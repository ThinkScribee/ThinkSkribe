#!/usr/bin/env node

/**
 * ThinqScribe Frontend - Vercel Setup Script
 * This script helps set up Vercel deployment for the frontend
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`\n${description}...`, 'cyan');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing`, 'red');
    return false;
  }
}

async function main() {
  log('\n🚀 ThinqScribe Frontend - Vercel Setup', 'bright');
  log('=====================================\n', 'bright');

  // Check if we're in the frontend directory
  if (!fs.existsSync('package.json')) {
    log('❌ Please run this script from the frontend directory', 'red');
    process.exit(1);
  }

  // Check required files
  log('📋 Checking required files...', 'yellow');
  const requiredFiles = [
    ['package.json', 'Package.json'],
    ['vercel.json', 'Vercel configuration'],
    ['.vercelignore', 'Vercel ignore file'],
    ['.env.example', 'Environment variables example'],
    ['.env.production', 'Production environment variables']
  ];

  let allFilesExist = true;
  requiredFiles.forEach(([file, description]) => {
    if (!checkFile(file, description)) {
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    log('\n❌ Some required files are missing. Please ensure all files are created.', 'red');
    process.exit(1);
  }

  // Check if Vercel CLI is installed
  log('\n🔧 Checking Vercel CLI...', 'yellow');
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    log('✅ Vercel CLI is installed', 'green');
  } catch (error) {
    log('❌ Vercel CLI not found. Installing...', 'yellow');
    if (!runCommand('npm install -g vercel', 'Installing Vercel CLI')) {
      log('❌ Failed to install Vercel CLI. Please install manually: npm install -g vercel', 'red');
      process.exit(1);
    }
  }

  // Install dependencies
  log('\n📦 Installing dependencies...', 'yellow');
  if (!runCommand('npm install', 'Installing project dependencies')) {
    process.exit(1);
  }

  // Build the project to test
  log('\n🏗️  Testing build...', 'yellow');
  if (!runCommand('npm run build', 'Building project')) {
    log('❌ Build failed. Please fix build errors before deploying.', 'red');
    process.exit(1);
  }

  // Setup complete
  log('\n🎉 Setup Complete!', 'green');
  log('==================', 'green');
  
  log('\nNext steps:', 'bright');
  log('1. Login to Vercel: vercel login', 'cyan');
  log('2. Initialize project: vercel', 'cyan');
  log('3. Set environment variables in Vercel dashboard', 'cyan');
  log('4. Deploy to production: npm run deploy', 'cyan');
  
  log('\nUseful commands:', 'bright');
  log('• Preview deployment: npm run deploy:preview', 'blue');
  log('• Production deployment: npm run deploy', 'blue');
  log('• Local development: npm run vercel:dev', 'blue');
  log('• Build project: npm run build', 'blue');
  
  log('\n📖 See DEPLOYMENT.md for detailed instructions', 'magenta');
  log('\n✨ Happy deploying!', 'green');
}

main().catch(error => {
  log(`❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
});