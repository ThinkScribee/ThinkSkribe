import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalname: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['avatar', 'assignment', 'document', 'image'],
    default: 'document'
  }
}, {
  timestamps: true
});

export default mongoose.model('File', FileSchema);