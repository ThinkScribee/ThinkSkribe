import mongoose from 'mongoose';

// Job pricing constants
const JOB_PRICING = {
  'full-project': {
    minAmount: 80000,
    currency: 'NGN',
    description: 'Full project work (80,000 NGN and above)'
  },
  'it_Report':{
    minAmount:20000,
    currency:"NGN",
    description:"IT/SIWES Report (20,000 NGN and above)"
  },
  'term-paper': {
    minAmount: 25000,
    currency: 'NGN', 
    description: 'Term paper (25,000 NGN and above)'
  },
  'chapter': {
    minAmount: 30000,
    currency: 'NGN',
    description: 'Chapter work (30,000 NGN per chapter)'
  },
  'assignment': {
    minAmount: 10000,
    currency: 'NGN',
    description: 'Assignment (10,000 NGN and above)'
  }
};

const jobSchema = new mongoose.Schema({
  // Basic job information
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Job description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  // Job type and pricing
  jobType: {
    type: String,
    required: [true, 'Job type is required'],
    enum: {
      values: Object.keys(JOB_PRICING),
      message: 'Invalid job type. Must be one of: full-project, it_Report, term-paper, chapter, assignment'
    }
  },
  
  budget: {
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [0, 'Budget amount must be positive']
    },
    currency: {
      type: String,
      default: 'NGN',
      enum: ['NGN', 'USD', 'EUR', 'GBP']
    }
  },
  
  // Job status and lifecycle
  status: {
    type: String,
    enum: ['open', 'in-progress', 'completed', 'cancelled'],
    default: 'open'
  },
  
  // Priority and urgency
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  
  // Academic details
  academicLevel: {
    type: String,
    enum: ['undergraduate', 'masters', 'phd', 'professional'],
    required: [true, 'Academic level is required']
  },
  
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  
  // File attachments
  attachments: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Job requirements
  requirements: {
    wordCount: {
      min: {
        type: Number,
        min: [0, 'Minimum word count must be positive']
      },
      max: {
        type: Number,
        min: [0, 'Maximum word count must be positive']
      }
    },
    
    formatting: {
      type: String,
      enum: ['APA', 'MLA', 'Chicago', 'Harvard', 'Other', 'Not specified'],
      default: 'Not specified'
    },
    
    language: {
      type: String,
      default: 'English',
      maxlength: [50, 'Language cannot exceed 50 characters']
    },
    
    additionalNotes: {
      type: String,
      maxlength: [1000, 'Additional notes cannot exceed 1000 characters']
    }
  },
  
  // User references
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Job poster is required']
  },
  
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Application tracking
  applications: [{
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      maxlength: [1000, 'Application message cannot exceed 1000 characters']
    },
    proposedAmount: {
      type: Number,
      min: [0, 'Proposed amount must be positive']
    },
    estimatedTime: {
      type: String,
      maxlength: [100, 'Estimated time cannot exceed 100 characters']
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  
  // View tracking
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Job metrics
  metrics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalApplications: {
      type: Number,
      default: 0
    },
    lastViewedAt: {
      type: Date
    }
  },
  
  // Visibility and search
  isActive: {
    type: Boolean,
    default: true
  },
  
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Location and timezone
  location: {
    country: String,
    timezone: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
jobSchema.index({ postedBy: 1, createdAt: -1 });
jobSchema.index({ status: 1, isActive: 1 });
jobSchema.index({ jobType: 1, academicLevel: 1 });
jobSchema.index({ subject: 'text', title: 'text', description: 'text' });
jobSchema.index({ deadline: 1 });
jobSchema.index({ 'budget.amount': 1 });

// Virtual for budget validation
jobSchema.virtual('isBudgetValid').get(function() {
  const pricing = JOB_PRICING[this.jobType];
  if (!pricing) return false;
  
  // Convert to NGN if needed (simplified conversion)
  let amountInNGN = this.budget.amount;
  if (this.budget.currency !== 'NGN') {
    // Add currency conversion logic here if needed
    // For now, assume 1 USD = 1500 NGN
    if (this.budget.currency === 'USD') {
      amountInNGN = this.budget.amount * 1500;
    }
  }
  
  return amountInNGN >= pricing.minAmount;
});

// Virtual for time remaining
jobSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diff = deadline.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
});

// Virtual for urgency level
jobSchema.virtual('urgencyLevel').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diff = deadline.getTime() - now.getTime();
  const hours = diff / (1000 * 60 * 60);
  
  if (hours <= 24) return 'urgent';
  if (hours <= 72) return 'high';
  if (hours <= 168) return 'medium';
  return 'low';
});

// Pre-save middleware for validation
jobSchema.pre('save', function(next) {
  // Validate budget against job type
  const pricing = JOB_PRICING[this.jobType];
  if (pricing) {
    let amountInNGN = this.budget.amount;
    
    // Convert to NGN for validation
    if (this.budget.currency !== 'NGN') {
      if (this.budget.currency === 'USD') {
        amountInNGN = this.budget.amount * 1500;
      }
      // Add other currency conversions as needed
    }
    
    if (amountInNGN < pricing.minAmount) {
      return next(new Error(`${pricing.description}. Minimum amount: ${pricing.minAmount} NGN`));
    }
  }
  
  // Update metrics
  this.metrics.totalApplications = this.applications.length;
  this.metrics.totalViews = this.views.length;
  
  if (this.views.length > 0) {
    this.metrics.lastViewedAt = this.views[this.views.length - 1].viewedAt;
  }
  
  next();
});

// Static method to get job pricing info
jobSchema.statics.getJobPricing = function() {
  return JOB_PRICING;
};

// Static method to validate budget
jobSchema.statics.validateBudget = function(jobType, amount, currency = 'NGN') {
  const pricing = JOB_PRICING[jobType];
  if (!pricing) {
    return { valid: false, message: 'Invalid job type' };
  }
  
  let amountInNGN = amount;
  if (currency !== 'NGN') {
    if (currency === 'USD') {
      amountInNGN = amount * 1500;
    }
    // Add other currency conversions
  }
  
  if (amountInNGN < pricing.minAmount) {
    return {
      valid: false,
      message: `${pricing.description}. Minimum amount: ${pricing.minAmount} NGN`,
      minAmount: pricing.minAmount
    };
  }
  
  return { valid: true };
};

// Instance method to add view
jobSchema.methods.addView = function(userId) {
  // Check if user already viewed recently (within 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentView = this.views.find(
    view => view.user.toString() === userId.toString() && view.viewedAt > oneHourAgo
  );
  
  if (!recentView) {
    this.views.push({ user: userId });
    this.metrics.totalViews += 1;
    this.metrics.lastViewedAt = new Date();
  }
  
  return this.save();
};

// Instance method to add application
jobSchema.methods.addApplication = function(writerId, applicationData) {
  // Check if writer already applied
  const existingApplication = this.applications.find(
    app => app.writer.toString() === writerId.toString()
  );
  
  if (existingApplication) {
    throw new Error('You have already applied for this job');
  }
  
  this.applications.push({
    writer: writerId,
    ...applicationData
  });
  
  return this.save();
};

// Instance method to get job summary
jobSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    jobType: this.jobType,
    budget: this.budget,
    deadline: this.deadline,
    status: this.status,
    academicLevel: this.academicLevel,
    subject: this.subject,
    timeRemaining: this.timeRemaining,
    urgencyLevel: this.urgencyLevel,
    totalApplications: this.applications.length,
    totalViews: this.views.length,
    createdAt: this.createdAt
  };
};

export default mongoose.model('Job', jobSchema);
