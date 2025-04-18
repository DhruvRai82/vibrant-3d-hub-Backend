// --- START OF FILE models/payment.model.js (NEW FILE) ---

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { // The user who made the payment
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  model: { // The model that was purchased
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true,
    index: true,
  },
  relatedRequest: { // Optional: Link to the fulfilled request, if applicable
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    index: true, // Index for potential lookups
    default: null,
  },
  amount: { // Amount paid (e.g., 500.00)
    type: Number,
    required: true,
  },
  currency: { // e.g., 'INR', 'USD'
    type: String,
    required: true,
    default: 'INR',
  },
  paymentGateway: { // e.g., 'razorpay', 'stripe'
    type: String,
    required: true,
    default: 'razorpay',
  },
  paymentId: { // The unique ID from the payment gateway (e.g., Razorpay payment_id)
    type: String,
    required: true,
    unique: true, // Ensure payment IDs are unique
    index: true,
  },
  orderId: { // Optional: Order ID from Razorpay if using Orders API
    type: String,
    index: true,
  },
  signature: { // Optional: Signature from Razorpay for verification
    type: String,
  },
  status: { // Payment status confirmed by backend/gateway
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending', // Initially pending until verified
    required: true,
  },
  userPhone: { // Phone number provided during checkout
    type: String,
  },
  paymentDate: { // When the payment was successfully processed/verified
    type: Date,
    default: Date.now,
    required: true,
  },
  // Add any other relevant fields: billing address, etc.

}, { timestamps: true }); // Adds createdAt and updatedAt automatically

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;

// --- END OF FILE models/payment.model.js ---