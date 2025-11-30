// routes/truckRoutes.js

const express = require('express');
const router = express.Router();
const Truck = require('../models/Truck');
const { protect } = require('../middleware/authMiddleware'); // Import Auth Middleware

// @route   POST /api/trucks
// @desc    Add a new truck/driver to the fleet
// @access  Private (Admin Only)
router.post('/', protect, async (req, res) => {
    try {
        const truck = await Truck.create(req.body);
        res.status(201).json({ 
            success: true, 
            message: 'Truck added successfully.',
            data: truck 
        });
    } catch (err) {
        console.error(err);
        // Handle unique constraint error (e.g., license plate already exists)
        if (err.code === 11000) {
            return res.status(400).json({ success: false, error: 'License plate already registered.' });
        }
        res.status(500).json({ success: false, error: 'Server error adding truck.' });
    }
});

// @route   GET /api/trucks
// @desc    Get all trucks and their availability
// @access  Private (Admin Only)
router.get('/', protect, async (req, res) => {
    try {
        const trucks = await Truck.find();
        res.status(200).json({ success: true, count: trucks.length, data: trucks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching trucks.' });
    }
});

// @route   PUT /api/trucks/:id
// @desc    Update truck status or driver details
// @access  Private (Admin Only)
router.put('/:id', protect, async (req, res) => {
    try {
        const truck = await Truck.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Return the updated document
            runValidators: true // Run Mongoose schema validation
        });

        if (!truck) {
            return res.status(404).json({ success: false, error: 'Truck not found' });
        }
        
        res.status(200).json({ success: true, data: truck, message: 'Truck details updated.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error updating truck.' });
    }
});


module.exports = router;