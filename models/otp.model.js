
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['password_reset', 'email_verification'],
    default: 'password_reset'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // OTP expires after 1 hour
  }
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
