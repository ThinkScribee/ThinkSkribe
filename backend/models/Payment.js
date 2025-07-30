import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  // Gateway-specific payment IDs
  stripePaymentIntentId: {
    type: String,
    required: false // No longer required since we support multiple gateways
  },
  stripeSessionId: {
    type: String
  },
  paystackPaymentId: {
    type: String
  },
  paystackTransactionId: {
    type: String
  },
  paystackReference: {
    type: String
  },
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
  agreement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceAgreement',
    required: true
  },
  installment: {
    installmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    dueDate: {
      type: Date,
      required: true
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0.01
  },
  // Enhanced currency support
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
  // Original amount in original currency (before conversion)
  originalAmount: {
    type: Number,
    required: true,
    min: 0.01
  },
  originalCurrency: {
    type: String,
    required: true
  },
  // Exchange rate used for conversion
  exchangeRate: {
    type: Number,
    default: 1
  },
  // Payment gateway
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paystack'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled', 'refunded'],
    default: 'pending'
  },
  // Enhanced payment methods
  paymentMethod: {
    type: String,
    enum: [
      // Stripe methods
      'card', 'bank_transfer', 'paypal', 'sepa_debit', 'alipay', 'wechat_pay',
      // Paystack methods
      'mobile_money', 'ussd', 'qr', 'bank_transfer_ng', 'card_ng'
    ],
    default: 'card'
  },
  platformFee: {
    type: Number,
    default: 0
  },
  writerAmount: {
    type: Number,
    required: true
  },
  // Location information
  location: {
    country: String,
    countryCode: String,
    city: String,
    currency: String,
    timezone: String
  },
  metadata: {
    projectTitle: String,
    projectDescription: String,
    customerEmail: String,
    customerName: String,
    gatewayRecommended: String, // Which gateway was recommended
    gatewaySelected: String, // Which gateway was actually used
    ipAddress: String,
    userAgent: String
  },
  refund: {
    refundId: String,
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed']
    },
    requestedAt: Date,
    processedAt: Date
  },
  receiptUrl: String,
  failureReason: String,
  processedAt: Date,
  paymentDate: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for faster queries
PaymentSchema.index({ student: 1, status: 1 });
PaymentSchema.index({ writer: 1, status: 1 });
PaymentSchema.index({ agreement: 1 });
PaymentSchema.index({ stripePaymentIntentId: 1 });
PaymentSchema.index({ stripeSessionId: 1 });
PaymentSchema.index({ paystackPaymentId: 1 });
PaymentSchema.index({ paystackReference: 1 });
PaymentSchema.index({ paymentGateway: 1, status: 1 });
PaymentSchema.index({ currency: 1 });
PaymentSchema.index({ 'location.countryCode': 1 });

// Virtual for formatted amount with currency
PaymentSchema.virtual('formattedAmount').get(function() {
  const currencySymbols = {
    'usd': '$', 'eur': '€', 'gbp': '£', 'cad': 'C$', 'aud': 'A$', 'jpy': '¥',
    'chf': 'CHF', 'sek': 'kr', 'nok': 'kr', 'dkk': 'kr',
    'ngn': '₦', 'ghs': '₵', 'kes': 'KSh', 'zar': 'R', 'ugx': 'USh',
    'tzs': 'TSh', 'rwf': 'FRw', 'zmw': 'ZK', 'bwp': 'P', 'mur': '₨',
    'egp': 'E£', 'mad': 'MAD', 'dza': 'DA', 'tnd': 'TD', 'xaf': 'FCFA',
    'xof': 'CFA', 'etb': 'Br', 'aoa': 'Kz', 'mzn': 'MT', 'sll': 'Le',
    'lrd': 'L$', 'gnf': 'FG', 'cdf': 'FC', 'mga': 'Ar', 'kmf': 'CF',
    'djf': 'Fdj', 'sos': 'Sh', 'stn': 'Db', 'cve': '$', 'gmd': 'D',
    'inr': '₹', 'cny': '¥', 'krw': '₩', 'sgd': 'S$', 'hkd': 'HK$',
    'myr': 'RM', 'thb': '฿', 'php': '₱', 'idr': 'Rp', 'vnd': '₫'
  };
  
  const symbol = currencySymbols[this.currency] || this.currency.toUpperCase();
  const decimals = ['jpy', 'krw', 'vnd', 'ugx', 'rwf', 'kmf', 'djf', 'gnf', 'mga'].includes(this.currency) ? 0 : 2;
  return `${symbol}${this.amount.toFixed(decimals)}`;
});

