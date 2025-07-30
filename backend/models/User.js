import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken';

const WriterProfileSchema = new mongoose.Schema({
  bio: {
    type: String,
    maxlength: 1000
  },
  specialties: [{
    type: String,
    required: true
  }],
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    default: 0 // Years of experience
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  portfolio: [{
    title: String,
    description: String,
    fileUrl: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  hourlyRate: {
    type: Number,
    min: 0
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available'
  },
  languages: [{
    type: String
  }],
  verified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  approvedAt: {
    type: Date
  },
  publishedAt: {
    type: Date
  }
});

const PaymentTermsSchema = new mongoose.Schema({
  stripeAccountId: String,
  bankAccount: {
    accountNumber: String,
    routingNumber: String,
    accountHolderName: String
  },
  paymentSchedule: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'monthly'
  }
});

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: { 
    type: String, 
    enum: ['student', 'writer', 'admin'], 
    default: 'student' 
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  location: {
    country: String,
    countryCode: String,
    city: String,
    region: String,
    timezone: String,
    currency: String,
    currencySymbol: String,
    flag: String,
    displayName: String,
    isAfrican: Boolean,
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  },
  credits: { 
    type: Number, 
    default: 0,
    min: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  
  // Writer-specific fields
  writerProfile: WriterProfileSchema,
  
  // Payment-related fields
  paymentTerms: PaymentTermsSchema,
  stripeCustomerId: String,
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  
  // Verification tokens
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for writer rating display
UserSchema.virtual('ratingDisplay').get(function() {
  if (this.role === 'writer' && this.writerProfile?.rating?.count > 0) {
    return `${this.writerProfile.rating.average.toFixed(1)} (${this.writerProfile.rating.count} reviews)`;
  }
  return 'No ratings yet';
});

// Indexes for Performance
UserSchema.index({ email: 1 });
UserSchema.index({ 'writerProfile.specialties': 1 });
UserSchema.index({ 'studentProfile.institution': 1 });

export default mongoose.model('User', UserSchema);