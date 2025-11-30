// routes/reportRoutes.js

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
// THIS SHOULD BE THE ONLY LINE DEFINING 'upload'
const { upload } = require('../config/cloudinaryConfig'); 
const { protect } = require('../middleware/authMiddleware'); 

// ... rest of the code ...

// NOTE: We will integrate the image upload (Cloudinary/Multer) in a later step.
// For now, assume the image_url is provided in the request body.
// Import the Cloudinary upload middleware

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


// ... (Existing POST /api/reports and GET /api/reports routes remain the same) ...


// @route   PUT /api/reports/:id
// @desc    Update a report status (Mark as Cleared)
// @access  Private (Admin Only)
// The 'protect' middleware runs first, authenticating the user before the update logic
router.put('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Ensure only status and date_cleared can be updated via this route
    const updateData = {
      status: req.body.status || report.status,
    };
    
    // If the status is being set to 'Cleared', set the cleared date
    if (updateData.status === 'Cleared' && report.status !== 'Cleared') {
        updateData.date_cleared = Date.now();
    }
    
    // Update the document in MongoDB
    const updatedReport = await Report.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData }, 
        { new: true, runValidators: true } // Return the updated document and run schema validators
    );

    res.status(200).json({ 
      success: true, 
      data: updatedReport, 
      message: `Report ID ${req.params.id} status updated to ${updatedReport.status}.`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error during report update.' });
  }
});

module.exports = router;

