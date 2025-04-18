
// const express = require('express');
// const router = express.Router();
// const { auth, isAdmin } = require('../middleware/auth.middleware');
// const Request = require('../models/request.model');

// // Get all requests (admin only)
// router.get('/', auth, isAdmin, async (req, res) => {
//   try {
//     console.log('Admin fetching all requests');
//     const requests = await Request.find()
//       .populate('user', 'name email')
//       .populate('fulfillmentModel')
//       .sort({ createdAt: -1 });
    
//     console.log(`Found ${requests.length} requests`);
//     res.json(requests);
//   } catch (error) {
//     console.error('Error fetching all requests:', error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get user's requests
// router.get('/user', auth, async (req, res) => {
//   try {
//     console.log(`Fetching requests for user: ${req.user._id}`);
//     const requests = await Request.find({ user: req.user._id })
//       .populate('fulfillmentModel')
//       .sort({ createdAt: -1 });
    
//     console.log(`Found ${requests.length} requests for user ${req.user._id}`);
//     res.json(requests);
//   } catch (error) {
//     console.error(`Error fetching user requests for ${req.user._id}:`, error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get requests with fulfilled models (for user's "received" page)
// router.get('/received', auth, async (req, res) => {
//   try {
//     console.log(`Fetching received models for user: ${req.user._id}`);
//     const requests = await Request.find({ 
//       user: req.user._id,
//       fulfillmentModel: { $exists: true, $ne: null }
//     })
//     .populate('fulfillmentModel')
//     .sort({ updatedAt: -1 });
    
//     console.log(`Found ${requests.length} received models for user ${req.user._id}`);
//     res.json(requests);
//   } catch (error) {
//     console.error(`Error fetching received models for ${req.user._id}:`, error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Get specific request
// router.get('/:id', auth, async (req, res) => {
//   try {
//     console.log(`Fetching request with ID: ${req.params.id}`);
//     const request = await Request.findById(req.params.id)
//       .populate('user', 'name email')
//       .populate('fulfillmentModel')
//       .populate('assignedTo', 'name email');
    
//     if (!request) {
//       console.log(`Request not found with ID: ${req.params.id}`);
//       return res.status(404).json({ message: 'Request not found' });
//     }
    
//     // Check if user is authorized (owner or admin)
//     if (request.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//       console.log(`Access denied for user ${req.user._id} to request ${req.params.id}`);
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
//     console.log(`Successfully fetched request: ${req.params.id}`);
//     res.json(request);
//   } catch (error) {
//     console.error(`Error fetching request ${req.params.id}:`, error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Create new request
// router.post('/', auth, async (req, res) => {
//   try {
//     console.log('Creating new request with data:', req.body);
    
//     // Validate required fields
//     if (!req.body.title || !req.body.description || !req.body.type) {
//       console.error('Missing required fields:', {
//         title: req.body.title,
//         description: req.body.description,
//         type: req.body.type
//       });
//       return res.status(400).json({ 
//         message: 'Request validation failed: title, description, and type are required fields' 
//       });
//     }
    
//     // Create a new request object
//     const request = new Request({
//       user: req.user._id,
//       title: req.body.title,
//       description: req.body.description,
//       type: req.body.type,
//       requirements: req.body.requirements,
//       budget: req.body.budget,
//       deadline: req.body.deadline,
//       notes: req.body.notes
//     });
    
//     // Handle attachments if they exist
//     if (req.files && req.files.length > 0) {
//       request.attachments = req.files.map(file => file.path);
//     }
    
//     // Save the request
//     await request.save();
//     console.log('Request created successfully with ID:', request._id);
    
//     res.status(201).json(request);
//   } catch (error) {
//     console.error('Error creating request:', error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Update request
// router.put('/:id', auth, async (req, res) => {
//   try {
//     console.log(`Updating request ${req.params.id} with data:`, req.body);
    
//     const request = await Request.findById(req.params.id);
    
//     if (!request) {
//       console.log(`Request not found with ID: ${req.params.id}`);
//       return res.status(404).json({ message: 'Request not found' });
//     }
    
