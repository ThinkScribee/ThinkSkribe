import dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose';
import dns from 'dns';


// Set DNS resolution to IPv4 first
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle initial connection errors
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
      if (err.name === 'MongoServerError') {
        console.error('Authentication failed. Please check your username and password.');
      }
    });

    // Handle disconnection
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\nDetailed error information:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    process.exit(1); // Exit if database connection fails
  }
};

export default connectDB;