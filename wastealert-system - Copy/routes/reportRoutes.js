const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Truck = require('../models/Truck');
const { upload } = require('../config/cloudinaryConfig'); 
const { protect, protectDriver } = require('../middleware/authMiddleware');

// =================================================================
// 1. DRIVER SPECIFIC ROUTES
// =================================================================

/**
 * @route   GET /api/reports/driver/assigned
 * @desc    Fetch tasks for the currently logged-in driver
 */
router.get('/driver/assigned', protectDriver, async (req, res) => {
    try {
        if (!req.truck) {
            return res.status(200).json({ success: true, data: [] });
        }

        const reports = await Report.find({ 
            assigned_to: req.truck._id,
            status: { $ne: 'Cleared' } 
        }).sort({ date_reported: -1 });

        res.status(200).json({ success: true, data: reports });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error fetching assigned tasks.' });
    }
});

/**
 * @route   PATCH /api/reports/:id/status
 * @desc    Update report status (e.g., 'In Progress')
 */
router.patch('/:id/status', protectDriver, async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        );
        res.json({ success: true, data: report });
    } catch (err) {
        res.status(400).json({ success: false, error: 'Status update failed.' });
    }
});

/**
 * @route   POST /api/reports/:id/clear
 * @desc    Clear disposal and free the truck
 */
router.post('/:id/clear', protectDriver, async (req, res) => {
    try {
        const { clearance_notes } = req.body;
        
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ error: 'Report not found' });

        report.status = 'Cleared';
        report.date_cleared = Date.now();
        report.clearance_notes = clearance_notes;
        await report.save();

        if (report.assigned_to) {
            await Truck.findByIdAndUpdate(report.assigned_to, { is_assigned: false });
        }

        res.json({ success: true, message: 'Disposal cleared successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Clearance failed' });
    }
});

// =================================================================
// 2. STANDARD CRUD ROUTES
// =================================================================

// reportRoutes.js (POST section)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // 1. Destructure only text fields
    const { reporter_phone, description, state_area, lga_city, location_name } = req.body;
    
    if (!req.file) return res.status(400).json({ success: false, error: 'Image required.' });

    // 2. Build the object without coordinates
    const reportData = {
        reporter_phone,
        description,
        location: { 
            state_area, 
            lga_city, 
            location_name 
        },
        image_url: req.file.path, 
        status: 'Pending', 
    };

    const newReport = await Report.create(reportData);
    res.status(201).json({ success: true, data: newReport });
  } catch (err) {
    console.error("Submission Error:", err); // Log actual error to your terminal
    res.status(500).json({ success: false, error: 'Submission failed: ' + err.message });
  }
});

// ... rest of routes ...

router.get('/', protect, async (req, res) => {
    try {
        const reports = await Report.find({}).sort({ date_reported: -1 }).populate('assigned_to', 'license_plate');
        res.json({ success: true, data: reports });
    } catch (err) { res.status(500).json({ error: 'Fetch failed.' }); }
});

/**
 * @route   PUT /api/reports/:id/assign
 * @desc    Assign a verified truck to a report
 */
router.put('/:id/assign', protect, async (req, res) => {
    try {
        const { truck_id } = req.body;
        const reportId = req.params.id;

        // 1. Validate Truck existence and availability
        const truck = await Truck.findById(truck_id);
        if (!truck) {
            return res.status(404).json({ success: false, error: 'Fleet unit not found.' });
        }
        if (truck.is_assigned) {
            return res.status(400).json({ success: false, error: 'This unit is already on another task.' });
        }

        // 2. Update the Report
        const report = await Report.findByIdAndUpdate(
            reportId,
            { 
                assigned_to: truck_id,
                status: 'In Progress' // Must match the 'active' tab filter in app.js
            },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({ success: false, error: 'Waste report not found.' });
        }

        // 3. Mark the Truck as busy
        truck.is_assigned = true;
        await truck.save();

        res.status(200).json({ 
            success: true, 
            message: 'Fleet unit deployed successfully!', 
            data: report 
        });
    } catch (err) {
        console.error("Assignment Error:", err);
        res.status(500).json({ success: false, error: 'Database error during deployment.' });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        if (report.assigned_to) await Truck.findByIdAndUpdate(report.assigned_to, { is_assigned: false });
        await report.deleteOne();
        res.json({ success: true, message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: 'Delete failed' }); }
});

module.exports = router;