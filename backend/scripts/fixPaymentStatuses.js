/**
 * Script to fix payment statuses that are stuck in "processing" state
 * 
 * To run this script:
 * 1. Navigate to the backend directory
 * 2. Run: node scripts/fixPaymentStatuses.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ServiceAgreement from '../models/ServiceAgreement.js';
import Payment from '../models/Payment.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function fixPaymentStatuses() {
  try {
    console.log('Starting payment status fix...');
    
    // Find all agreements with processing installments
    const agreements = await ServiceAgreement.find({
      'installments.status': 'processing'
    });
    
    console.log(`Found ${agreements.length} agreements with processing installments`);
    
    let fixedCount = 0;
    
    // Update each agreement
    for (const agreement of agreements) {
      let updated = false;
      
      // Fix each processing installment
      agreement.installments.forEach(installment => {
        if (installment.status === 'processing') {
          console.log(`Fixing installment ${installment._id} for agreement ${agreement._id}`);
          installment.status = 'paid';
          installment.isPaid = true;
          if (!installment.paymentDate) {
            installment.paymentDate = new Date();
          }
          updated = true;
          fixedCount++;
        }
      });
      
      if (updated) {
        await agreement.save();
        console.log(`Saved agreement ${agreement._id}`);
      }
    }
    
    // Also update any processing payments
    const paymentsResult = await Payment.updateMany(
      { status: 'processing' },
      { $set: { status: 'completed' } }
    );
    
    console.log(`Fixed ${fixedCount} installments and ${paymentsResult.modifiedCount} payments`);
    
    // Success
    console.log('Payment status fix completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing payment statuses:', err);
    process.exit(1);
  }
}

// Run the function
fixPaymentStatuses(); 