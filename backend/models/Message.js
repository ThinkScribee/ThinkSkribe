import mongoose from 'mongoose';

// ==========================================
// AI MESSAGE MODEL
// ==========================================

const messageSchema = new mongoose.Schema({
  // Conversation reference
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  // Message role (user or assistant)
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
    index: true
  },
  
  // Message content
  content: {
    type: String,
    required: true,
    maxlength: 50000 // Allow for long responses
  },
  
  // Content type for different message types
  contentType: {
    type: String,
    enum: ['text', 'code', 'image_url', 'file_url', 'markdown'],
    default: 'text'
  },
  
  // File attachments
  files: [{
    name: {
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
    url: {
      type: String,
      required: false // Made optional - not needed for files with extracted content
    },
    s3Key: {
      type: String // For S3 file management
    },
    // Support for extracted content from documents
    content: {
      type: String, // Extracted text content
      maxlength: 100000 // Allow large document content
    },
    extractedText: {
      type: String, // Alternative field name for extracted content
      maxlength: 100000
    }
  }],
  
  // Token usage tracking
  tokens: {
    input: {
      type: Number,
      default: 0
    },
    output: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Processing metadata
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  
  // AI model used for this message (for assistant messages)
  aiModel: {
    type: String,
    enum: ['gemini-2.0-flash', 'deepseek-coder']
  },
  
  // Research data (if research was performed)
  research: {
    enabled: {
      type: Boolean,
      default: false
    },
    sources: [{
      title: String,
      url: String,
      snippet: String,
      relevanceScore: Number
    }],
    depth: {
      type: String,
      enum: ['quick', 'moderate', 'deep']
    }
  },
  
  // Message status
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  
  // Error information (if message failed)
  error: {
    message: String,
    code: String,
    details: mongoose.Schema.Types.Mixed
  },
  
  // Streaming information
  streaming: {
    isStreaming: {
      type: Boolean,
      default: false
    },
    chunks: [{
      content: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    completed: {
      type: Boolean,
      default: true
    }
  },
  
  // Message metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // User information (from parent app)
  userId: {
    type: String,
    required: true,
    index: true
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
// INDEXES FOR PERFORMANCE
// ==========================================

// Compound indexes for efficient querying
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });
messageSchema.index({ role: 1, createdAt: -1 });
messageSchema.index({ aiModel: 1, createdAt: -1 });
messageSchema.index({ status: 1, createdAt: -1 });

// Text index for message content search
messageSchema.index({ content: 'text' });

// ==========================================
// VIRTUAL PROPERTIES
// ==========================================

// Virtual for conversation reference
messageSchema.virtual('conversation', {
  ref: 'Conversation',
  localField: 'conversationId',
  foreignField: '_id',
  justOne: true
});

// Virtual for total file size
messageSchema.virtual('totalFileSize').get(function() {
  if (!this.files || this.files.length === 0) return 0;
  return this.files.reduce((total, file) => total + file.size, 0);
});

// Virtual for readable file size
messageSchema.virtual('readableFileSize').get(function() {
  const size = this.totalFileSize;
  if (size === 0) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return Math.round(size / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// ==========================================
// MIDDLEWARE
// ==========================================

// Pre-save middleware to calculate total tokens
messageSchema.pre('save', function(next) {
  if (this.tokens.input || this.tokens.output) {
    this.tokens.total = (this.tokens.input || 0) + (this.tokens.output || 0);
  }
  next();
});

// Pre-save middleware to validate content length based on model
messageSchema.pre('save', function(next) {
  if (this.role === 'assistant' && this.aiModel) {
    const maxLength = this.aiModel === 'deepseek-coder' ? 8000 : 50000;
    if (this.content.length > maxLength) {
      this.content = this.content.substring(0, maxLength) + '... [truncated]';
    }
  }
  next();
});

// Post-save middleware to update conversation
messageSchema.post('save', async function(doc) {
  try {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(
      doc.conversationId,
      {
        $inc: { messageCount: 1, tokensUsed: doc.tokens.total || 0 },
        $set: { lastActivity: new Date() }
      }
    );
  } catch (error) {
    console.error('Error updating conversation after message save:', error);
  }
});

// ==========================================
// STATIC METHODS
// ==========================================

// Get messages for a conversation with pagination
messageSchema.statics.getConversationMessages = function(conversationId, options = {}) {
  const {
    page = 1,
    limit = 50,
    includeSystem = false
  } = options;
  
  const query = { conversationId };
  
  if (!includeSystem) {
    query.role = { $ne: 'system' };
  }
  
  return this.find(query)
    .sort({ createdAt: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-streaming.chunks'); // Exclude large streaming data by default
};

// Get user message statistics
messageSchema.statics.getUserStats = function(userId, timeframe = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeframe);
  
  return this.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        userMessages: {
          $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
        },
        assistantMessages: {
          $sum: { $cond: [{ $eq: ['$role', 'assistant'] }, 1, 0] }
        },
        totalTokens: { $sum: '$tokens.total' },
        avgProcessingTime: { $avg: '$processingTime' },
        modelsUsed: { $addToSet: '$aiModel' },
        filesUploaded: { $sum: { $size: { $ifNull: ['$files', []] } } }
      }
    }
  ]);
};

// Search messages by content
messageSchema.statics.searchMessages = function(userId, searchQuery, options = {}) {
  const {
    page = 1,
    limit = 20,
    conversationId = null
  } = options;
  
  const query = {
    userId,
    $text: { $search: searchQuery }
  };
  
  if (conversationId) {
    query.conversationId = conversationId;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('conversationId', 'title aiModel');
};

// Find messages with files for cleanup
messageSchema.statics.findMessagesWithFiles = function(olderThanDays = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  return this.find({
    createdAt: { $lt: cutoffDate },
    'files.0': { $exists: true }
  }).select('files conversationId');
};

// ==========================================
// INSTANCE METHODS
// ==========================================

// Add streaming chunk
messageSchema.methods.addStreamingChunk = function(content) {
  if (!this.streaming.chunks) {
    this.streaming.chunks = [];
  }
  
  this.streaming.chunks.push({
    content,
    timestamp: new Date()
  });
  
  // Update main content with accumulated chunks
  this.content = this.streaming.chunks.map(chunk => chunk.content).join('');
  
  return this.save();
};

// Complete streaming
messageSchema.methods.completeStreaming = function() {
  this.streaming.isStreaming = false;
  this.streaming.completed = true;
  this.status = 'completed';
  return this.save();
};

// Mark as failed
messageSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = {
    message: error.message,
    code: error.code || 'UNKNOWN_ERROR',
    details: error.details || {}
  };
  return this.save();
};

// Get summary for display
messageSchema.methods.getSummary = function(maxLength = 100) {
  if (this.content.length <= maxLength) {
    return this.content;
  }
  return this.content.substring(0, maxLength) + '...';
};

export default mongoose.model('Message', messageSchema);