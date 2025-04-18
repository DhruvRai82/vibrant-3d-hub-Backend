// --- START OF FILE utils/cloudinaryHelper.js (NEW FILE) ---

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary - Place this ONCE, ideally at app startup or here.
// Ensure environment variables are loaded (e.g., using dotenv)
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("CRITICAL: Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing!");
    // Optionally throw an error or exit if config is essential
    // process.exit(1);
} else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    console.log("Cloudinary configured.");
}


/**
 * Uploads a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The buffer containing the file data.
 * @param {object} options - Cloudinary upload options (e.g., folder, public_id, resource_type).
 * @returns {Promise<object>} - Promise resolving with the Cloudinary upload result.
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Check if configuration is valid before attempting upload
    if (!cloudinary.config().cloud_name) {
        return reject(new Error("Cloudinary is not configured. Check environment variables."));
    }

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        console.error('Cloudinary Upload Error:', error);
        return reject(error);
      }
      // Ensure result is valid before resolving
       if (!result) {
           console.error('Cloudinary upload returned undefined result.');
           return reject(new Error('Cloudinary upload failed to return a result.'));
       }
      resolve(result);
    });

    // Create a readable stream from the buffer and pipe it to Cloudinary
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Export the helper function
module.exports = {
  uploadToCloudinary,
};

// --- END OF FILE utils/cloudinaryHelper.js ---