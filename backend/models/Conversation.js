import mongoose from 'mongoose';

// ==========================================
// AI CONVERSATION MODEL
// ==========================================

const conversationSchema = new mongoose.Schema({
  // User association (from parent app authentication)
  userId: {
    type: String,
    required: true,
    index: true
  },
  
  // Conversation metadata
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: 200,
    trim: true
  },
  
  // AI model used for this conversation
  aiModel: {
    type: String,
    enum: ['gemini-2.0-flash', 'deepseek-coder'],
    default: 'gemini-2.0-flash',
    required: true
  },
  
  // Conversation settings
  settings: {
    temperature: {
      type: Number,
      default: 0.7,
      min: 0.1,
      max: 2.0
    },
    maxTokens: {
      type: Number,
      default: 4096,
      min: 100,
      max: 8192
    },
    streaming: {
      type: Boolean,
      default: true
    },
    research: {
      enabled: {
        type: Boolean,
        default: false
      },
      depth: {
        type: String,
        enum: ['quick', 'moderate', 'deep'],
        default: 'moderate'
      }
    }
  },
  
  // Conversation state
  messageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Status flags
  isArchived: {
    type: Boolean,
    default: false,
    index: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Usage tracking
  tokensUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Metadata for additional features
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Remove sensitive data from JSON output
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// ==========================================
// VIRTUAL PROPERTIES
// ==========================================

// Virtual for getting messages count
conversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId'
});

// Virtual for getting latest message
conversationSchema.virtual('latestMessage', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversationId',
  options: { sort: { createdAt: -1 }, limit: 1 }
});

// ==========================================
// INDEXES FOR PERFORMANCE
// ==========================================

// Compound indexes for efficient querying
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, lastActivity: -1 });
conversationSchema.index({ userId: 1, isArchived: 1, lastActivity: -1 });
conversationSchema.index({ aiModel: 1, createdAt: -1 });

// Text index for searching conversations
conversationSchema.index({ title: 'text' });

// ==========================================
// MIDDLEWARE
// ==========================================

// Pre-save middleware to update lastActivity
conversationSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('lastActivity')) {
    this.lastActivity = new Date();
  }
  next();
});

// Pre-save middleware to validate settings based on model
conversationSchema.pre('save', function(next) {
  if (this.aiModel === 'deepseek-coder' && this.settings.maxTokens > 4096) {
    this.settings.maxTokens = 4096;
  } else if (this.aiModel === 'gemini-2.0-flash' && this.settings.maxTokens > 8192) {
    this.settings.maxTokens = 8192;
  }
  next();
});

// ==========================================
// STATIC METHODS
// ==========================================

// Get user conversations with pagination and filtering
conversationSchema.statics.getUserConversations = function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    archived = false,
    model = null,
    search = null
  } = options;
  
  const query = { 
    userId, 
    isArchived: archived 
  };
  
  // Add model filter if specified
  if (model) {
    query.aiModel = model;
  }
  
  // Add search filter if specified
  if (search) {
    query.$text = { $search: search };
  }
  
  return this.find(query)
    .sort({ lastActivity: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('title aiModel lastActivity messageCount settings.research createdAt updatedAt');
};

// Get conversation stats for a user
conversationSchema.statics.getUserStats = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        archivedConversations: {
          $sum: { $cond: ['$isArchived', 1, 0] }
        },
        totalMessages: { $sum: '$messageCount' },
        totalTokens: { $sum: '$tokensUsed' },
        modelUsage: {
          $push: '$aiModel'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalConversations: 1,
        activeConversations: { $subtract: ['$totalConversations', '$archivedConversations'] },
        archivedConversations: 1,
        totalMessages: 1,
        totalTokens: 1,
        modelUsage: 1
      }
    }
  ]);
};

// Find conversations that need cleanup (old, inactive)
conversationSchema.statics.findStaleConversations = function(daysOld = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.find({
    lastActivity: { $lt: cutoffDate },
    messageCount: 0,
    isArchived: false
  });
};

// ==========================================
// INSTANCE METHODS
// ==========================================

// Update conversation activity
conversationSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save();
};

// Archive conversation
conversationSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

// Unarchive conversation
conversationSchema.methods.unarchive = function() {
  this.isArchived = false;
  return this.save();
};

// Increment message count
conversationSchema.methods.addMessage = function(tokenCount = 0) {
  this.messageCount += 1;
  this.tokensUsed += tokenCount;
  this.lastActivity = new Date();
  return this.save();
};

// Update conversation title based on first message
conversationSchema.methods.generateTitle = function(firstMessage) {
  if (this.messageCount <= 1 && firstMessage) {
    // Generate title from first 50 characters of message
    const title = firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...'
      : firstMessage;
    this.title = title;
    return this.save();
  }
  return Promise.resolve(this);
};

export default mongoose.model('Conversation', conversationSchema); 