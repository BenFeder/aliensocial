const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
// Check if running in serverless/production environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

let storage;

if (isServerless && process.env.CLOUDINARY_URL) {
  // Use Cloudinary in serverless/production
  console.log('Using Cloudinary storage for uploads');
  
  // Cloudinary URL format: cloudinary://api_key:api_secret@cloud_name
  // It's automatically parsed by cloudinary.config()
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      let folder = 'aliensocial/';
      
      if (file.fieldname === 'avatar') {
        folder += 'avatars';
      } else if (file.fieldname === 'image') {
        folder += 'posts/images';
      } else if (file.fieldname === 'video') {
        folder += 'posts/videos';
      }
      
      return {
        folder: folder,
        resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
        allowed_formats: file.mimetype.startsWith('video/') ? ['mp4', 'mov', 'avi', 'wmv'] : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        transformation: file.fieldname === 'avatar' ? [{ width: 400, height: 400, crop: 'fill' }] : undefined
      };
    }
  });
} else {
  // Use local disk storage for development
  console.log('Using local disk storage for uploads');
  
  storage = multer.diskStorage({
    destination: function(req, file, cb) {
      if (file.fieldname === 'avatar') {
        cb(null, 'uploads/avatars/');
      } else if (file.fieldname === 'image') {
        cb(null, 'uploads/posts/images/');
      } else if (file.fieldname === 'video') {
        cb(null, 'uploads/posts/videos/');
      }
    },
    filename: function(req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// File filter
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'avatar' || file.fieldname === 'image') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for images!'), false);
    }
  } else if (file.fieldname === 'video') {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for videos!'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

module.exports = upload;
