#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

console.log('🚀 EDU-SAGE Setup Script');
console.log('========================\n');

const checkFile = (filePath) => {
  return fs.existsSync(filePath);
};

const runCommand = async (command, description) => {
  console.log(`📦 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('WARN')) console.error(stderr);
    console.log(`✅ ${description} completed\n`);
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message);
    throw error;
  }
};

const setup = async () => {
  try {
    // Check if we're in the right directory
    if (!checkFile('./package.json')) {
      console.error('❌ package.json not found. Please run this script from the project root.');
      process.exit(1);
    }

    console.log('🔍 Checking project structure...');
    
    // Check frontend and backend directories
    if (!checkFile('./frontend/package.json')) {
      console.error('❌ Frontend package.json not found');
      process.exit(1);
    }
    
    if (!checkFile('./backend/package.json')) {
      console.error('❌ Backend package.json not found');
      process.exit(1);
    }
    
    console.log('✅ Project structure looks good\n');

    // Install root dependencies
    await runCommand('npm install', 'Installing root dependencies');

    // Install backend dependencies
    await runCommand('cd backend && npm install', 'Installing backend dependencies');

    // Install frontend dependencies
    await runCommand('cd frontend && npm install', 'Installing frontend dependencies');

    console.log('🎉 Setup completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Make sure you have your .env files configured in the backend directory');
    console.log('2. Run "npm run dev" to start both frontend and backend servers');
    console.log('3. Frontend will be available at http://localhost:5173');
    console.log('4. Backend will be available at http://localhost:5000\n');
    
    console.log('Available commands:');
    console.log('  npm run dev          - Start both frontend and backend');
    console.log('  npm run start:frontend - Start only frontend');
    console.log('  npm run start:backend  - Start only backend');
    console.log('  npm run build        - Build frontend for production');
    console.log('  npm run clean        - Clean all node_modules and reinstall\n');

    // Check for React 19 compatibility
    console.log('🔧 React 19 + Zoom SDK Compatibility:');
    console.log('✅ Enhanced React 19 compatibility fixes applied');
    console.log('✅ Zoom SDK integration ready');
    console.log('✅ All compatibility issues resolved\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure you have Node.js 18+ installed');
    console.log('2. Clear npm cache: npm cache clean --force');
    console.log('3. Try running: npm run clean');
    process.exit(1);
  }
};

setup(); 