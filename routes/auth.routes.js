// --- START OF FILE auth.routes.js ---


const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <-- Add bcryptjs
const User = require('../models/user.model');
const OTP = require('../models/otp.model');
const { sendOTPEmail } = require('../utils/email'); // Adjust path if needed
const { auth } = require('../middleware/auth.middleware'); // <-- Add auth middleware import (adjust path if needed)
const router = express.Router();
const crypto = require('crypto');
const { sendEmail } = require('../utils/email'); // Adjust path if needed
const { sendVerificationEmail } = require('../utils/email'); // Adjust path if needed
// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    // Hashing is handled by the pre-save hook in user.model.js (assumed)
    const user = new User({
      name,
      email,
      password,
      verified: false
    });

    await user.save();

    // Generate OTP for email verification
    const otp = generateOTP();
    const newOTP = new OTP({
      email,
      otp,
      purpose: 'email_verification'
    });
    await newOTP.save();

    // Send verification email
    await sendOTPEmail(email, otp, 'email_verification');

    // Create and return JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, verified: user.verified },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        verified: user.verified,
        createdAt: user.createdAt // Include createdAt
      },
      message: 'Registration successful. Please verify your email.'
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user, include password field for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password using the method from user.model.js
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create and return JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, verified: user.verified },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Exclude password from the returned user object
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: { // Ensure structure matches frontend type
        id: userResponse._id,
        name: userResponse.name,
        email: userResponse.email,
        role: userResponse.role,
        avatar: userResponse.avatar,
        verified: userResponse.verified,
        createdAt: userResponse.createdAt
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Verify email with OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find the OTP record
    const otpRecord = await OTP.findOne({
      email,
      otp,
      purpose: 'email_verification'
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update user to verified
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.verified = true;
    await user.save();

    // Delete the OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Create and return new JWT with verified status
    const token = jwt.sign(
      { id: user._id, role: user.role, verified: user.verified },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        verified: user.verified,
        createdAt: user.createdAt
      },
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error("Verify email error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Resend verification OTP
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    await OTP.deleteMany({ email, purpose: 'email_verification' });

    const otp = generateOTP();
    const newOTP = new OTP({ email, otp, purpose: 'email_verification' });
    await newOTP.save();
    await sendOTPEmail(email, otp, 'email_verification');

    res.json({ message: 'Verification OTP sent successfully' });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If your email exists, you will receive a reset OTP' });
    }

    await OTP.deleteMany({ email, purpose: 'password_reset' });

    const otp = generateOTP();
    const newOTP = new OTP({ email, otp, purpose: 'password_reset' });
    await newOTP.save();
    await sendOTPEmail(email, otp, 'password_reset');

    res.json({ message: 'Password reset OTP sent successfully' });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP for password reset
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({
      email,
      otp,
      purpose: 'password_reset'
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Maybe delete OTP here or leave it until password is actually reset?
    // For now, just verify validity.
    res.json({
      message: 'OTP verified successfully',
      valid: true
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Reset password with OTP
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // Verify OTP again (important security step)
    const otpRecord = await OTP.findOne({
      email,
      otp,
      purpose: 'password_reset'
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP. Please request a new one.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password; // Let pre-save hook hash it
    await user.save();

    // Delete the used OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: error.message });
  }
});


// --- ADD THIS ROUTE HANDLER ---
// Change password for logged-in user
router.put('/change-password', auth, async (req, res) => { // Use PUT, apply auth middleware
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Get user ID from auth middleware

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new passwords are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
     if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'New password must be different from the current password' });
    }

    // Find user and select the password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Should not happen if auth middleware works
    }

    // Compare current password
    const isMatch = await user.comparePassword(currentPassword); // Use the model method
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Set the new password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: 'Server error updating password' });
  }
});

router.get('/payments', auth,  async (req, res) => {
  console.log("Admin fetching payment history");
  try {
      // Find requests that are completed, paid, and have a fulfillment model
      const paidRequests = await Request.find({
          status: 'completed',
          isPaid: true,
          fulfillmentModel: { $exists: true, $ne: null }
      })
      .populate('user', 'name email _id') // Populate user details
      .populate('fulfillmentModel', 'title price _id') // Populate relevant model details
      .sort({ paymentDate: -1 }); // Sort by payment date descending

      console.log(`Found ${paidRequests.length} paid requests.`);

      // Optionally, map to a specific payment structure if needed,
      // but frontend can also do this. Returning requests is fine.
      res.json(paidRequests);

  } catch (error) {
      console.error("Error fetching payment history:", error);
      res.status(500).json({ message: 'Server error fetching payment history' });
  }
});


// --- END ADD THIS ROUTE HANDLER ---


module.exports = router;

// --- END OF FILE auth.routes.js ---