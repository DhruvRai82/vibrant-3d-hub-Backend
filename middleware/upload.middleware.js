
const multer = require('multer');
const path = require('path');

// Configure disk storage for local development
const diskStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// In-memory storage for cloud deployments
const memoryStorage = multer.memoryStorage();

// Filter function to check file type
const fileFilter = (req, file, cb) => {
  // Accept images and 3D model files
  const allowedImageTypes = /jpeg|jpg|png|gif/;
  const allowed3DTypes = /fbx|obj|max|blend|glb|gltf/;
  const allowedDocTypes = /pdf|doc|docx|xls|xlsx|zip|rar/;
  
  const extname = 
    allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) || 
    allowed3DTypes.test(path.extname(file.originalname).toLowerCase()) ||
    allowedDocTypes.test(path.extname(file.originalname).toLowerCase());
                 
  const mimetype = 
    allowedImageTypes.test(file.mimetype) || 
    file.mimetype === 'application/octet-stream' || // Most 3D files
    file.mimetype.includes('application/') ||
    file.mimetype.includes('image/');
  
  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and 3D model files are allowed.'));
  }
};

// Create upload objects with more flexible options
const diskUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  fileFilter: fileFilter
});

const memoryUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max file size
  fileFilter: fileFilter
});

// Helper function to create field configurations
const createUploadMiddleware = (upload, fieldConfig) => {
  if (Array.isArray(fieldConfig)) {
    return upload.fields(fieldConfig);
  } else if (typeof fieldConfig === 'string') {
    return upload.array(fieldConfig);
  } else {
    return upload.single(fieldConfig);
  }
};

// Create configurable upload middlewares
const createDiskUpload = (fieldConfig) => createUploadMiddleware(diskUpload, fieldConfig);
const createMemoryUpload = (fieldConfig) => createUploadMiddleware(memoryUpload, fieldConfig);

module.exports = {
  diskUpload,
  memoryUpload,
  createDiskUpload,
  createMemoryUpload,
  fileFilter
};
