// --- START OF FILE routes/payment.routes.js (NEW FILE) ---

const express = require('express');
const router = express.Router();
const Payment = require('../models/payment.model');
const Request = require('../models/request.model'); // Needed to potentially update request status
const { auth, isAdmin } = require('../middleware/auth.middleware'); // Your auth middleware
const { verifyRazorpaySignature } = require('../utils/paymentVerification'); // Assume you have this utility

// --- Endpoint to RECORD a new payment (called from frontend after Razorpay success) ---
router.post('/', auth, async (req, res) => {
  const {
    modelId,
    amount,
    currency = 'INR',
    paymentId, // Razorpay Payment ID
    orderId,   // Razorpay Order ID (optional but recommended)
    signature, // Razorpay Signature (optional but recommended for verification)
    userPhone,
    relatedRequestId, // Optional: ID of the fulfilled request
  } = req.body;

  const userId = req.user.id; // From auth middleware

  // ** crucial backend validation **
  if (!modelId || !amount || !paymentId || !orderId || !signature) { // Require orderId and signature now
    return res.status(400).json({ message: 'Missing required payment details for verification (modelId, amount, paymentId, orderId, signature)' });
  }

  try {
    // *** UNCOMMENT and USE the verification ***
    const isValidSignature = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isValidSignature) {
        console.warn("Invalid Razorpay signature detected for payment:", paymentId);
        // Return an error - do not record the payment
        return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }
    console.log("Razorpay signature verified successfully for payment:", paymentId);
    // --- Verification passed, proceed to record ---


    const existingPayment = await Payment.findOne({ paymentId: paymentId });
    if (existingPayment) {
      // ... (rest of existing payment logic) ...
      console.log("Payment already recorded:", paymentId);
      return res.status(200).json({ message: 'Payment already recorded', payment: existingPayment });
    }

    const newPayment = new Payment({
      user: userId,
      model: modelId,
      relatedRequest: relatedRequestId || null,
      amount: parseFloat(amount),
      currency,
      paymentGateway: 'razorpay',
      paymentId,
      orderId,
      signature, // Store signature if needed
      status: 'completed', // Mark as completed since signature is verified
      userPhone,
      paymentDate: new Date(),
    });

    await newPayment.save();
    console.log("New payment recorded:", newPayment._id);

    // ... (rest of request update logic) ...
     if (relatedRequestId) {
      const request = await Request.findById(relatedRequestId);
      if (request && !request.isPaid) {
        request.isPaid = true;
        request.paymentId = paymentId;
        request.paymentPhone = userPhone;
        request.paymentAmount = parseFloat(amount);
        request.paymentDate = newPayment.paymentDate;
        await request.save();
        console.log("Linked Request updated as paid:", relatedRequestId);
      }
    }


    res.status(201).json({ message: 'Payment recorded successfully', payment: newPayment });

  } catch (error) {
    // ... (keep error handling) ...
    console.error("Error recording payment:", error);
    res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
});


// --- Endpoint to GET payment history (Admin only) ---
router.get('/', auth, isAdmin, async (req, res) => {
  console.log("Admin fetching payment history from Payments collection");
  try {
    const payments = await Payment.find({}) // Add filters/pagination later if needed
      .populate('user', 'name email _id') // Populate user name/email
      .populate('model', 'title price _id') // Populate model title/price
      .populate('relatedRequest', 'title _id') // Populate related request title (optional)
      .sort({ paymentDate: -1 }); // Sort by date

    console.log(`Found ${payments.length} payment records.`);
    res.json(payments); // Send the payment records

  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ message: 'Server error fetching payment history' });
  }
});

module.exports = router;

// --- END OF FILE routes/payment.routes.js ---