// Virtual for original formatted amount
PaymentSchema.virtual('formattedOriginalAmount').get(function() {
  const currencySymbols = {
    'usd': '$', 'eur': '€', 'gbp': '£', 'cad': 'C$', 'aud': 'A$', 'jpy': '¥',
    'chf': 'CHF', 'sek': 'kr', 'nok': 'kr', 'dkk': 'kr',
    'ngn': '₦', 'ghs': '₵', 'kes': 'KSh', 'zar': 'R', 'ugx': 'USh',
    'tzs': 'TSh', 'rwf': 'FRw', 'zmw': 'ZK', 'bwp': 'P', 'mur': '₨',
    'egp': 'E£', 'mad': 'MAD', 'dza': 'DA', 'tnd': 'TD', 'xaf': 'FCFA',
    'xof': 'CFA', 'etb': 'Br', 'aoa': 'Kz', 'mzn': 'MT', 'sll': 'Le',
    'lrd': 'L$', 'gnf': 'FG', 'cdf': 'FC', 'mga': 'Ar', 'kmf': 'CF',
    'djf': 'Fdj', 'sos': 'Sh', 'stn': 'Db', 'cve': '$', 'gmd': 'D',
    'inr': '₹', 'cny': '¥', 'krw': '₩', 'sgd': 'S$', 'hkd': 'HK$',
    'myr': 'RM', 'thb': '฿', 'php': '₱', 'idr': 'Rp', 'vnd': '₫'
  };
  
  const symbol = currencySymbols[this.originalCurrency] || this.originalCurrency.toUpperCase();
  const decimals = ['jpy', 'krw', 'vnd', 'ugx', 'rwf', 'kmf', 'djf', 'gnf', 'mga'].includes(this.originalCurrency) ? 0 : 2;
  return `${symbol}${this.originalAmount.toFixed(decimals)}`;
});

// Pre-save middleware to calculate platform fee and writer amount
PaymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    // Platform fee removed - writers get full amount
    this.platformFee = 0;
    this.writerAmount = this.amount;
  }
  
  // Set original amount and currency if not set
  if (this.isNew && !this.originalAmount) {
    this.originalAmount = this.amount;
    this.originalCurrency = this.currency;
  }
  
  next();
});

// Static method to find payments by agreement
PaymentSchema.statics.findByAgreement = function(agreementId) {
  return this.find({ agreement: agreementId }).populate('student writer', 'name email');
};

// Static method to find payments by user
PaymentSchema.statics.findByUser = function(userId, role = 'student') {
  const query = {};
  query[role] = userId;
  return this.find(query).populate('agreement', 'projectDetails totalAmount');
};

// Static method to find payments by gateway
PaymentSchema.statics.findByGateway = function(gateway) {
  return this.find({ paymentGateway: gateway });
};

// Static method to find payments by currency
PaymentSchema.statics.findByCurrency = function(currency) {
  return this.find({ currency: currency });
};

// Static method to get payment statistics by country
PaymentSchema.statics.getStatsByCountry = function() {
  return this.aggregate([
    { $match: { status: { $in: ['succeeded', 'completed'] } } },
    { $group: {
      _id: '$location.countryCode',
      totalAmount: { $sum: '$amount' },
      totalTransactions: { $sum: 1 },
      currencies: { $addToSet: '$currency' },
      gateways: { $addToSet: '$paymentGateway' }
    }},
    { $sort: { totalAmount: -1 } }
  ]);
};

// Instance method to process refund
PaymentSchema.methods.processRefund = function(amount, reason) {
  this.refund = {
    amount: amount || this.amount,
    reason,
    status: 'pending',
    requestedAt: new Date()
  };
  return this.save();
};

// Instance method to get gateway-specific payment ID
PaymentSchema.methods.getGatewayPaymentId = function() {
  if (this.paymentGateway === 'stripe') {
    return this.stripePaymentIntentId || this.stripeSessionId;
  } else if (this.paymentGateway === 'paystack') {
    return this.paystackPaymentId || this.paystackReference;
  }
  return this.paymentId;
};

export default mongoose.model('Payment', PaymentSchema);