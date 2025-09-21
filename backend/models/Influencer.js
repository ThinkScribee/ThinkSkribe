import mongoose from 'mongoose';

const InfluencerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Influencer name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Influencer email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  referralCode: {
    type: String,
    required: [true, 'Referral code is required'],
    unique: true,
    uppercase: true,
    minlength: 5,
    maxlength: 5,
    match: [/^[A-Z]{5}$/, 'Referral code must be exactly 5 uppercase letters']
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: ['youtube', 'instagram', 'tiktok', 'twitter', 'linkedin', 'other']
  },
  followers: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  commission: {
    type: Number,
    default: 10, // Percentage commission
    min: 0,
    max: 100
  },
  stats: {
    totalSignups: {
      type: Number,
      default: 0
    },
    totalVisits: {
      type: Number,
      default: 0
    },
    writersPageVisits: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalCommission: {
      type: Number,
      default: 0
    },
    lastSignup: {
      type: Date
    },
    lastVisit: {
      type: Date
    }
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for performance
InfluencerSchema.index({ referralCode: 1 });
InfluencerSchema.index({ email: 1 });
InfluencerSchema.index({ isActive: 1 });

// Virtual for referral URL
InfluencerSchema.virtual('referralUrl').get(function() {
  return `https://thinqscribe.com/ref/${this.referralCode.toLowerCase()}`;
});

// Virtual for writers page referral URL
InfluencerSchema.virtual('writersReferralUrl').get(function() {
  return `https://thinqscribe.com/writers?ref=${this.referralCode.toUpperCase()}`;
});

// Method to increment signup count
InfluencerSchema.methods.incrementSignup = async function() {
  console.log(`📈 Incrementing signup count for ${this.name} (${this.referralCode})`);
  console.log(`   Before: totalSignups = ${this.stats.totalSignups}`);

  // Initialize stats if they don't exist
  if (!this.stats) {
    this.stats = {
      totalSignups: 0,
      totalRevenue: 0,
      totalCommission: 0
    };
  }

  this.stats.totalSignups += 1;
  this.stats.lastSignup = new Date();

  console.log(`   After: totalSignups = ${this.stats.totalSignups}`);
  console.log(`   Last signup: ${this.stats.lastSignup}`);

  // Save and return the updated document
  const savedInfluencer = await this.save();
  console.log(`   ✅ Saved to database: totalSignups = ${savedInfluencer.stats.totalSignups}`);
  
  return savedInfluencer;
};

// Method to increment visit count (optionally by page)
InfluencerSchema.methods.incrementVisit = async function(page) {
  // Initialize stats if they don't exist
  if (!this.stats) {
    this.stats = {
      totalSignups: 0,
      totalRevenue: 0,
      totalCommission: 0,
      totalVisits: 0,
      writersPageVisits: 0
    };
  }

  this.stats.totalVisits = (this.stats.totalVisits || 0) + 1;
  if (page === 'writers') {
    this.stats.writersPageVisits = (this.stats.writersPageVisits || 0) + 1;
  }
  this.stats.lastVisit = new Date();

  return this.save();
};

// Method to add revenue and commission
InfluencerSchema.methods.addRevenue = function(amount) {
  this.stats.totalRevenue += amount;
  this.stats.totalCommission += (amount * this.commission / 100);
  return this.save();
};

export default mongoose.model('Influencer', InfluencerSchema);

