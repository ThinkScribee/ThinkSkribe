import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['free', 'premium', 'pro'], required: true },
  status: { type: String, enum: ['active', 'canceled', 'expired'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  paymentMethod: { type: String },
  stripeSubscriptionId: { type: String },
});

export default mongoose.model('Subscription', SubscriptionSchema);