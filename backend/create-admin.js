// Create Admin User Script
import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin user details
    const adminData = {
      name: 'Admin User',
      email: 'thinqscribe@gmail.com', // Change this to your preferred email
      password: 'ThinkScribe01@', // Change this to your preferred password
      role: 'admin',
      isVerified: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    
    if (existingAdmin) {
      console.log('📝 Admin user already exists. Updating...');
      
      // Update existing user
      existingAdmin.name = adminData.name;
      existingAdmin.role = 'admin';
      existingAdmin.isVerified = true;
      
      // Only update password if provided
      if (adminData.password) {
        existingAdmin.password = adminData.password;
      }
      
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully!');
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const admin = await User.create(adminData);
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n🎯 Admin Login Credentials:');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log(`Role: admin`);
    
    console.log('\n📋 You can now log in with these credentials!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
    process.exit(0);
  }
};

// Alternative: Fix existing user
const fixExistingUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('📝 Current user details:');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
    console.log(`Verified: ${user.isVerified}`);

    // Update to admin
    user.role = 'admin';
    user.isVerified = true;
    
    // Set a new password (this will be properly hashed)
    user.password = 'admin123'; // Change this
    
    await user.save();
    
    console.log('✅ User updated to admin successfully!');
    console.log('\n🎯 Login Credentials:');
    console.log(`Email: ${user.email}`);
    console.log(`Password: admin123`);
    console.log(`Role: admin`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Check command line arguments
const args = process.argv.slice(2);

if (args[0] === 'fix' && args[1]) {
  // Fix existing user: node create-admin.js fix user@example.com
  fixExistingUser(args[1]);
} else {
  // Create new admin: node create-admin.js
  createAdmin();
} 