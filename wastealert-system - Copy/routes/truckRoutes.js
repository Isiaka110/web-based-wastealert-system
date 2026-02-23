// routes/truckRoutes.js
const express = require('express');
const router = express.Router();
const Truck = require('../models/Truck');
const { protect, protectDriver } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/trucks
 * @desc    Register a new truck unit (used by Driver Dashboard)
 */
router.post('/', protectDriver, async (req, res) => {
    try {
        const { plate_number, capacity_tons } = req.body;

        // Check if driver already has a truck registered
        const existingTruck = await Truck.findOne({ driver_id: req.user._id });
        if (existingTruck) {
            return res.status(400).json({ 
                success: false, 
                error: 'A vehicle unit is already associated with this account.' 
            });
        }

        const newTruck = new Truck({
            license_plate: plate_number, // Ensure this matches your Schema field
            driver_name: req.user.username,
            capacity_tons: Number(capacity_tons),
            driver_id: req.user._id,
            is_approved: false, // Admin must approve this later
            is_assigned: false
        });

        await newTruck.save();
        res.status(201).json({ success: true, message: 'Truck unit submitted for verification.' });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

/**
 * @route   GET /api/trucks
 * @desc    Admin view of all trucks
 */
router.get('/', protect, async (req, res) => {
    try {
        const trucks = await Truck.find().populate('driver_id', 'username');
        res.json({ success: true, data: trucks });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;