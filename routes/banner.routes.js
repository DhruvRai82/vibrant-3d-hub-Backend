
const express = require('express');
const Banner = require('../models/banner.model');
const { auth, isAdmin } = require('../middleware/auth.middleware');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get all active banners (public)
router.get('/active', async (req, res) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ order: 1 });
    console.log(`Returning ${banners.length} active banners`);
    res.json(banners);
  } catch (error) {
    console.error('Error getting active banners:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all banners (admin only)
router.get('/', [auth, isAdmin], async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single banner by ID
router.get('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a banner (admin only)
router.post('/', [auth, isAdmin, upload.single('image')], async (req, res) => {
  try {
    // Check if image is provided
    if (!req.file && !req.body.imageUrl) {
      return res.status(400).json({ message: 'Banner image is required' });
    }

    let imageUrl = req.body.imageUrl;

    // Upload image to cloudinary if file is provided
    if (req.file) {
      // Convert buffer to base64
      const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Upload to cloudinary
      const result = await cloudinary.uploader.upload(base64String, {
        folder: 'banners',
        resource_type: 'image'
      });
      
      imageUrl = result.secure_url;
    }

    // Count existing banners for order
    const count = await Banner.countDocuments();
    
    // Create banner
    const banner = new Banner({
      title: req.body.title,
      subtitle: req.body.subtitle,
      description: req.body.description,
      image: imageUrl,
      ctaText: req.body.ctaText,
      ctaLink: req.body.ctaLink,
      active: req.body.active === 'true' || req.body.active === true,
      order: count // Default to the end of the list
    });
    
    await banner.save();
    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a banner (admin only)
router.put('/:id', [auth, isAdmin, upload.single('image')], async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    // Update image if provided
    if (req.file) {
      // Convert buffer to base64
      const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Upload to cloudinary
      const result = await cloudinary.uploader.upload(base64String, {
        folder: 'banners',
        resource_type: 'image'
      });
      
      banner.image = result.secure_url;
    } else if (req.body.imageUrl) {
      banner.image = req.body.imageUrl;
    }

    // Update other fields
    if (req.body.title) banner.title = req.body.title;
    if (req.body.subtitle !== undefined) banner.subtitle = req.body.subtitle;
    if (req.body.description !== undefined) banner.description = req.body.description;
    if (req.body.ctaText !== undefined) banner.ctaText = req.body.ctaText;
    if (req.body.ctaLink !== undefined) banner.ctaLink = req.body.ctaLink;
    if (req.body.active !== undefined) banner.active = req.body.active === 'true' || req.body.active === true;
    if (req.body.order !== undefined) banner.order = req.body.order;

    await banner.save();
    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a banner (admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update banner order (admin only)
router.put('/reorder', [auth, isAdmin], async (req, res) => {
  try {
    const { bannerIds } = req.body;
    
    if (!Array.isArray(bannerIds)) {
      return res.status(400).json({ message: 'Banner IDs must be an array' });
    }
    
    console.log('Reordering banners with IDs:', bannerIds);
    
    // Update each banner's order
    for (let i = 0; i < bannerIds.length; i++) {
      const updatedBanner = await Banner.findByIdAndUpdate(
        bannerIds[i], 
        { order: i },
        { new: true }
      );
      console.log(`Updated banner ${bannerIds[i]} to order ${i}: ${updatedBanner ? 'success' : 'failed'}`);
    }
    
    const updatedBanners = await Banner.find().sort({ order: 1 });
    console.log('New banner order:', updatedBanners.map(b => ({ id: b._id, title: b.title, order: b.order })));
    
    res.json({ message: 'Banner order updated successfully' });
  } catch (error) {
    console.error('Error reordering banners:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
