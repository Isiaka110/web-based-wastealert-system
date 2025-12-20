const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/users/drivers/pending
 * @desc    Fetch drivers awaiting approval for the Admin "Pending" tab
 */
router.get('/drivers/pending', protect, async (req, res) => {
    try {
        const drivers = await User.find({ 
            role: 'driver', 
            is_approved: false 
        }).select('-password').sort({ createdAt: -1 });

        res.json({ success: true, data: drivers });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Database error fetching pending drivers' });
    }
});

/**
 * @route   GET /api/users
 * @desc    Fetch ALL users for the main Admin Fleet Management table
 */
router.get('/', protect, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Failed to fetch fleet list' });
    }
});

/**
 * @route   PATCH /api/users/approve/:id
 * @desc    Admin action to approve a driver (Fixes the 403 Forbidden on Driver Login)
 */
router.patch('/approve/:id', protect, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { is_approved: true }, 
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({ 
            success: true, 
            message: `Driver ${user.username} is now authorized.`,
            data: user 
        });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Approval failed' });
    }
});

module.exports = router;