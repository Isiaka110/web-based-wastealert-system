// routes/truckRoutes.js

const express = require('express');
const router = express.Router();
const Truck = require('../models/Truck');
const { protect } = require('../middleware/authMiddleware'); // Import Auth Middleware

// @route   POST /api/trucks
// @desc    Add a new truck/driver to the fleet (Kept for manual admin override)
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
// @desc    Get all trucks and their availability (Approved & Pending)
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
// @desc    Update truck status (availability) or approve a driver (set is_approved: true)
// @access  Private (Admin Only)
// routes/truckRoutes.js (Update PUT /api/trucks/:id)

// @route   PUT /api/trucks/:id
// @desc    Admin updates truck details or approval status
// @access  Private (Admin Only)
router.put('/:id', protect, async (req, res) => {
    try {
        // Destructure only updatable fields, including is_approved
        const { license_plate, capacity_tons, is_approved, is_available } = req.body;
        
        const updateFields = {
            license_plate,
            capacity_tons,
            is_approved, // Allows admin to set the approval status
            is_available
        };
        
        const truck = await Truck.findByIdAndUpdate(req.params.id, updateFields, {
            new: true, 
            runValidators: true 
        });

        if (!truck) {
            return res.status(404).json({ success: false, error: 'Truck not found' });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Truck profile updated successfully.',
            data: truck 
        });

    } catch (err) {
        console.error(err);
        if (err.code === 11000) { 
            return res.status(400).json({ success: false, error: 'License plate already registered.' });
        }
        res.status(500).json({ success: false, error: 'Server error updating truck.' });
    }
});

// ... (rest of truckRoutes.js)

// @route   DELETE /api/trucks/:id
// @desc    Delete a truck/driver (Used for Admin rejection of pending submissions)
// @access  Private (Admin Only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const truck = await Truck.findByIdAndDelete(req.params.id);

        if (!truck) {
            return res.status(404).json({ success: false, error: 'Truck not found' });
        }
        
        res.status(200).json({ success: true, data: {}, message: 'Truck successfully removed (Driver Rejected).' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error deleting truck.' });
    }
});


module.exports = router;