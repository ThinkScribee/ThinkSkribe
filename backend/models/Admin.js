import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  permissions: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Admin', AdminSchema);