//     // Check if user is authorized (owner or admin)
//     if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//       console.log(`Access denied for user ${req.user._id} to update request ${req.params.id}`);
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
//     // Only allow updates if status is pending
//     if (request.status !== 'pending' && req.user.role !== 'admin') {
//       console.log(`Cannot update request ${req.params.id} with status ${request.status}`);
//       return res.status(400).json({ message: 'Cannot update request that is not in pending status' });
//     }
    
//     // Update fields
//     const fieldsToUpdate = ['title', 'description', 'type', 'requirements', 'budget', 'deadline', 'notes'];
//     fieldsToUpdate.forEach(field => {
//       if (req.body[field] !== undefined) {
//         request[field] = req.body[field];
//       }
//     });
    
//     // Save the updated request
//     await request.save();
//     console.log(`Request ${req.params.id} updated successfully`);
    
//     res.json(request);
//   } catch (error) {
//     console.error(`Error updating request ${req.params.id}:`, error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Update request status (admin only)
// router.put('/:id/status', auth, isAdmin, async (req, res) => {
//   try {
//     console.log(`Updating status for request ${req.params.id} with data:`, req.body);
    
//     const { status, notes, fulfillmentModelId } = req.body;
    
//     const request = await Request.findById(req.params.id);
    
//     if (!request) {
//       console.log(`Request not found with ID: ${req.params.id}`);
//       return res.status(404).json({ message: 'Request not found' });
//     }
    
//     // Update status
//     request.status = status;
    
//     // Update notes if provided
//     if (notes) {
//       request.notes = notes;
//     }
    
//     // If fulfillment model ID is provided
//     if (fulfillmentModelId) {
//       request.fulfillmentModel = fulfillmentModelId;
//     }
    
//     // If completing the request, set completedAt date
//     if (status === 'completed') {
//       request.completedAt = new Date();
//     }
    
//     // Save the updated request
//     await request.save();
//     console.log(`Status for request ${req.params.id} updated to ${status}`);
    
//     res.json(request);
//   } catch (error) {
//     console.error(`Error updating status for request ${req.params.id}:`, error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Delete request
// router.delete('/:id', auth, async (req, res) => {
//   try {
//     console.log(`Deleting request ${req.params.id}`);
    
//     const request = await Request.findById(req.params.id);
    
//     if (!request) {
//       console.log(`Request not found with ID: ${req.params.id}`);
//       return res.status(404).json({ message: 'Request not found' });
//     }
    
//     // Check if user is authorized (owner or admin)
//     if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//       console.log(`Access denied for user ${req.user._id} to delete request ${req.params.id}`);
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
//     // Only allow deletion if status is pending
//     if (request.status !== 'pending' && req.user.role !== 'admin') {
//       console.log(`Cannot delete request ${req.params.id} with status ${request.status}`);
//       return res.status(400).json({ message: 'Cannot delete request that is not in pending status' });
//     }
    
//     await Request.findByIdAndDelete(req.params.id);
//     console.log(`Request ${req.params.id} deleted successfully`);
    
//     res.json({ message: 'Request deleted successfully' });
//   } catch (error) {
//     console.error(`Error deleting request ${req.params.id}:`, error);
//     res.status(500).json({ message: error.message });
//   }
// });

// // Mark request as paid with payment details
// router.put('/:id/mark-paid', auth, async (req, res) => {
//   try {
//     console.log('Mark as paid request received:', {
//       requestId: req.params.id,
//       paymentDetails: req.body
//     });
    
//     const { paymentId, phone, amount } = req.body;
    
//     if (!req.params.id) {
//       return res.status(400).json({ message: 'Request ID is required' });
//     }
    
//     const request = await Request.findById(req.params.id);
    
//     if (!request) {
//       console.log('Request not found with ID:', req.params.id);
//       return res.status(404).json({ message: 'Request not found' });
//     }
    
//     // Ensure only the owner or admin can mark as paid
//     if (request.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//       console.log('Access denied for user:', req.user._id);
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
//     // Check if there's a fulfillment model
//     if (!request.fulfillmentModel) {
//       console.log('No model attached to request:', req.params.id);
//       return res.status(400).json({ message: 'No model attached to this request' });
//     }
    
