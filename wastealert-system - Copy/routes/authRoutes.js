// routes/authRoutes.js (Final Corrected Version for Admin/Platform Manager)

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // <--- CRITICAL: ADDED REQUIRED DEPENDENCY
const User = require('../models/User');
const router = express.Router();

// --- Helper function to generate JWT token ---
const generateToken = (id) => {
    // NOTE: Ensure process.env.JWT_SECRET is set in your .env file
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d', // Increased token expiration for better admin experience
    });
};

// =================================================================
// 1. ADMIN REGISTRATION (POST /api/auth/register)
// =================================================================
// This route is for setting up the initial administrator.
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body; // Assuming email is now used

    try {
        // Basic check for required fields
        if (!username || !password || !email) {
            return res.status(400).json({ success: false, error: 'Please enter username, email, and password.' });
        }

        let user = await User.findOne({ email }); // Check by email as it's unique
        if (user) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // --- CRITICAL FIX: MANUAL HASHING (Since pre-save hook was removed) ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // --- END CRITICAL FIX ---

        // Create a new document instance with the HASHED password
        const newUser = new User({
            username,
            email,
            password: hashedPassword, // Store the HASHED password
            role: 'admin' // Ensure the role is set correctly to the database string
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


// =================================================================
// 2. ADMIN LOGIN (POST /api/auth/login) <--- FIX FOR ADMIN LOGIN FAILURE
// =================================================================

// @route   POST /api/auth/login
// @desc    Authenticate admin user and get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body; 

    try {
        // 1. Find user by username
        const user = await User.findOne({ username }); 

        // 2. Initial check: User existence AND correct role authorization
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
             // CRITICAL FIX: This rejects non-admin users, leading to a robust 401 error.
             return res.status(401).json({ success: false, error: 'Invalid credentials or unauthorized access.' });
        }
        
        // 3. Check password using the matchPassword method (which uses bcrypt.compare)
        if (await user.matchPassword(password)) {
            // 4. Successful login
            res.json({
                success: true,
                message: 'Login successful',
                username: user.username,
                role: user.role,
                token: generateToken(user._id), // Send the token
            });
        } else {
            // 5. Authentication failed (bad password)
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }
    } catch (err) {
        console.error("Login failed with error:", err);
        res.status(500).json({ success: false, error: 'Server error during login' });
    }
});

module.exports = router;