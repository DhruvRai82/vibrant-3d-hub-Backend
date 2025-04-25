const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const Model = require('../models/model.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const { auth, isAdmin } = require('../middleware/auth.middleware');
const { memoryUpload } = require('../middleware/upload.middleware');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const streamifier = require('streamifier'); // Helper for buffer uploads


// Helper function for Cloudinary upload (ensure this exists or use SDK directly)
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
      // Add config check here if not done globally
      if (!cloudinary.config().cloud_name) {
          return reject(new Error("Cloudinary not configured."));
      }
      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      if (!result) return reject(new Error("Cloudinary returned no result."));
      resolve(result);
      });
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
// Use the upload middleware with proper field configuration
const upload = memoryUpload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'modelFiles', maxCount: 1 }
]);


// Get all models (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { category, featured, status, search } = req.query;
    
    // Build query based on filters
    const query = {};
    
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;
    if (status) query.status = status;
    
    // Add search functionality if search term provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Only show published models to regular users
    if (!req.user || req.user.role !== 'admin') {
      query.status = 'published';
    }
    
    const models = await Model.find(query).sort({ created: -1 });
    
    res.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get featured models
router.get('/featured', async (req, res) => {
  try {
    const featuredModels = await Model.find({ featured: true, status: 'published' })
      .limit(6)
      .sort({ created: -1 });
    res.json(featuredModels);
  } catch (error) {
    console.error('Error fetching featured models:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get model categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Model.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get models by category
router.get('/category/:category', async (req, res) => {
  try {
    const models = await Model.find({ 
      category: req.params.category,
      status: 'published'
    }).sort({ created: -1 });
    res.json(models);
  } catch (error) {
    console.error('Error fetching models by category:', error);
    res.status(500).json({ message: error.message });
  }
});

// Download model file
router.get('/:id/download', async (req, res) => {
  try {
    const model = await Model.findById(req.params.id).select('+modelFileUrl'); // Select the new field

    
    if (!model || !model.modelFileUrl) { // Check if model or URL exists
      return res.status(404).json({ message: 'Model not found' });
    }
    
    // For paid models, check if user has purchased (not implemented here)
    if (model.price !== '0') {
      // In a real app, verify purchase here
      // For demo purposes, we allow download without verification
    }
    console.log(`Redirecting download for ${req.params.id} to Cloudinary URL: ${model.modelFileUrl}`);
    res.redirect(302, model.modelFileUrl); // 302 Found redirect

    // In a real implementation, you would have a model file stored
    // For demo purposes, we'll send back a sample file
    const sampleFilePath = path.join(__dirname, '../demo-model.glb');
    
    if (fs.existsSync(sampleFilePath)) {
      return res.download(sampleFilePath, `${model.title}.glb`);
    }
    
    // If the sample file doesn't exist, return a mock response
    res.type('model/gltf-binary');
    res.send(Buffer.from('Demo model file content'));
  } catch (error) {
    console.error('Error downloading model:', error);
    res.status(500).json({ message: error.message });
  }

  
});

// Access model file for 3D viewer (likely streaming)
router.get('/:id/file', async (req, res) => {
  try {
    const model = await Model.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    // In a real implementation, you would stream the model file
    // For demo purposes, we'll send a placeholder file
    const sampleFilePath = path.join(__dirname, '../demo-model.glb');
    
    if (fs.existsSync(sampleFilePath)) {
      const stat = fs.statSync(sampleFilePath);
      res.writeHead(200, {
        'Content-Type': 'model/gltf-binary',
        'Content-Length': stat.size
      });
      const readStream = fs.createReadStream(sampleFilePath);
      readStream.pipe(res);
      return;
    }
    
    res.status(404).json({ message: 'Model file not found' });
  } catch (error) {
    console.error('Error streaming model file:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a single model by ID
router.get('/:id', async (req, res) => {
  try {
    const model = await Model.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    // Increment views
    model.views += 1;
    await model.save();
    
    // Get related models
    const relatedModels = await Model.find({
      category: model.category,
      _id: { $ne: model._id },
      status: 'published'
    }).limit(3).select('id title category thumbnail');
    
    // Get comments
    const comments = await Comment.find({ model: model._id })
      .populate('user', 'name avatar')
      .sort({ date: -1 });
    
    res.json({
      ...model.toObject(),
      comments,
      relatedModels
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({ message: error.message });
  }
});



// Create a new model (admin only)
router.post('/', [auth, isAdmin], (req, res) => {
  upload(req, res, async function(err) {
    // Handle file upload errors
    
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('Unknown upload error:', err);
      return res.status(400).json({ message: err.message });
    }
    
    try {
      console.log("Request Body:", req.body);
      console.log("Request Files:", req.files); // Log to see what multer provides

      // Check required files
      if (!req.files || !req.files.thumbnail || req.files.thumbnail.length === 0) {
          return res.status(400).json({ message: 'Thumbnail file is required.' });
      }
      // *** CHECK FOR MODEL FILE ***
      if (!req.files.modelFiles || req.files.modelFiles.length === 0) {
          return res.status(400).json({ message: '3D Model file (modelFiles field) is required.' });
      }
      // Process the request after successful file upload
      const {
        title, description, longDescription, category, price,
        featured, status, fileSize, format, version, software,
        tags, features
      } = req.body;
      
      // Check if there are any files uploaded
      if (!req.files) {
        return res.status(400).json({ message: 'At least one image is required' });
      }
      
      // Upload images to Cloudinary
      const uploadedImages = [];
      let thumbnail = '';
      
      // Upload thumbnail if exists
      if (req.files.thumbnail && req.files.thumbnail.length > 0) {
        const thumbnailFile = req.files.thumbnail[0];
        const base64Thumbnail = `data:${thumbnailFile.mimetype};base64,${thumbnailFile.buffer.toString('base64')}`;
        console.log("Uploading thumbnail...");

        const thumbnailResult = await uploadToCloudinary(thumbnailFile.buffer, {
          folder: `immersive-homes/models/${category}/thumbnails`, // Example folder structure
          resource_type: 'image'
       });
        thumbnail = thumbnailResult.secure_url;
        uploadedImages.push(thumbnail);
        console.log("Thumbnail uploaded:", thumbnailUrl);

      }
      
      // Upload additional images if exist
      if (req.files.images && req.files.images.length > 0) {
        for (const file of req.files.images) {
          const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
          
          const result = await cloudinary.uploader.upload(base64Image, {
            folder: 'immersive-homes/models'
          });
          
          uploadedImages.push(result.secure_url);
        }
      }
      const uploadedImageUrls = [thumbnailUrl]; // Start with thumbnail
      if (req.files.images && req.files.images.length > 0) {
          console.log(`Uploading ${req.files.images.length} additional images...`);
          for (const file of req.files.images) {
              const imageResult = await uploadToCloudinary(file.buffer, {
                  folder: `immersive-homes/models/${category}/images`,
                  resource_type: 'image'
              });
              uploadedImageUrls.push(imageResult.secure_url);
          }
          console.log("Additional images uploaded:", uploadedImageUrls.slice(1));
      }

        // --- *** UPLOAD THE 3D MODEL FILE *** ---
        const modelFile = req.files.modelFiles[0];
        console.log("Uploading 3D model file:", modelFile.originalname);
        const modelFileResult = await uploadToCloudinary(modelFile.buffer, {
            folder: `immersive-homes/models/${category}/files`, // Separate folder for model files
            resource_type: 'raw', // IMPORTANT: Use 'raw' for non-image/video like GLB/ZIP etc.
            public_id: `${title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}` // Create a unique name
        });
        const modelFileUrl = modelFileResult.secure_url; // Get the URL
        console.log("3D Model file uploaded:", modelFileUrl);
        // --- *** END 3D FILE UPLOAD *** ---
      // If thumbnail not specifically uploaded, use first image
      if (!thumbnail && uploadedImages.length > 0) {
        thumbnail = uploadedImages[0];
      } else if (!thumbnail) {
        return res.status(400).json({ message: 'At least one image is required' });
      }
      
      // Process tags and features
      const processedTags = tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : [];
      const processedFeatures = features ? (typeof features === 'string' ? features.split(',').map(feature => feature.trim()) : features) : [];
      
      // Create new model
      const model = new Model({
        title, description, longDescription, category, price,
        featured: featured === 'true' || featured === true, status,
        // Get format/size from uploaded file or body? Prioritize file.
        fileSize: fileSize || (modelFile.size / (1024*1024)).toFixed(2) + 'MB',
        format: format || path.extname(modelFile.originalname).toLowerCase(),
        version: version || '1.0', // Default version?
        software: software || 'Unknown', // Default software?
        thumbnail: thumbnailUrl, // From upload
        images: uploadedImageUrls, // From uploads
        modelFileUrl: modelFileUrl, // *** STORE THE UPLOADED MODEL URL ***
        creator: {
          name: req.user.name,
          role: 'Lead Architect',
          avatar: req.user.avatar,
          bio: 'Expert architect with years of experience',
          user: req.user._id
        },
        tags: processedTags,
        features: processedFeatures
      });
      
      await model.save();
      console.log("Model saved to DB:", newModel._id);
      res.status(201).json(newModel); // Return the created model

      res.status(201).json(model);
    } catch (error) {
      console.error('Error creating model:', error);
      res.status(500).json({ message: error.message });
    }
  });
});

// Update a model (admin only)
router.put('/:id', [auth, isAdmin], (req, res) => {
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      console.error('Unknown upload error:', err);
      return res.status(400).json({ message: err.message });
    }
    
    try {
      const model = await Model.findById(req.params.id);
      
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      
      // Update fields from request body
      const {
        title, description, longDescription, category, price,
        featured, status, fileSize, format, version, software,
        tags, features, existingImages
      } = req.body;
      
      // Update basic fields if provided
      if (title) model.title = title;
      if (description) model.description = description;
      if (longDescription) model.longDescription = longDescription;
      if (category) model.category = category;
      if (price) model.price = price;
      if (featured !== undefined) model.featured = featured === 'true' || featured === true;
      if (status) model.status = status;
      if (fileSize) model.fileSize = fileSize;
      if (format) model.format = format;
      if (version) model.version = version;
      if (software) model.software = software;
      
      // Process tags and features
      if (tags) {
        model.tags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
      }
      
      if (features) {
        model.features = typeof features === 'string' ? features.split(',').map(feature => feature.trim()) : features;
      }
      
      // Handle image updates
      if (req.files) {
        // Process new images
        if (req.files.images && req.files.images.length > 0) {
          const newImages = [];
          
          for (const file of req.files.images) {
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            
            const result = await cloudinary.uploader.upload(base64Image, {
              folder: 'immersive-homes/models'
            });
            
            newImages.push(result.secure_url);
          }
          
          // Combine with existing images if provided
          if (existingImages) {
            try {
              const parsedExistingImages = JSON.parse(existingImages);
              model.images = [...parsedExistingImages, ...newImages];
            } catch (e) {
              model.images = [...model.images, ...newImages];
            }
          } else {
            model.images = [...model.images, ...newImages];
          }
        }
        
        // Process new thumbnail
        if (req.files.thumbnail && req.files.thumbnail.length > 0) {
          const thumbnailFile = req.files.thumbnail[0];
          const base64Thumbnail = `data:${thumbnailFile.mimetype};base64,${thumbnailFile.buffer.toString('base64')}`;
          
          const thumbnailResult = await cloudinary.uploader.upload(base64Thumbnail, {
            folder: 'immersive-homes/models'
          });
          
          model.thumbnail = thumbnailResult.secure_url;
        }
      }
      
      await model.save();
      
      res.json(model);
    } catch (error) {
      console.error('Error updating model:', error);
      res.status(500).json({ message: error.message });
    }
  });
});

// Delete a model (admin only)
router.delete('/:id', [auth, isAdmin], async (req, res) => {
  try {
    const modelId = req.params.id;
    
    if (!modelId || modelId === 'undefined') {
      return res.status(400).json({ message: 'Valid model ID is required' });
    }
    
    console.log(`Attempting to delete model with ID: ${modelId}`);
    
    const model = await Model.findById(modelId);
    
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    // Delete model images from Cloudinary - skip if there's an error but continue with model deletion
    if (model.images && model.images.length > 0) {
      for (const imageUrl of model.images) {
        try {
          if (imageUrl && typeof imageUrl === 'string') {
            // Extract public ID from the URL - assuming URL has format like cloudinary.com/v1234/folder/public_id
            const urlParts = imageUrl.split('/');
            const publicId = urlParts[urlParts.length - 1].split('.')[0];
            const folder = urlParts[urlParts.length - 2];
            const fullPublicId = `${folder}/${publicId}`;
            
            await cloudinary.uploader.destroy(fullPublicId);
          }
        } catch (error) {
          console.error('Error deleting image from Cloudinary:', error);
          // Continue with the loop - don't stop the deletion process
        }
      }
    }
    
    // Delete model and associated comments
    await Comment.deleteMany({ model: model._id });
    await Model.findByIdAndDelete(model._id);
    
    res.json({ message: 'Model deleted successfully' });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ message: error.message });
  }
});

// Track downloads
router.post('/:id/track-download', async (req, res) => {
  try {
    const model = await Model.findById(req.params.id);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    model.downloads = (model.downloads || 0) + 1;
    await model.save();
    
    res.json({ success: true, downloads: model.downloads });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add a comment to a model
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const model = await Model.findById(req.params.id);
    
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    const { text } = req.body;
    
    const comment = new Comment({
      model: model._id,
      user: req.user._id,
      text
    });
    
    await comment.save();
    
    // Populate user details for response
    await comment.populate('user', 'name avatar');
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: error.message });
  }
});

// Like/favorite a model
router.post('/:id/like', auth, async (req, res) => {
  try {
    const model = await Model.findById(req.params.id);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    model.likes = (model.likes || 0) + 1;
    await model.save();
    
    res.json({ success: true, likes: model.likes });
  } catch (error) {
    console.error('Error liking model:', error);
    res.status(500).json({ message: error.message });
  }
});

// Bookmark a model
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const modelId = req.params.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const model = await Model.findById(modelId);
    if (!model) {
      return res.status(404).json({ message: 'Model not found' });
    }
    
    // Check if user already has bookmarks field
    if (!user.bookmarks) {
      user.bookmarks = [];
    }
    
    // Check if the model is already bookmarked
    const bookmarkIndex = user.bookmarks.indexOf(modelId);
    let added = false;
    
    if (bookmarkIndex === -1) {
      // Add bookmark
      user.bookmarks.push(modelId);
      added = true;
    } else {
      // Remove bookmark
      user.bookmarks.splice(bookmarkIndex, 1);
      added = false;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      added,
      message: added ? 'Model bookmarked' : 'Bookmark removed' 
    });
  } catch (error) {
    console.error('Error bookmarking model:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