//     // Mark as paid and store payment details
//     request.isPaid = true;
//     if (paymentId) request.paymentId = paymentId;
//     if (phone) request.paymentPhone = phone;
//     if (amount) request.paymentAmount = amount;
//     request.paymentDate = new Date();
    
//     await request.save();
//     console.log('Request successfully marked as paid:', req.params.id);
    
//     res.json({ message: 'Request marked as paid', request });
//   } catch (error) {
//     console.error('Error marking request as paid:', error);
//     res.status(500).json({ message: error.message });
//   }
// });
// module.exports = router;

//=================================================================================================================
// This is the updated request.routes.js file with multer integration for file uploads.
// It includes detailed comments and logging for better debugging and understanding of the flow.
//================================================================================================================= 
const express = require('express');
const router = express.Router();
const multer = require('multer'); // <-- Import Multer
const { auth, isAdmin } = require('../middleware/auth.middleware'); // Adjust path if needed
const Request = require('../models/request.model'); // Adjust path if needed
const RequestedModel = require('../models/RequestedModels.model'); // <-- Import new model
const cloudinary = require('cloudinary').v2; // <-- Example: Assuming Cloudinary for uploads
 const { uploadToCloudinary } = require('../utils/cloudinaryHelper'); // <-- Example: Cloudinary upload helper
 
// --- Multer Configuration ---
// Using memoryStorage: files accessible via req.files[fieldname][index].buffer
// Ideal for uploading directly to cloud storage (S3, Cloudinary) without saving locally first.
const storage = multer.memoryStorage();
// --- Multer Configuration for Fulfillment ---
// Use memoryStorage to handle files as buffers for direct upload to cloud
const fulfillmentStorage = multer.memoryStorage();
const fulfillUpload = multer({
    storage: fulfillmentStorage,
    limits: { fileSize: 100 * 1024 * 1024 } // Example: 100MB limit
    // Add fileFilter if needed:
    // fileFilter: (req, file, cb) => { ... check mime types ... }
});

// If you prefer to save files temporarily to disk first:
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/') // Ensure './uploads/' directory exists in your backend root
//   },
//   filename: function (req, file, cb) {
//     // Create a unique filename
//     cb(null, `${Date.now()}-${file.originalname}`)
//   }
// });

const upload = multer({
  storage: storage, // Use the chosen storage strategy
  limits: { fileSize: 10 * 1024 * 1024 } // Example: Limit file size to 10MB
});
// --- End Multer Configuration ---


// Get all requests (admin only) - No changes needed
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    console.log('Admin fetching all requests');
    const requests = await Request.find()
      .populate('user', 'name email')
      .populate('fulfillmentModel')
      .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} requests`);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching all requests:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's requests - No changes needed
router.get('/user', auth, async (req, res) => {
  try {
    console.log(`Fetching requests for user: ${req.user._id}`); // Assuming auth middleware adds user to req
    const requests = await Request.find({ user: req.user._id })
      .populate('fulfillmentModel')
      .sort({ createdAt: -1 });

    console.log(`Found ${requests.length} requests for user ${req.user._id}`);
    res.json(requests);
  } catch (error) {
    console.error(`Error fetching user requests for ${req.user._id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get requests with fulfilled models (for user's "received" page) - No changes needed
router.get('/received', auth, async (req, res) => {
  try {
    console.log(`Fetching received models for user: ${req.user._id}`);
    const requests = await Request.find({
      user: req.user._id,
      fulfillmentModel: { $exists: true, $ne: null }
    })
    .populate('fulfillmentModel')
    .sort({ updatedAt: -1 });

    console.log(`Found ${requests.length} received models for user ${req.user._id}`);
    res.json(requests);
  } catch (error) {
    console.error(`Error fetching received models for ${req.user._id}:`, error);
    res.status(500).json({ message: error.message });
  }
});

// Get specific request - No changes needed
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`Fetching request with ID: ${req.params.id}`);
    const request = await Request.findById(req.params.id)
      .populate('user', 'name email')
      .populate('fulfillmentModel')
      .populate('assignedTo', 'name email');

    if (!request) {
      console.log(`Request not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Request not found' });
    }

    // Check if user is authorized (owner or admin)
    // Ensure req.user.role exists if you use it
    const isAdminUser = req.user.role === 'admin';
    if (request.user._id.toString() !== req.user._id.toString() && !isAdminUser) {
      console.log(`Access denied for user ${req.user._id} to request ${req.params.id}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log(`Successfully fetched request: ${req.params.id}`);
    res.json(request);
  } catch (error) {
    console.error(`Error fetching request ${req.params.id}:`, error);
     if (error.kind === 'ObjectId') { // Handle invalid ID format
         return res.status(400).json({ message: 'Invalid Request ID format' });
     }
    res.status(500).json({ message: error.message });
  }
});

