// routes/authRoutes.js (Final Corrected Version)

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// --- Helper function to generate JWT token ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expires in 1 day
  });
};

// @route   POST /api/auth/register
// routes/authRoutes.js (Updated /register Route)

router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        let user = await User.findOne({ username });

        if (user) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // --- FIX IS HERE ---
        // 1. Create a new document instance (does not hit the DB yet)
        const newUser = new User({
            username,
            password,
            role: 'admin'
        });
        
        // 2. Explicitly call .save() which guarantees the pre('save') hook runs!
        user = await newUser.save(); 
        // --- END FIX ---
        
        res.status(201).json({ 
            success: true,
            message: 'Admin user created successfully (RUN THIS ONLY ONCE!)',
            username: user.username,
            token: generateToken(user._id)
        });
    } catch (err) {
        console.error("Registration failed with error:", err);
        res.status(500).json({ success: false, error: 'Server error during registration' });
    }
});
// ... (Login route remains unchanged) ...

// @route   POST /api/auth/login
// @desc    Authenticate admin user and get token
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      // 2. Credentials are correct, send back success message and JWT token
      res.json({
        success: true,
        message: 'Login successful',
        username: user.username,
        role: user.role,
        token: generateToken(user._id), // Send the token for future requests
      });
    } else {
      // 3. Authentication failed
      res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

module.exports = router;