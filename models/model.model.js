
const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  longDescription: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft'
  },
  created: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  downloads: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  fileSize: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  software: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  images: [String],
  modelFileUrl: {
    type: String,
    required: [true, 'Model file URL is required.'] // Make it required
  },
  creator: {
    name: String,
    role: String,
    avatar: String,
    bio: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  tags: [String],
  features: [String]
});

const Model = mongoose.model('Model', modelSchema);

module.exports = Model;