// --- CREATE NEW REQUEST ---
// Apply multer middleware here!
router.post(
  '/',
  auth, // 1. Authenticate user
  upload.fields([{ name: 'attachments', maxCount: 5 }]), // 2. Use multer to parse form-data and files
  async (req, res) => { // 3. Proceed to handler
    try {
      // Multer has populated req.body (text fields) and req.files (file info)
      console.log('Creating new request - req.body:', req.body);
      console.log('Creating new request - req.files:', req.files); // Check this log output!

      // Extract text fields from req.body
      const { title, description, type, requirements, budget, deadline, notes } = req.body;
      const userId = req.user._id; // Get user ID from auth middleware

      // **Validation is now more reliable as req.body should be populated**
      if (!title || !description || !type) {
        console.error('Missing required fields after multer parsing:', { title, description, type });
        // If this still fails, the frontend might not be sending the fields correctly,
        // or there's an issue earlier in the middleware chain.
        return res.status(400).json({
          message: 'Request validation failed: title, description, and type are required fields'
        });
      }

      // --- Handle Attachments (Example) ---
      let attachmentUrls = [];
      if (req.files && req.files.attachments && req.files.attachments.length > 0) {
         console.log(`Processing ${req.files.attachments.length} files...`);
         // **IMPORTANT**: Replace this with your actual file upload logic
         // (e.g., upload to S3/Cloudinary using the buffer/path from req.files).
         // This example simulates getting URLs.
         for (const file of req.files.attachments) {
            // If using memoryStorage: use file.buffer
            // If using diskStorage: use file.path
            // Example simulation:
            const simulatedUrl = `https://your-storage.com/uploads/${Date.now()}-${file.originalname}`;
            attachmentUrls.push(simulatedUrl);
            console.log(`Simulated upload of ${file.originalname} to ${simulatedUrl}`);
            // In a real scenario:
            // try {
            //    const uploadResult = await uploadToCloudStorage(file.buffer or file.path, file.originalname);
            //    attachmentUrls.push(uploadResult.url);
            // } catch (uploadError) {
            //    console.error("File upload failed:", uploadError);
            //    // Handle upload error appropriately
            //    return res.status(500).json({ message: `Failed to upload attachment: ${file.originalname}` });
            // }
         }
      }
      // --- End Attachment Handling ---

      // Create a new request object with parsed data
      const newRequestData = {
        user: userId,
        title,
        description,
        type,
        requirements: requirements || '',
        // Convert budget from string to number if provided
        budget: budget ? Number(budget) : undefined,
        // Convert deadline string to Date if provided
        deadline: deadline ? new Date(deadline) : undefined,
        notes: notes || '',
        attachments: attachmentUrls // Store the processed URLs/paths
      };

      const request = new Request(newRequestData);

      // Save the request (Mongoose validation happens here)
      await request.save();
      console.log('Request created successfully with ID:', request._id);

      res.status(201).json(request);

    } catch (error) {
      console.error('Error creating request:', error);
      if (error.name === 'ValidationError') {
          return res.status(400).json({ message: `Request validation failed: ${error.message}` });
      }
      res.status(500).json({ message: 'Server error while creating request', error: error.message });
    }
  }
);
// --- END CREATE NEW REQUEST ---


