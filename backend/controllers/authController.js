// scripts/auditReferralTracking.js - Database audit and fix script
import mongoose from 'mongoose';
import User from '../models/User.js';
import Influencer from '../models/Influencer.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Audit and fix referral tracking
const auditReferralTracking = async () => {
  console.log('🔍 Starting referral tracking audit...\n');
  
  try {
    // Get all influencers
    const influencers = await Influencer.find({});
    console.log(`Found ${influencers.length} influencers in database\n`);
    
    const auditResults = [];
    
    for (const influencer of influencers) {
      console.log(`\n📊 Auditing ${influencer.name} (${influencer.referralCode}):`);
      
      // Count actual users referred by this influencer
      const actualReferredUsers = await User.find({ 
        referredBy: influencer._id 
      }).select('name email createdAt role');
      
      const actualSignupCount = actualReferredUsers.length;
      const recordedSignupCount = influencer.stats?.totalSignups || 0;
      
      console.log(`   - Recorded signups: ${recordedSignupCount}`);
      console.log(`   - Actual signups: ${actualSignupCount}`);
      
      // Check for discrepancy
      const hasDiscrepancy = recordedSignupCount !== actualSignupCount;
      
      if (hasDiscrepancy) {
        console.log(`   ❌ DISCREPANCY FOUND! Difference: ${actualSignupCount - recordedSignupCount}`);
      } else {
        console.log(`   ✅ Stats are accurate`);
      }
      
      // Also check by referralCode (alternative referral method)
      const referralCodeUsers = await User.find({ 
        referralCode: influencer.referralCode 
      }).select('name email createdAt role');
      
      console.log(`   - Users with referralCode "${influencer.referralCode}": ${referralCodeUsers.length}`);
      
      // Collect audit data
      auditResults.push({
        influencer: {
          id: influencer._id,
          name: influencer.name,
          referralCode: influencer.referralCode
        },
        recorded: recordedSignupCount,
        actual: actualSignupCount,
        byReferralCode: referralCodeUsers.length,
        discrepancy: hasDiscrepancy,
        difference: actualSignupCount - recordedSignupCount,
        referredUsers: actualReferredUsers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }))
      });
      
      // List referred users
      if (actualReferredUsers.length > 0) {
        console.log(`   👥 Referred users:`);
        actualReferredUsers.forEach(user => {
          console.log(`      - ${user.name} (${user.email}) - ${user.role} - ${user.createdAt.toDateString()}`);
        });
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 AUDIT SUMMARY:');
    console.log('='.repeat(60));
    
    const totalInfluencers = auditResults.length;
    const influencersWithDiscrepancies = auditResults.filter(r => r.discrepancy).length;
    const totalRecordedSignups = auditResults.reduce((sum, r) => sum + r.recorded, 0);
    const totalActualSignups = auditResults.reduce((sum, r) => sum + r.actual, 0);
    
    console.log(`Total Influencers: ${totalInfluencers}`);
    console.log(`Influencers with discrepancies: ${influencersWithDiscrepancies}`);
    console.log(`Total recorded signups: ${totalRecordedSignups}`);
    console.log(`Total actual signups: ${totalActualSignups}`);
    console.log(`Overall difference: ${totalActualSignups - totalRecordedSignups}`);
    
    if (influencersWithDiscrepancies > 0) {
      console.log('\n❌ DISCREPANCIES FOUND:');
      auditResults
        .filter(r => r.discrepancy)
        .forEach(r => {
          console.log(`   ${r.influencer.name} (${r.influencer.referralCode}): Recorded=${r.recorded}, Actual=${r.actual}, Diff=${r.difference}`);
        });
    }
    
    return auditResults;
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  }
};

