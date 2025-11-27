// routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// NOTE: We will integrate the image upload (Cloudinary/Multer) in a later step.
// For now, assume the image_url is provided in the request body.
// Import the Cloudinary upload middleware
const { upload } = require('../config/cloudinaryConfig');
// @route   POST /api/reports
// @desc    Create a new waste report
// @access  Public (Reporter/Citizen)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // 1. Check if an image was uploaded successfully
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image file is missing. Please upload proof of the waste.' 
      });
    }

    // 2. Cloudinary saves the file and returns the details in req.file.
    // The public URL is available as req.file.path
    const reportData = {
      reporter_phone: req.body.reporter_phone,
      description: req.body.description,
      location: {
        // NOTE: We must parse the coordinates string back into an array of numbers
        name: req.body.location_name,
        coordinates: JSON.parse(req.body.location_coordinates), 
      },
      image_url: req.file.path, // <--- THIS IS THE CRITICAL LINE!
      status: 'Pending', 
    };
    
    // 3. Save the report to MongoDB
    const newReport = await Report.create(reportData);

    res.status(201).json({ 
      success: true, 
      data: newReport, 
      message: 'Waste report submitted successfully! Image uploaded to Cloudinary.'
    });

  } catch (err) {
    // Handling errors, including Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error: Could not submit report.' });
  }
});
// @route   GET /api/reports
// @desc    Get all reports (Admin Dashboard View)
// @access  Public for MVP, but will be restricted to Admin later
router.get('/', async (req, res) => {
  try {
    // Fetch all reports, sorted by date created (newest first)
    const reports = await Report.find().sort({ date_created: -1 });

    res.status(200).json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error: Could not fetch reports.' });
  }
});

module.exports = router;