// Update request - Apply multer if file updates are allowed
// Assuming updates might involve files:
router.put(
    '/:id',
    auth,
    upload.fields([{ name: 'attachments', maxCount: 5 }]), // Apply multer if updating files
    async (req, res) => {
        try {
            console.log(`Updating request ${req.params.id} - req.body:`, req.body);
            console.log(`Updating request ${req.params.id} - req.files:`, req.files); // Check if files are part of update

            const request = await Request.findById(req.params.id);

            if (!request) {
                console.log(`Update failed: Request not found with ID: ${req.params.id}`);
                return res.status(404).json({ message: 'Request not found' });
            }

            const isAdminUser = req.user.role === 'admin';
            if (request.user.toString() !== req.user._id.toString() && !isAdminUser) {
                console.log(`Access denied for user ${req.user._id} to update request ${req.params.id}`);
                return res.status(403).json({ message: 'Access denied' });
            }

            if (request.status !== 'pending' && !isAdminUser) {
                console.log(`Cannot update request ${req.params.id} with status ${request.status}`);
                return res.status(400).json({ message: 'Cannot update request that is not in pending status' });
            }

            // Update text fields from req.body
            const fieldsToUpdate = ['title', 'description', 'type', 'requirements', 'budget', 'deadline', 'notes'];
            fieldsToUpdate.forEach(field => {
                if (req.body[field] !== undefined) {
                    // Handle type conversion if necessary (e.g., budget, deadline)
                    if (field === 'budget') {
                        request[field] = req.body[field] === null || req.body[field] === '' ? undefined : Number(req.body[field]);
                    } else if (field === 'deadline') {
                        request[field] = req.body[field] === null || req.body[field] === '' ? undefined : new Date(req.body[field]);
                    } else {
                        request[field] = req.body[field];
                    }
                }
            });

            // --- Handle File Updates (Example: Replace attachments) ---
             if (req.files && req.files.attachments && req.files.attachments.length > 0) {
                 console.log(`Updating attachments for request ${req.params.id}...`);
                 // **IMPORTANT**: Add logic here.
                 // Should you delete old attachments from storage?
                 // Should you append new ones or replace the array?
                 // This example replaces the array with newly uploaded file URLs.
                 let newAttachmentUrls = [];
                 // Delete old files from storage here if needed...
                 for (const file of req.files.attachments) {
                     // Replace with your actual upload logic
                     const simulatedUrl = `https://your-storage.com/uploads/${Date.now()}-${file.originalname}`;
                     newAttachmentUrls.push(simulatedUrl);
                     console.log(`Simulated update upload of ${file.originalname} to ${simulatedUrl}`);
                 }
                 request.attachments = newAttachmentUrls; // Replace existing attachments
             }
            // --- End File Update Handling ---


            // Save the updated request (triggers 'pre save' for updatedAt)
            await request.save();
            console.log(`Request ${req.params.id} updated successfully`);

            res.json(request);
        } catch (error) {
            console.error(`Error updating request ${req.params.id}:`, error);
             if (error.name === 'ValidationError') {
                 return res.status(400).json({ message: `Update validation failed: ${error.message}` });
             }
            res.status(500).json({ message: 'Server error updating request', error: error.message });
        }
    }
);


