
const express = require('express');
const User = require('../models/user.model');
const Model = require('../models/model.model');
const { auth, isAdmin } = require('../middleware/auth.middleware');
const router = express.Router();

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    
    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    
    await user.save();
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      verified: user.verified
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user bookmarks
router.get('/bookmarks', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user has no bookmarks
    if (!user.bookmarks || user.bookmarks.length === 0) {
      return res.json([]);
    }
    
    // Get bookmarked models
    const bookmarkedModels = await Model.find({
      _id: { $in: user.bookmarks },
      status: 'published'
    });
    
    res.json(bookmarkedModels);
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user purchases
router.get('/purchases', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user has no purchases field or no purchases
    if (!user.purchases || user.purchases.length === 0) {
      return res.json([]);
    }
    
    // Get purchased models
    const purchasedModels = await Model.find({
      _id: { $in: user.purchases },
      status: 'published'
    });
    
    res.json(purchasedModels);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all users
router.get('/', [auth, isAdmin], async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update user role
router.put('/:id/role', [auth, isAdmin], async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.role = role;
    await user.save();
    
    res.json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
