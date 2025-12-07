import mongoose from 'mongoose';
import ServiceAgreement from '../models/ServiceAgreement.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

async function fixPaymentCalculations() {
  try {
    console.log('🔧 Starting payment calculation fix...');
    
    // Find all agreements
    const agreements = await ServiceAgreement.find({});
    
    console.log(`📊 Found ${agreements.length} agreements to check`);
    
    let fixedCount = 0;
    let totalProcessed = 0;
    
    // Process each agreement
    for (const agreement of agreements) {
      totalProcessed++;
      
      let calculatedPaidAmount = 0;
      let hasChanges = false;
      
      console.log(`\n📋 Processing agreement ${agreement._id}:`);
      console.log(`   Title: ${agreement.projectDetails?.title || 'Untitled'}`);
      console.log(`   Status: ${agreement.status}`);
      console.log(`   Current paidAmount: $${agreement.paidAmount || 0}`);
      console.log(`   Total amount: $${agreement.totalAmount || 0}`);
      
      if (agreement.installments && agreement.installments.length > 0) {
        console.log(`   Installments: ${agreement.installments.length}`);
        
        // Calculate based on installments
        agreement.installments.forEach((installment, index) => {
          console.log(`     Installment ${index + 1}: $${installment.amount} - Status: ${installment.status}`);
          
          // Fix any 'processing' status to 'paid' 
          if (installment.status === 'processing') {
            console.log(`     🔧 Fixing processing installment ${index + 1} to paid`);
            installment.status = 'paid';
            installment.isPaid = true;
            if (!installment.paymentDate) {
              installment.paymentDate = new Date();
            }
            hasChanges = true;
          }
          
          // Count paid and processing as paid
          if (installment.status === 'paid') {
            calculatedPaidAmount += installment.amount || 0;
          }
        });
        
        console.log(`   Calculated paidAmount: $${calculatedPaidAmount}`);
        
        // Update the agreement if paidAmount is incorrect
        if (Math.abs(agreement.paidAmount - calculatedPaidAmount) > 0.01) {
          console.log(`   🔧 Updating paidAmount: $${agreement.paidAmount} -> $${calculatedPaidAmount}`);
          agreement.paidAmount = calculatedPaidAmount;
          hasChanges = true;
        }
        
        // Update payment status
        const remainingAmount = (agreement.totalAmount || 0) - calculatedPaidAmount;
        if (Math.abs(remainingAmount) < 0.01) {
          if (agreement.paymentStatus !== 'completed') {
            console.log(`   🔧 Setting payment status to completed`);
            agreement.paymentStatus = 'completed';
            hasChanges = true;
          }
        } else if (calculatedPaidAmount > 0) {
          if (agreement.paymentStatus !== 'partial') {
            console.log(`   🔧 Setting payment status to partial`);
            agreement.paymentStatus = 'partial';
            hasChanges = true;
          }
        } else {
          if (agreement.paymentStatus !== 'pending') {
            console.log(`   🔧 Setting payment status to pending`);
            agreement.paymentStatus = 'pending';
            hasChanges = true;
          }
        }
      } else {
        console.log(`   No installments found`);
      }
      
      // Save if there are changes
      if (hasChanges) {
        await agreement.save();
        console.log(`   ✅ Agreement updated successfully`);
        fixedCount++;
      } else {
        console.log(`   ✅ Agreement already correct`);
      }
    }
    
    console.log(`\n🎉 Payment calculation fix completed!`);
    console.log(`📊 Processed: ${totalProcessed} agreements`);
    console.log(`🔧 Fixed: ${fixedCount} agreements`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing payment calculations:', err);
    process.exit(1);
  }
}

// Run the fix
async function main() {
  await connectDB();
  await fixPaymentCalculations();
}

main().catch(console.error); 