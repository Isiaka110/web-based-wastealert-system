const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};


// 1. ADMIN REGISTRATION 
// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Basic check for required fields
        if (!username || !password || !email) {
            return res.status(400).json({ success: false, error: 'Please enter username, email, and password.' });
        }

        let user = await User.findOne({ email }); // Check by email as it's unique
        if (user) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const newUser = new User({
            username,
            email,
            password: password,
            role: 'admin',
            is_approved: true // Admins are approved by default
        });

        user = await newUser.save();

        res.status(201).json({
            success: true,
            message: 'Admin/Platform Manager account created successfully.',
            username: user.username,
            role: user.role,
            token: generateToken(user._id)
        });
    } catch (err) {
        console.error("Registration failed with error:", err);
        res.status(500).json({ success: false, error: 'Server error during registration' });
    }
});


// 2. ADMIN LOGIN 
// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Try to find user by username OR email
        const user = await User.findOne({
            $or: [
                { username: username },
                { email: username }
            ]
        });

        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
            return res.status(401).json({ success: false, error: 'Invalid credentials or unauthorized access.' });
        }

        if (await user.matchPassword(password)) {
            res.json({
                success: true,
                message: 'Login successful',
                username: user.username,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error("Login failed with error:", err);
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
});

module.exports = router;