// Update request status (admin only) - No changes needed
router.put('/:id/status', auth, isAdmin, async (req, res) => {
  try {
    console.log(`Updating status for request ${req.params.id} with data:`, req.body);

    const { status, notes, fulfillmentModelId } = req.body; // Assuming status comes in body

    // Validate status enum value
    const validStatuses = ['pending', 'approved', 'rejected', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status value: ${status}` });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      console.log(`Status update failed: Request not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;

    if (notes !== undefined) { // Allow clearing notes
      request.notes = notes;
    }

    if (fulfillmentModelId !== undefined) { // Allow setting or clearing model ID
      request.fulfillmentModel = fulfillmentModelId || null; // Use null if empty string/undefined
    }

    // Consider adding completedAt logic if status changes to 'completed'

    await request.save(); // Triggers 'pre save' hook
    console.log(`Status for request ${req.params.id} updated to ${status}`);

    res.json(request);
  } catch (error) {
    console.error(`Error updating status for request ${req.params.id}:`, error);
     if (error.name === 'ValidationError') {
         return res.status(400).json({ message: `Status update validation failed: ${error.message}` });
     }
    res.status(500).json({ message: 'Server error updating request status', error: error.message });
  }
});

// Delete request - No changes needed
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log(`Deleting request ${req.params.id}`);

    const request = await Request.findById(req.params.id);

    if (!request) {
      console.log(`Deletion failed: Request not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Request not found' });
    }

    const isAdminUser = req.user.role === 'admin';
    if (request.user.toString() !== req.user._id.toString() && !isAdminUser) {
      console.log(`Access denied for user ${req.user._id} to delete request ${req.params.id}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    if (request.status !== 'pending' && !isAdminUser) {
      console.log(`Cannot delete request ${req.params.id} with status ${request.status}`);
      return res.status(400).json({ message: 'Cannot delete request that is not in pending status' });
    }

    // **Optional but Recommended**: Delete associated files from storage here

    // Use deleteOne instead of findByIdAndDelete if you have the document already
    await request.deleteOne();
    console.log(`Request ${req.params.id} deleted successfully`);

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error(`Error deleting request ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error deleting request', error: error.message });
  }
});

// Mark request as paid with payment details - No changes needed
router.get('/payments', auth, isAdmin, async (req, res) => {
  try {
    console.log('Mark as paid request received:', {
      requestId: req.params.id,
      paymentDetails: req.body
    });

    const { paymentId, phone, amount } = req.body;

    if (!req.params.id) {
      return res.status(400).json({ message: 'Request ID is required' });
    }

    const request = await Request.findById(req.params.id);

    if (!request) {
      console.log('Mark as paid failed: Request not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Request not found' });
    }

    const isAdminUser = req.user.role === 'admin';
    if (request.user.toString() !== req.user._id.toString() && !isAdminUser) {
      console.log('Access denied for user to mark as paid:', req.user._id);
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!request.fulfillmentModel) {
      console.log('Mark as paid failed: No model attached to request:', req.params.id);
      return res.status(400).json({ message: 'No model attached to this request' });
    }

    // Mark as paid and store payment details
    request.isPaid = true;
    if (paymentId) request.paymentId = paymentId;
    if (phone) request.paymentPhone = phone;
    if (amount) request.paymentAmount = Number(amount); // Ensure amount is number
    request.paymentDate = new Date();

    await request.save(); // Triggers 'pre save' hook
    console.log('Request successfully marked as paid:', req.params.id);

    res.json({ message: 'Request marked as paid', request });
  } catch (error) {
    console.error('Error marking request as paid:', error);
     if (error.name === 'ValidationError') {
         return res.status(400).json({ message: `Payment update validation failed: ${error.message}` });
     }
    res.status(500).json({ message: 'Server error marking request as paid', error: error.message });
  }
});


// --- ADD NEW ROUTE: Fulfill a Request ---
router.post(
  '/:id/fulfill', // Use request ID in the path
  auth,             // User must be logged in
  isAdmin,          // Only admins can fulfill
  // Use multer configured for fulfillment file fields
  fulfillUpload.fields([
      { name: 'modelFile', maxCount: 1 },
      { name: 'thumbnailFile', maxCount: 1 }
  ]),
  async (req, res) => {
      const requestId = req.params.id;
      const adminUserId = req.user.id; // Admin performing the action

      console.log(`Fulfillment attempt for request: ${requestId} by admin: ${adminUserId}`);
      console.log('Received body:', req.body);
      console.log('Received files:', req.files);

      // Extract data from request body (text fields from FormData)
      const { title, description, pricePaid } = req.body;

      // Basic validation
      if (!title || !pricePaid) {
          return res.status(400).json({ message: 'Missing required fields: title, pricePaid.' });
      }
      if (!req.files || !req.files.modelFile || !req.files.thumbnailFile) {
          return res.status(400).json({ message: 'Missing required files: modelFile, thumbnailFile.' });
      }

      const modelFile = req.files.modelFile[0];
      const thumbnailFile = req.files.thumbnailFile[0];

      try {
          // 1. Find the original request
          const originalRequest = await Request.findById(requestId).populate('user', '_id'); // Get user ID
          if (!originalRequest) {
              return res.status(404).json({ message: 'Original request not found.' });
          }
          if (originalRequest.status !== 'completed') {
               // Optionally allow fulfillment even if not explicitly marked completed first?
               // Or enforce that status must be completed? Let's allow for now.
               console.warn(`Fulfilling request ${requestId} which is not in 'completed' status (Status: ${originalRequest.status})`);
          }
           if (originalRequest.fulfillmentModel) {
               return res.status(400).json({ message: 'This request has already been fulfilled.' });
           }


          const requestingUserId = typeof originalRequest.user === 'object' ? originalRequest.user._id : originalRequest.user;
          if (!requestingUserId) {
              return res.status(404).json({ message: 'Requesting user not found for the request.' });
          }

          // 2. Upload files to cloud storage (Example: Cloudinary)
          console.log("Uploading model file to cloud...");
          const modelUploadResult = await uploadToCloudinary(modelFile.buffer, {
              resource_type: "raw", // Use 'raw' for non-image/video files like .zip, .obj
              folder: `fulfilled_models/${requestingUserId}`, // Organize uploads
              public_id: `${requestId}_${Date.now()}` // Unique name
              // Add other Cloudinary options as needed
          });
           console.log("Uploading thumbnail file to cloud...");
           const thumbnailUploadResult = await uploadToCloudinary(thumbnailFile.buffer, {
               resource_type: "image",
               folder: `fulfilled_thumbnails/${requestingUserId}`,
               public_id: `${requestId}_thumb_${Date.now()}`
           });

          if (!modelUploadResult?.secure_url || !thumbnailUploadResult?.secure_url) {
              throw new Error("Cloudinary upload failed for one or both files.");
          }

          // 3. Create the new RequestedModel document
          const newFulfilledModel = new RequestedModel({
              user: requestingUserId,
              originalRequest: requestId,
              title: title,
              description: description || `Fulfilled model for request ${requestId}`,
              fileUrl: modelUploadResult.secure_url,
              thumbnailUrl: thumbnailUploadResult.secure_url,
              fileSize: (modelFile.size / (1024 * 1024)).toFixed(2) + 'MB', // Example size calculation
              format: modelFile.originalname.split('.').pop(), // Example format extraction
              pricePaid: parseFloat(pricePaid),
              // status: 'delivered', // Add status if needed
          });
          await newFulfilledModel.save();
          console.log("Saved new RequestedModel document:", newFulfilledModel._id);

          // 4. Update the original Request document
          originalRequest.status = 'completed'; // Ensure it's marked completed
          originalRequest.fulfillmentModel = newFulfilledModel._id; // Link to the new document ID
          originalRequest.notes = `${originalRequest.notes || ''}\n\nFulfilled with RequestedModel ID: ${newFulfilledModel._id}`.trim();
          await originalRequest.save();
          console.log("Updated original Request document:", requestId);

          res.status(201).json({
              message: 'Request fulfilled successfully!',
              fulfilledModel: newFulfilledModel,
              updatedRequest: originalRequest // Optionally return updated request too
          });

      } catch (error) {
          console.error(`Error fulfilling request ${requestId}:`, error);
          // TODO: Add cleanup logic for cloud uploads if DB save fails
          res.status(500).json({ message: 'Server error fulfilling request.', error: error.message });
      }
  }
);

// --- ADD NEW ROUTE: Get Fulfilled Models for Logged-in User ---
router.get('/fulfilled-models/user', auth, async (req, res) => {
  const userId = req.user.id;
  console.log(`Fetching fulfilled models for user: ${userId}`);
  try {
      // Find models specifically created for this user
      const fulfilledModels = await RequestedModel.find({ user: userId })
                                      .sort({ createdAt: -1 }); // Sort newest first

      console.log(`Found ${fulfilledModels.length} fulfilled models for user ${userId}.`);
      res.json(fulfilledModels);

  } catch (error) {
      console.error(`Error fetching fulfilled models for user ${userId}:`, error);
      res.status(500).json({ message: 'Server error fetching your fulfilled models.' });
  }
});








module.exports = router;