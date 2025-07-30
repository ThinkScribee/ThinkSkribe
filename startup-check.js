#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🚀 EDU-SAGE System Startup Check');
console.log('=====================================\n');

// Check if required files exist
const checkFiles = async () => {
  console.log('📁 Checking essential files...');
  
  const requiredFiles = [
    'backend/package.json',
    'backend/.env',
    'backend/app.js',
    'backend/server.js',
    'frontend/package.json',
    'frontend/src/App.jsx',
    'frontend/src/context/AuthContext.jsx'
  ];

  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING!`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
};

// Check environment variables
const checkEnvironment = () => {
  console.log('\n🌍 Checking environment variables...');
  
  const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY'
  ];

  // Read .env file
  if (fs.existsSync('backend/.env')) {
    const envContent = fs.readFileSync('backend/.env', 'utf8');
    const envLines = envContent.split('\n');
    const envVars = {};
    
    envLines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    let allEnvVarsPresent = true;
    for (const envVar of requiredEnvVars) {
      if (envVars[envVar]) {
        console.log(`✅ ${envVar} is set`);
      } else {
        console.log(`❌ ${envVar} is missing`);
        allEnvVarsPresent = false;
      }
    }
    
    return allEnvVarsPresent;
  } else {
    console.log('❌ .env file not found!');
    return false;
  }
};

// Check package dependencies
const checkDependencies = async () => {
  console.log('\n📦 Checking dependencies...');
  
  try {
    // Check backend dependencies
    const backendPackage = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
    console.log('✅ Backend package.json loaded');
    
    if (fs.existsSync('backend/node_modules')) {
      console.log('✅ Backend node_modules exists');
    } else {
      console.log('❌ Backend node_modules missing - run "npm install" in backend directory');
      return false;
    }

    // Check frontend dependencies
    const frontendPackage = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    console.log('✅ Frontend package.json loaded');
    
    if (fs.existsSync('frontend/node_modules')) {
      console.log('✅ Frontend node_modules exists');
    } else {
      console.log('❌ Frontend node_modules missing - run "npm install" in frontend directory');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error checking dependencies:', error.message);
    return false;
  }
};

// Test database connection
const testDatabase = async () => {
  console.log('\n🗄️  Testing database connection...');
  
  try {
    await execAsync('cd backend && node test-server.js');
    console.log('✅ Database connection test passed');
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
};

// Main check function
const runChecks = async () => {
  let allChecksPass = true;
  
  const filesOk = await checkFiles();
  const envOk = checkEnvironment();
  const depsOk = await checkDependencies();
  
  allChecksPass = filesOk && envOk && depsOk;
  
  console.log('\n📋 Summary:');
  console.log('=====================================');
  
  if (allChecksPass) {
    console.log('🎉 All checks passed! System ready to start.');
    console.log('\n💡 To start the system:');
    console.log('1. Backend: cd backend && npm run dev');
    console.log('2. Frontend: cd frontend && npm run dev');
  } else {
    console.log('⚠️  Some checks failed. Please fix the issues above before starting.');
  }
  
  return allChecksPass;
};

// Run the checks
runChecks().catch(console.error); 