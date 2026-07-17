import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import env from '../config/env.js';
import logger from '../utils/logger.js';

// Setup memory storage to hold file buffer without writing to local disk
const storage = multer.memoryStorage();

// Accept image files only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

/**
 * Middleware that takes the file uploaded by Multer, uploads it to Cloudinary,
 * and attaches the resulting secure URL to req.cloudinaryUrl.
 */
export const uploadToCloudinary = (req, res, next) => {
  // If no file was sent in the request, proceed (e.g. edit text parameters only)
  if (!req.file) {
    return next();
  }

  // Handle local dev environment when Cloudinary keys are mocked / placeholder
  const isMocked =
    env.CLOUDINARY_CLOUD_NAME === 'mock_cloud' ||
    env.CLOUDINARY_CLOUD_NAME === 'driply_cloud' ||
    env.CLOUDINARY_API_KEY === '123456789012345';

  if (isMocked) {
    logger.info('[Upload Middleware] Cloudinary is in mock mode. Attaching fallback image.');
    // Set a stylish Unsplash placeholder image of clothing
    req.cloudinaryUrl = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=600&auto=format&fit=crop';
    req.cloudinaryId = 'mock_cloudinary_public_id';
    return next();
  }

  // Stream image buffer to Cloudinary API
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: 'driply/wardrobe',
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    },
    (error, result) => {
      if (error) {
        logger.error(error, 'Cloudinary upload stream failed');
        return next(new Error('Failed to upload image to Cloudinary storage'));
      }
      req.cloudinaryUrl = result.secure_url;
      req.cloudinaryId = result.public_id;
      next();
    }
  );

  uploadStream.end(req.file.buffer);
};

export default upload;
