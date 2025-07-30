import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat.messages' },
  // File metadata fields
  fileUrl: { type: String },      // S3 URL for uploaded files
  fileName: { type: String },     // Original filename
  fileType: { type: String },     // MIME type
  voiceDuration: { type: Number }  // Voice message duration in seconds
});

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  messages: [messageSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
  
});

export default mongoose.model('Chat', chatSchema);
