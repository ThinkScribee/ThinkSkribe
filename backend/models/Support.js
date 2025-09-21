import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'closed'], 
    default: 'open' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  responses: [{
    message: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

SupportTicketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

SupportTicketSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('SupportTicket', SupportTicketSchema);