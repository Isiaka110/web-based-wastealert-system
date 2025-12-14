// routes/truckRoutes.js (FINAL ROBUST ADMIN TRUCK MANAGEMENT)

const express = require('express');
const router = express.Router();
const Truck = require('../models/Truck'); 
const User = require('../models/User'); 
const { protect } = require('../middleware/authMiddleware'); // Admin protection

// @route   GET /api/trucks
// @desc    Get all trucks (Admin Only)
// @access  Private (Admin Only)
router.get('/', protect, async (req, res) => {
    try {
        // CRITICAL FIX: Populate the driver_id to get the driver's username/email for the Admin table
        // This ensures the client has the data needed for the pending approval list
        const trucks = await Truck.find().populate('driver_id', 'username email'); 
        res.status(200).json({ success: true, data: trucks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching trucks.' });
    }
});

// @route   PUT /api/trucks/:id/status
// @desc    Update truck registration status (Approve/Reject) AND operational status (Available/Busy) (Admin Only)
// @access  Private (Admin Only)
router.put('/:id/status', protect, async (req, res) => {
    const { is_approved, is_assigned } = req.body;
    
    let updateData = {};
    
    // Check for explicit approval status update (used by Approve/Reject buttons)
    if (typeof is_approved === 'boolean') {
        updateData.is_approved = is_approved;
        // If approving, also set the truck to available (is_assigned: false)
        if (is_approved === true) {
            updateData.is_assigned = false; 
        }
    }
    
    // Check for operational status update (used by Toggle Availability button)
    if (typeof is_assigned === 'boolean') {
        updateData.is_assigned = is_assigned;
    }
    
    // Prevent empty update calls
    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ success: false, error: 'No valid fields provided for update.' });
    }

    try {
        const truck = await Truck.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate('driver_id', 'username');

        if (!truck) {
            return res.status(404).json({ success: false, error: 'Truck not found' });
        }

        const message = updateData.is_approved === true ? 'Truck approved and set available.' : 
                        updateData.is_approved === false ? 'Truck status reverted to pending.' :
                        `Truck availability set to ${truck.is_assigned ? 'BUSY' : 'AVAILABLE'}.`;

        res.status(200).json({ success: true, message: message, data: truck });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error updating truck status.' });
    }
});

// @route   DELETE /api/trucks/:id
// @desc    Delete a truck registration (Admin only)
// @access  Private (Admin Only)
router.delete('/:id', protect, async (req, res) => {
    try {
        // Use a transaction for atomicity
        const session = await Truck.startSession();
        session.startTransaction();

        const truck = await Truck.findById(req.params.id).session(session);

        if (!truck) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, error: 'Truck not found' });
        }

        // IMPORTANT: Also delete the linked User (Driver) account
        await User.findByIdAndDelete(truck.driver_id).session(session);
        
        // Delete the Truck record
        await truck.deleteOne({ session });

        await session.commitTransaction();

        res.status(200).json({ 
            success: true, 
            data: {}, 
            message: 'Truck registration and associated driver account successfully deleted (Rejected).'
        });
    } catch (err) {
        console.error("Truck delete error:", err);
        res.status(500).json({ success: false, error: 'Server error deleting truck and associated user.' });
    }
});

module.exports = router;