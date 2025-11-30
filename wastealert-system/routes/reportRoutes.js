// routes/reportRoutes.js (Updated with missing GET and enhanced PUT for proof)

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Truck = require('../models/Truck');
// THIS SHOULD BE THE ONLY LINE DEFINING 'upload'
const { upload } = require('../config/cloudinaryConfig'); 
// FIX: Import both protect (for Admin) and protectDriver (for Driver)
const { protect, protectDriver } = require('../middleware/authMiddleware');

// @route   POST /api/reports
// @desc    Create a new waste report
// @access  Public (Reporter/Citizen)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image file is missing. Please upload proof of the waste.' 
      });
    }

    const reportData = {
      reporter_phone: req.body.reporter_phone,
      description: req.body.description,
      location: {
        name: req.body.location_name,
        // Assume coordinates are sent as a JSON string, must be parsed
        coordinates: JSON.parse(req.body.location_coordinates), 
      },
      image_url: req.file.path, 
      status: 'Pending', 
    };
    
    const newReport = await Report.create(reportData);

    res.status(201).json({ 
      success: true, 
      data: newReport, 
      message: 'Waste report submitted successfully!'
    });

  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error: Could not submit report.' });
  }
});

// routes/reportRoutes.js (Add this route)

// @route   PUT /api/reports/status/:id
// @desc    Update a report status by the assigned driver (Assigned -> In Progress -> Cleared)
// @access  Private (Driver Only)
router.put('/status/:id', protectDriver, async (req, res) => {
    const { status } = req.body;
    const reportId = req.params.id;

    try {
        const report = await Report.findById(reportId);
        
        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }
        
        // 1. Get the driver's truck ID to verify assignment
        const driverTruck = await Truck.findOne({ driver_id: req.user.id });
        
        if (!driverTruck || !report.assigned_truck_id.equals(driverTruck._id)) {
            return res.status(403).json({ success: false, error: 'Not authorized to update this report status.' });
        }

        // 2. Simple status progression validation
        const validTransitions = {
            'Assigned': 'In Progress',
            'In Progress': 'Cleared'
        };

        if (validTransitions[report.status] !== status) {
            return res.status(400).json({ success: false, error: `Invalid status transition from ${report.status} to ${status}.` });
        }

        // 3. Update the report
        const updateData = { status };
        if (status === 'Cleared') {
            updateData.date_cleared = Date.now();
        }

        const updatedReport = await Report.findByIdAndUpdate(
            reportId, 
            { $set: updateData }, 
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: updatedReport });

    } catch (err) {
        console.error("Error updating report status:", err);
        res.status(500).json({ success: false, error: 'Server error updating report status.' });
    }
});

// routes/reportRoutes.js (Add this new route)

// @route   GET /api/reports/assigned
// @desc    Get reports specifically assigned to the authenticated driver
// @access  Private (Driver Only)
router.get('/assigned', protectDriver, async (req, res) => {
    try {
        // req.user.id is set by the protectDriver middleware
        const driverId = req.user.id; 
        
        // Find reports that are assigned to this driver and are not yet cleared
        const reports = await Report.find({
            driver_id: driverId,
            // Show reports in these relevant statuses for the driver
            status: { $in: ['Assigned', 'In Progress', 'Unload'] } 
        }).sort({ date_reported: -1 }); // Sort by newest reports first

        res.status(200).json({ 
            success: true, 
            count: reports.length, 
            data: reports 
        });

    } catch (err) {
        console.error("Error fetching driver assigned reports:", err);
        res.status(500).json({ success: false, error: 'Server error fetching assigned reports.' });
    }
});

// ... (rest of reportRoutes.js)
// @route   GET /api/reports
// @desc    Get all reports (FIX: Added this missing route for Admin Dashboard)
// @access  Private (Admin Only)
router.get('/', protect, async (req, res) => {
    try {
        // Populate the assigned_to field to get driver details in one call
        const reports = await Report.find().sort({ date_created: -1 });
        res.status(200).json({ success: true, count: reports.length, data: reports });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching reports.' });
    }
});


// @route   PUT /api/reports/:id
// @desc    Update a report status (Admin assignment, Admin clearance, Driver proof submission)
// @access  Private (Admin or Driver, via separate middleware)
router.put('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const updateData = {};
    
    // Check if status is being updated (Admin or Driver logic)
    if (req.body.status) {
        updateData.status = req.body.status;
    }
    
    // Check for Assignment updates (Admin logic only, as this route uses protect which is Admin)
    if (req.body.assigned_to) {
        updateData.assigned_to = req.body.assigned_to;
        updateData.date_assigned = req.body.date_assigned || Date.now();
    }
    
    // Check for Proof submission updates (Driver logic, also used for admin rejection/reset)
    if (req.body.proof_notes !== undefined) {
        updateData.proof_notes = req.body.proof_notes;
    }
    if (req.body.proof_image_url !== undefined) {
        updateData.proof_image_url = req.body.proof_image_url;
    }

    // If the status is being set to 'Cleared', set the cleared date
    if (updateData.status === 'Cleared' && report.status !== 'Cleared') {
        updateData.date_cleared = Date.now();
    }
    
    // Update the document in MongoDB
    const updatedReport = await Report.findByIdAndUpdate(
        req.params.id, 
        { $set: updateData }, 
        { new: true, runValidators: true } 
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