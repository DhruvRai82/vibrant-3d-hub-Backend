
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['residential', 'commercial', 'landscape', 'interior', 'other'],
    required: true
  },
  requirements: {
    type: String,
    trim: true
  },
  budget: {
    type: Number,
    min: 0
  },
  deadline: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed'],
    default: 'pending'
  },
  attachments: [{
    type: String // URLs to attached files
  }],
  notes: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fulfillmentModel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model'
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  // New fields for Razorpay payment tracking
  paymentId: {
    type: String,
    default: null
  },
  paymentPhone: {
    type: String,
    default: null
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the 'updatedAt' field before saving
requestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
