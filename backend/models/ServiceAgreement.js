// models/ServiceAgreement.js
import mongoose from 'mongoose';

const InstallmentSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true,
    min: 0.01 
  },
  dueDate: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  isPaid: { 
    type: Boolean, 
    default: false 
  },
  paymentDate: { 
    type: Date 
  },
  stripePaymentIntentId: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending'
  }
});

const ServiceAgreementSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  writer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  projectDetails: {
    title: { 
      type: String, 
      required: true,
      trim: true
    },
    description: { 
      type: String, 
      required: true 
    },
    subject: {
      type: String,
      required: true
    },
    deadline: { 
      type: Date, 
      required: true
    },
    requirements: [{
      type: String
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'cancelled', 'disputed'],
    default: 'pending'
  },
  paymentStatus: {
      type: String, 
    enum: ['pending', 'partial', 'completed', 'failed'],
    default: 'pending'
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  paidAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  remainingAmount: { 
    type: Number,
    default: function() {
      return this.totalAmount - this.paidAmount;
    }
  },
  // Enhanced payment preferences
  paymentPreferences: {
    currency: {
      type: String,
      default: 'usd',
      enum: [
        'usd', 'eur', 'gbp', 'cad', 'aud', 'jpy', 'chf', 'sek', 'nok', 'dkk',
        'ngn', 'ghs', 'kes', 'zar', 'ugx', 'tzs', 'rwf', 'zmw', 'bwp', 'mur',
        'egp', 'mad', 'dza', 'tnd', 'xaf', 'xof', 'etb', 'aoa', 'mzn', 'sll',
        'lrd', 'gnf', 'cdf', 'mga', 'kmf', 'djf', 'sos', 'stn', 'cve', 'gmd',
        'inr', 'cny', 'krw', 'sgd', 'hkd', 'myr', 'thb', 'php', 'idr', 'vnd'
      ]
    },
    gateway: {
      type: String,
      enum: ['stripe', 'paystack'],
      default: 'stripe'
    },
    location: {
      country: String,
      countryCode: String,
      city: String,
      isAfrican: Boolean
    },
    // Store the native amount (in the currency student selected)
    nativeAmount: {
      type: Number,
      min: 0.01
    },
    // Exchange rate used at time of agreement creation
    exchangeRate: {
      type: Number,
      default: 1
    }
  },
  // Track actual payment currencies used
  paymentHistory: [{
    installmentIndex: Number,
    amount: Number,
    currency: String,
    gateway: String,
    transactionId: String,
    paidAt: {
      type: Date,
      default: Date.now
    }
  }],
  installments: [{
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'paid', 'failed', 'overdue'],
      default: 'pending'
    },
    paidDate: Date,
    stripePaymentIntentId: String
  }],
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  milestones: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    deadline: Date,
  status: {
    type: String,
      enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
    completedAt: Date
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  attachments: [{
    name: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  acceptedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for remaining balance
ServiceAgreementSchema.virtual('remainingBalance').get(function() {
  return this.totalAmount - this.paidAmount;
});

// Virtual for next installment
ServiceAgreementSchema.virtual('nextInstallment').get(function() {
  return this.installments && this.installments.length > 0 
    ? this.installments.find(inst => inst.status === 'pending')
    : null;
});

// Virtual for overdue installments
ServiceAgreementSchema.virtual('overdueInstallments').get(function() {
  if (!this.installments || this.installments.length === 0) {
    return [];
  }
  const now = new Date();
  return this.installments.filter(inst => 
    inst.status === 'pending' && inst.dueDate < now
  );
});

// Method to update progress
ServiceAgreementSchema.methods.updateProgress = function(progressPercentage) {
  this.progress = Math.max(0, Math.min(100, progressPercentage));
  if (this.progress === 100 && this.status === 'active') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  return this.save();
};

// Method to mark installment as paid
ServiceAgreementSchema.methods.markInstallmentPaid = function(installmentId, paymentIntentId) {
  if (!this.installments || this.installments.length === 0) {
    console.warn('No installments found for agreement:', this._id);
    return this.save();
  }
  
  const installment = this.installments.id(installmentId);
  if (installment) {
    installment.status = 'paid';
    installment.paidDate = new Date();
    installment.stripePaymentIntentId = paymentIntentId;
    this.paidAmount += installment.amount;
    
    // Update payment status
    if (this.paidAmount >= this.totalAmount) {
      this.paymentStatus = 'completed';
    } else {
      this.paymentStatus = 'partial';
    }
  }
  return this.save();
};

// Method to accept agreement
ServiceAgreementSchema.methods.accept = function() {
  this.status = 'active';
  this.acceptedAt = new Date();
  return this.save();
};

// Method to cancel agreement
ServiceAgreementSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Indexes for better performance
ServiceAgreementSchema.index({ student: 1, status: 1 });
ServiceAgreementSchema.index({ writer: 1, status: 1 });
ServiceAgreementSchema.index({ 'projectDetails.deadline': 1 });
ServiceAgreementSchema.index({ paymentStatus: 1 });

export default mongoose.model('ServiceAgreement', ServiceAgreementSchema);