// Fix referral tracking discrepancies
const fixReferralTracking = async (auditResults) => {
  console.log('\n🔧 Starting referral tracking fixes...\n');
  
  const discrepancies = auditResults.filter(r => r.discrepancy);
  
  if (discrepancies.length === 0) {
    console.log('✅ No discrepancies found. Nothing to fix.');
    return;
  }
  
  for (const result of discrepancies) {
    console.log(`\n🔧 Fixing ${result.influencer.name} (${result.influencer.referralCode}):`);
    console.log(`   Updating signup count from ${result.recorded} to ${result.actual}`);
    
    try {
      const updatedInfluencer = await Influencer.findByIdAndUpdate(
        result.influencer.id,
        {
          $set: {
            'stats.totalSignups': result.actual,
            'stats.lastSignupDate': result.referredUsers.length > 0 
              ? new Date(Math.max(...result.referredUsers.map(u => new Date(u.createdAt)))) 
              : undefined,
            updatedAt: new Date()
          }
        },
        { new: true }
      );
      
      if (updatedInfluencer) {
        console.log(`   ✅ Successfully updated ${result.influencer.name}`);
        console.log(`   📊 New stats: ${updatedInfluencer.stats.totalSignups} signups`);
      } else {
        console.log(`   ❌ Failed to find and update influencer`);
      }
    } catch (error) {
      console.log(`   ❌ Error updating ${result.influencer.name}:`, error.message);
    }
  }
  
  console.log('\n✅ Referral tracking fixes completed!');
};

// Verify users have proper referral attribution
const verifyUserReferralAttribution = async () => {
  console.log('\n🔍 Verifying user referral attribution...\n');
  
  // Find users with referralCode but no referredBy
  const usersWithCodeButNoRef = await User.find({
    referralCode: { $exists: true, $ne: null },
    referredBy: { $exists: false }
  }).select('name email referralCode');
  
  console.log(`Found ${usersWithCodeButNoRef.length} users with referralCode but no referredBy`);
  
  for (const user of usersWithCodeButNoRef) {
    console.log(`\n🔧 Fixing user ${user.name} (${user.email}):`);
    console.log(`   ReferralCode: ${user.referralCode}`);
    
    // Find the influencer with this referral code
    const influencer = await Influencer.findOne({ 
      referralCode: user.referralCode 
    });
    
    if (influencer) {
      console.log(`   Found influencer: ${influencer.name}`);
      
      // Update user with referredBy
      await User.findByIdAndUpdate(user._id, {
        $set: { referredBy: influencer._id }
      });
      
      console.log(`   ✅ Updated user's referredBy field`);
    } else {
      console.log(`   ❌ No influencer found for referralCode: ${user.referralCode}`);
    }
  }
  
  // Find users with referredBy but no referralCode
  const usersWithRefButNoCode = await User.find({
    referredBy: { $exists: true, $ne: null },
    referralCode: { $exists: false }
  }).populate('referredBy', 'referralCode name');
  
  console.log(`\nFound ${usersWithRefButNoCode.length} users with referredBy but no referralCode`);
  
  for (const user of usersWithRefButNoCode) {
    if (user.referredBy && user.referredBy.referralCode) {
      console.log(`\n🔧 Adding referralCode to user ${user.name}:`);
      
      await User.findByIdAndUpdate(user._id, {
        $set: { referralCode: user.referredBy.referralCode }
      });
      
      console.log(`   ✅ Added referralCode: ${user.referredBy.referralCode}`);
    }
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  try {
    // Step 1: Audit current state
    const auditResults = await auditReferralTracking();
    
    // Step 2: Fix user attribution issues
    await verifyUserReferralAttribution();
    
    // Step 3: Fix influencer stats
    await fixReferralTracking(auditResults);
    
    // Step 4: Re-audit to verify fixes
    console.log('\n🔍 Re-auditing after fixes...');
    await auditReferralTracking();
    
  } catch (error) {
    console.error('❌ Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
};

// Run the script
if (process.argv[2] === 'run') {
  main();
} else {
  console.log('Usage: node auditReferralTracking.js run');
  console.log('This script will:');
  console.log('1. Audit all influencer referral stats');
  console.log('2. Compare recorded vs actual signup counts');
  console.log('3. Fix any discrepancies found');
  console.log('4. Ensure proper user referral attribution');
}

export { auditReferralTracking, fixReferralTracking, verifyUserReferralAttribution };
