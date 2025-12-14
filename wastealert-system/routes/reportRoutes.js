// routes/reportRoutes.js (FIXED ROUTE ORDER)

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Truck = require('../models/Truck'); // Needed for assignment/availability logic
const { upload } = require('../config/cloudinaryConfig'); 
const { protect, protectDriver } = require('../middleware/authMiddleware');

// Define the phone number regex for server-side validation
const PHONE_REGEX = /^\+234\d{10}$/; 

// =================================================================
// 1. CREATE REPORT (POST /api/reports)
// =================================================================
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { 
        reporter_phone, 
        description, 
        state_area,
        lga_city,
        location_name,
        location_coordinates // JSON string from client
    } = req.body;
    
    // 1. File Upload Check (Mandatory)
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'Image file is missing. Please upload proof of the waste.' 
      });
    }

    // 2. Data Validation
    if (!state_area || !lga_city || !location_name || !description || !reporter_phone || !location_coordinates) {
        return res.status(400).json({ 
            success: false, 
            error: 'All location and description fields are required.' 
        });
    }

    if (!PHONE_REGEX.test(reporter_phone)) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid phone number format. Must start with +234 and have 10 digits after.' 
        });
    }

    const reportData = {
        reporter_phone: reporter_phone,
        description: description,
        location: {
            state_area: state_area,
            lga_city: lga_city,
            location_name: location_name,
            coordinates: JSON.parse(location_coordinates), // Must be parsed
        },
        image_url: req.file.path, 
        status: 'Pending', 
    };
    
    const newReport = await Report.create(reportData);

    res.status(201).json({
      success: true,
      data: newReport,
      message: 'Report submitted successfully. Cleanup team has been alerted.'
    });

  } catch (err) {
    console.error("Report submission error:", err);
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ success: false, error: errors.join(', ') });
    }
    res.status(500).json({ success: false, error: 'Server error during report submission.' });
  }
});


// =================================================================
// 2. GET ALL REPORTS (GET /api/reports)
// =================================================================

// @route   GET /api/reports
// @desc    Get all reports (Admin only)
// @access  Private (Admin Only)
router.get('/', protect, async (req, res) => {
    try {
        const reports = await Report.find({})
            .sort({ date_reported: -1 })
            .populate('assigned_to', 'license_plate driver_id'); // Populate truck license plate
        
        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (err) {
        console.error("All reports GET error:", err);
        res.status(500).json({ success: false, error: 'Server error fetching all reports.' });
    }
});


// =================================================================
// 3. GET ASSIGNED REPORTS (GET /api/reports/assigned) - For Driver Dashboard
// =================================================================

// @route   GET /api/reports/assigned
// @desc    Get reports assigned to the currently authenticated driver
// @access  Private (Driver Only)
router.get('/assigned', protectDriver, async (req, res) => {
    try {
        // req.driver.truck is set by the protectDriver middleware
        const reports = await Report.find({ assigned_to: req.driver.truck })
            .sort({ date_reported: -1 });

        res.status(200).json({
            success: true,
            data: reports
        });
    } catch (err) {
        console.error("Assigned reports GET error:", err);
        res.status(500).json({ success: false, error: 'Server error fetching assigned reports.' });
    }
});


// =================================================================
// 4. GET AVAILABLE TRUCKS (GET /api/reports/availabletrucks) <--- MOVED UP (FIX)
// =================================================================

// @route   GET /api/reports/availabletrucks
// @desc    Get all approved and unassigned trucks for assignment (Admin only)
// @access  Private (Admin Only)
router.get('/availabletrucks', protect, async (req, res) => {
    try {
        // Find trucks that are approved and not currently assigned
        // Assumes Truck model has 'is_approved: true' and 'is_assigned: false'
        const availableTrucks = await Truck.find({
            is_approved: true, 
            is_assigned: false 
        }).select('license_plate _id capacity_tons'); 

        res.status(200).json({
            success: true,
            data: availableTrucks
        });
    } catch (err) {
        console.error("Available trucks GET error:", err);
        res.status(500).json({ success: false, error: 'Server error fetching available trucks.' });
    }
});


// =================================================================
// 5. GET SINGLE REPORT (GET /api/reports/:id) <--- MOVED DOWN (FIX)
// =================================================================

// @route   GET /api/reports/:id
// @desc    Get a single report by ID
// @access  Private (Admin or Driver)
router.get('/:id', protect, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate('assigned_to', 'license_plate driver_id'); 

        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (err) {
        console.error("Single report GET error:", err);
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ success: false, error: 'Invalid ID format' });
        }
        res.status(500).json({ success: false, error: 'Server error fetching report.' });
    }
});


// =================================================================
// 6. UPDATE REPORT (PUT /api/reports/:id)
// =================================================================

// @route   PUT /api/reports/:id
// @desc    Update a report (Admin or Driver)
// @access  Private (Admin or Driver)
router.put('/:id', protect, async (req, res) => {
    try {
        let report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }

        const updateData = {};
        
        // Status is being updated (Admin or Driver logic)
        if (req.body.status) {
            updateData.status = req.body.status;
        }
        
        // Check for Assignment updates (Admin logic only, as this route uses protect which is Admin)
        if (req.body.assigned_to) {
            // Unassign the previously assigned truck (if any)
            if (report.assigned_to) {
                await Truck.findByIdAndUpdate(report.assigned_to, { is_assigned: false });
            }
            
            // Assign the new truck
            updateData.assigned_to = req.body.assigned_to;
            updateData.date_assigned = req.body.date_assigned || Date.now();
            
            // Mark the newly assigned truck as busy
            await Truck.findByIdAndUpdate(req.body.assigned_to, { is_assigned: true });

        } else if (req.body.unassign) {
            // Logic to unassign the truck and reset status to 'Pending'
            if (report.assigned_to) {
                await Truck.findByIdAndUpdate(report.assigned_to, { is_assigned: false });
                updateData.assigned_to = null;
                updateData.date_assigned = null;
                updateData.status = 'Pending';
            }
        }
        
        // Check for Proof submission updates (Driver logic, also used for admin rejection/reset)
        if (req.body.proof_notes !== undefined) {
            updateData.proof_notes = req.body.proof_notes;
        }
        if (req.body.proof_image_url !== undefined) {
            updateData.proof_image_url = req.body.proof_image_url;
            updateData.proof_submitted_at = Date.now();
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
        ).populate('assigned_to', 'license_plate'); // Repopulate the report with truck info

        res.status(200).json({ 
          success: true, 
          data: updatedReport,
          message: 'Report updated successfully.'
        });

    } catch (err) {
        console.error("Report update error:", err);
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ success: false, error: 'Invalid ID format' });
        }
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: errors.join(', ') });
        }
        res.status(500).json({ success: false, error: 'Server error during report update' });
    }
});


// =================================================================
// 7. DELETE REPORT (DELETE /api/reports/:id)
// =================================================================

// @route   DELETE /api/reports/:id
// @desc    Delete a report (Admin only)
// @access  Private (Admin Only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const report = await Report.findByIdAndDelete(req.params.id);

        if (!report) {
            return res.status(404).json({ success: false, error: 'Report not found' });
        }
        
        // CRITICAL FIX: If the report was assigned, unassign the truck to make it available
        if (report.assigned_to) {
            await Truck.findByIdAndUpdate(report.assigned_to, { is_assigned: false });
        }

        res.status(200).json({ 
            success: true, 
            data: {}, 
            message: 'Report successfully deleted.' 
        });
    } catch (err) {
        console.error("Report delete error:", err);
        res.status(500).json({ success: false, error: 'Server error during report deletion.' });
    }
});


module.exports = router;