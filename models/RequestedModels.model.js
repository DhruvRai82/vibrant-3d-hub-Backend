// --- START OF FILE models/RequestedModels.model.js (NEW FILE) ---

const mongoose = require('mongoose');

const requestedModelSchema = new mongoose.Schema({
  user: { // The user who made the original request
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  originalRequest: { // Link back to the request document
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
    index: true,
  },
  title: { // Title for this specific fulfilled model
    type: String,
    required: [true, 'Fulfilled model title is required.'],
    trim: true,
  },
  description: { // Description for this fulfilled model
    type: String,
    trim: true,
  },
  fileUrl: { // URL of the uploaded model file (e.g., from Cloudinary/S3)
    type: String,
    required: [true, 'Model file URL is required.'],
  },
  thumbnailUrl: { // URL of the uploaded thumbnail (e.g., from Cloudinary/S3)
    type: String,
    required: [true, 'Thumbnail URL is required.'],
  },
  fileSize: { // Optional: Size of the model file
    type: String,
  },
  format: { // Optional: Format of the model file
    type: String,
  },
  pricePaid: { // The actual amount paid by the user for this fulfillment
    type: Number,
    required: true,
    default: 0,
  },
  // Add any other fields specific to fulfilled models if needed
}, {
  timestamps: true // Adds createdAt and updatedAt
});

const RequestedModel = mongoose.model('RequestedModel', requestedModelSchema);

module.exports = RequestedModel;

// --- END OF FILE models/RequestedModels.model.js ---