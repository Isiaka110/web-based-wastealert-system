// config/cloudinaryConfig.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary using credentials from the .env file
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create the Cloudinary storage engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wastealert_reports', // All uploaded images will be stored in this folder on Cloudinary
    allowed_formats: ['jpeg', 'png', 'jpg'],
    // Transformation: { width: 500, height: 500, crop: "limit" } // Optional: Resize images to save bandwidth
  },
});

// Create the Multer upload middleware
const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload
};