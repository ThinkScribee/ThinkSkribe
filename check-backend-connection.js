#!/usr/bin/env node

// Backend Connection Checker
// This script checks if the backend server is running on the expected port

const http = require('http');

const BACKEND_URL = 'http://localhost:5000';
const BACKEND_PORT = 5000;

function checkBackendConnection() {
  console.log('🔍 Checking backend connection...');
  console.log(`📍 Checking: ${BACKEND_URL}`);
  
  const options = {
    hostname: 'localhost',
    port: BACKEND_PORT,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log('✅ Backend server is running!');
    console.log(`📊 Status: ${res.statusCode}`);
    console.log('🚀 You can now use the frontend application');
    process.exit(0);
  });

  req.on('error', (err) => {
    console.log('❌ Backend server is not running or not accessible');
    console.log('💡 Possible solutions:');
    console.log('   1. Start the backend server: cd backend && npm run dev');
    console.log('   2. Check if port 5000 is available');
    console.log('   3. Verify your backend configuration');
    console.log(`   4. Error details: ${err.message}`);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.log('⏰ Connection timeout - backend server may be slow to respond');
    req.destroy();
    process.exit(1);
  });

  req.end();
}

if (require.main === module) {
  checkBackendConnection();
}

module.exports = { checkBackendConnection }; 