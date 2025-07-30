import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from './models/User.js';
import ServiceAgreement from './models/ServiceAgreement.js';

const testDatabaseConnection = async () => {
  try {
    console.log('🔧 Testing database connection...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Database connected successfully');
    
    // Test user creation
    console.log('🧪 Testing User model...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'student'
    };
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('✅ Test user already exists');
    } else {
      const user = await User.create(testUser);
      console.log('✅ User model working - created test user:', user._id);
    }
    
    // Test ServiceAgreement model
    console.log('🧪 Testing ServiceAgreement model...');
    const agreementCount = await ServiceAgreement.countDocuments();
    console.log('✅ ServiceAgreement model working - found', agreementCount, 'agreements');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 11000) {
      console.log('Note: Duplicate key error is expected if test user already exists');
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
};

// Run tests
testDatabaseConnection(); 