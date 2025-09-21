import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  writer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
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
  budget: {
    type: Number,
    required: true,
    min: 0.01
  },
  status: { 
    type: String, 
    enum: ['draft', 'posted', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  requirements: [{
    type: String
  }],
  attachments: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  serviceType: {
    type: String,
    enum: ['essay', 'research', 'homework', 'thesis', 'dissertation', 'other'],
    required: true
  },
  academicLevel: {
    type: String,
    enum: ['high_school', 'undergraduate', 'graduate', 'phd'],
    required: true
  },
  pageCount: {
    type: Number,
    min: 1
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  bids: [{
    writer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    proposal: String,
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  agreement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceAgreement'
  },
  assignedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for days until deadline
OrderSchema.virtual('daysUntilDeadline').get(function() {
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for active bids count
OrderSchema.virtual('activeBidsCount').get(function() {
  return this.bids.filter(bid => bid.status === 'pending').length;
});

// Method to add bid
OrderSchema.methods.addBid = function(writerId, amount, proposal) {
  // Check if writer already has a bid
  const existingBid = this.bids.find(bid => 
    bid.writer.toString() === writerId.toString()
  );
  
  if (existingBid) {
    existingBid.amount = amount;
    existingBid.proposal = proposal;
    existingBid.submittedAt = new Date();
  } else {
    this.bids.push({
      writer: writerId,
      amount,
      proposal,
      submittedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to accept bid
OrderSchema.methods.acceptBid = function(bidId) {
  const bid = this.bids.id(bidId);
  if (!bid) {
    throw new Error('Bid not found');
  }
  
  // Reject all other bids
  this.bids.forEach(b => {
    if (b._id.toString() !== bidId.toString()) {
      b.status = 'rejected';
    }
  });
  
  bid.status = 'accepted';
  this.writer = bid.writer;
  this.status = 'assigned';
  this.assignedAt = new Date();
  
  return this.save();
};

// Method to cancel order
OrderSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Indexes for better performance
OrderSchema.index({ student: 1, status: 1 });
OrderSchema.index({ writer: 1, status: 1 });
OrderSchema.index({ status: 1, deadline: 1 });
OrderSchema.index({ subject: 1 });
OrderSchema.index({ serviceType: 1 });

export default mongoose.model('Order', OrderSchema);