const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Truck = require('../models/Truck');
const { protectDriver } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/drivers/auth/profile
 * @desc    Get logged in driver details and their truck status for Dashboard init
 * @access  Private (Driver Only)
 */
router.get('/profile', protectDriver, async (req, res) => {
    try {
        // req.user and req.truck are already attached by the protectDriver middleware
        const user = await User.findById(req.user._id).select('-password');
        const truck = await Truck.findOne({ driver_id: req.user._id });

        res.json({
            success: true,
            data: {
                user,
                truck: truck || null // Returns null if no truck is registered yet
            }
        });
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ success: false, error: 'Server error fetching profile' });
    }
});

/**
 * @route   POST /api/drivers/auth/register
 * @desc    Register a new driver and their vehicle simultaneously
 * @access  Public
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, license_plate, capacity_tons } = req.body;

        // 1. Validation: Prevent duplicate email
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ error: 'Email already registered.' });
        }

        // 2. Create the User (is_approved defaults to false)
        const user = new User({
            username,
            email: email.toLowerCase(),
            password, // Password hashing happens in User model pre-save hook
            role: 'driver'
        });
        await user.save();

        // 3. Create the Truck (Link to the new User)
        const truck = new Truck({
            license_plate: license_plate,
            driver_name: username,
            capacity_tons: Number(capacity_tons),
            driver_id: user._id,
            is_approved: false
        });
        await truck.save();

        res.status(201).json({ 
            success: true, 
            message: 'Enrollment successful! Awaiting administrative approval.' 
        });

    } catch (err) {
        console.error("Registration Logic Error:", err.message);
        res.status(400).json({ error: err.message });
    }
});

/**
 * @route   POST /api/drivers/auth/login
 * @desc    Authenticate driver and return JWT
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find user and include password for comparison
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials provided.' });
        }

        // 2. Verify Hashed Password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials provided.' });
        }

        // 3. Authorization Check: Is the account approved by Admin?
        if (!user.is_approved) {
            return res.status(403).json({ 
                error: 'Account pending approval. Please contact management.' 
            });
        }

        // 4. Generate Session Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_fallback_jwt_secret',
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Login Controller Error:", err);
        res.status(500).json({ error: 'Internal server error during authentication.' });
    }
});

module.exports = router;