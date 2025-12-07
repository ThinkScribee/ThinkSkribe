#!/usr/bin/env node

/**
 * Test script to validate Vercel configuration
 */

import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testVercelConfig() {
  log('\n🧪 Testing Vercel Configuration', 'blue');
  log('================================', 'blue');

  try {
    // Read and parse vercel.json
    const vercelConfigPath = './vercel.json';
    if (!fs.existsSync(vercelConfigPath)) {
      log('❌ vercel.json not found', 'red');
      return false;
    }

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    log('✅ vercel.json found and valid JSON', 'green');

    // Check for conflicting properties
    if (vercelConfig.builds && vercelConfig.functions) {
      log('❌ Error: Both "builds" and "functions" properties found', 'red');
      log('   Remove one of them to fix the conflict', 'yellow');
      return false;
    }
    log('✅ No conflicting builds/functions properties', 'green');

    // Check required properties
    const requiredProps = ['version'];
    for (const prop of requiredProps) {
      if (!vercelConfig[prop]) {
        log(`❌ Missing required property: ${prop}`, 'red');
        return false;
      }
    }
    log('✅ Required properties present', 'green');

    // Check framework detection
    if (vercelConfig.framework) {
      log(`✅ Framework specified: ${vercelConfig.framework}`, 'green');
    } else {
      log('ℹ️  Framework will be auto-detected', 'yellow');
    }

    // Check build configuration
    if (vercelConfig.buildCommand) {
      log(`✅ Build command: ${vercelConfig.buildCommand}`, 'green');
    }
    if (vercelConfig.outputDirectory) {
      log(`✅ Output directory: ${vercelConfig.outputDirectory}`, 'green');
    }

    // Check SPA routing
    if (vercelConfig.rewrites && vercelConfig.rewrites.length > 0) {
      log('✅ SPA routing configured with rewrites', 'green');
    } else if (vercelConfig.routes && vercelConfig.routes.length > 0) {
      log('✅ SPA routing configured with routes', 'green');
    } else {
      log('⚠️  No SPA routing configuration found', 'yellow');
    }

    // Check headers
    if (vercelConfig.headers && vercelConfig.headers.length > 0) {
      log(`✅ ${vercelConfig.headers.length} header rule(s) configured`, 'green');
    }

    log('\n🎉 Vercel configuration is valid!', 'green');
    return true;

  } catch (error) {
    log(`❌ Error reading vercel.json: ${error.message}`, 'red');
    return false;
  }
}

function testPackageJson() {
  log('\n📦 Testing Package.json', 'blue');
  log('=======================', 'blue');

  try {
    const packagePath = './package.json';
    if (!fs.existsSync(packagePath)) {
      log('❌ package.json not found', 'red');
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    log('✅ package.json found and valid', 'green');

    // Check build script
    if (packageJson.scripts && packageJson.scripts.build) {
      log(`✅ Build script: ${packageJson.scripts.build}`, 'green');
    } else {
      log('❌ No build script found', 'red');
      return false;
    }

    // Check Vercel scripts
    const vercelScripts = ['deploy', 'deploy:preview', 'vercel:build', 'vercel:dev'];
    const foundScripts = vercelScripts.filter(script => 
      packageJson.scripts && packageJson.scripts[script]
    );
    
    if (foundScripts.length > 0) {
      log(`✅ Vercel scripts found: ${foundScripts.join(', ')}`, 'green');
    }

    return true;

  } catch (error) {
    log(`❌ Error reading package.json: ${error.message}`, 'red');
    return false;
  }
}

function testEnvironmentFiles() {
  log('\n🌍 Testing Environment Files', 'blue');
  log('============================', 'blue');

  const envFiles = [
    { file: '.env.example', required: true },
    { file: '.env.production', required: true },
    { file: '.env', required: false }
  ];

  let allGood = true;

  for (const { file, required } of envFiles) {
    if (fs.existsSync(file)) {
      log(`✅ ${file} found`, 'green');
    } else if (required) {
      log(`❌ ${file} missing (required)`, 'red');
      allGood = false;
    } else {
      log(`ℹ️  ${file} not found (optional)`, 'yellow');
    }
  }

  return allGood;
}

function main() {
  log('🚀 ThinqScribe Vercel Configuration Test', 'blue');
  log('========================================', 'blue');

  const tests = [
    testVercelConfig,
    testPackageJson,
    testEnvironmentFiles
  ];

  let allPassed = true;
  for (const test of tests) {
    if (!test()) {
      allPassed = false;
    }
  }

  log('\n' + '='.repeat(40), 'blue');
  if (allPassed) {
    log('🎉 All tests passed! Ready for deployment.', 'green');
    log('\nNext steps:', 'blue');
    log('1. vercel login', 'yellow');
    log('2. vercel (to initialize)', 'yellow');
    log('3. npm run deploy (for production)', 'yellow');
  } else {
    log('❌ Some tests failed. Please fix the issues above.', 'red');
    process.exit(1);
  }
}

main();