// routes/driverAuthRoutes.js (UPDATED: Added /login route)

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 
const User = require('../models/User'); // Assume User model has been updated to include email
const Truck = require('../models/Truck'); 
const { protectDriver } = require('../middleware/authMiddleware'); 

// --- Helper function to generate JWT token ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d', 
  });
};

// @route   POST /api/drivers/auth/register
// @desc    Register a new driver and create a PENDING Truck profile
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Assume user is identified by email, matching the client-side form.
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ success: false, error: 'Driver email already registered.' });
        }
        
        // Hash password before creating user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = new User({
            username: name,
            email, // Assuming 'email' is now part of the User model schema
            password: hashedPassword,
            role: 'driver' // Assuming a 'driver' role
        });
        
        user = await newUser.save();
        
        // Automatically create a pending Truck document linked to the driver
        const newTruck = new Truck({
            driver_id: user._id,
            driver_name: user.username,
            // license_plate and capacity are added later via the PUT /profile route
            license_plate: 'PENDING',
            capacity_tons: 0, 
            is_approved: false
        });

        await newTruck.save();
        
        res.status(201).json({ 
            success: true,
            message: 'Registration successful! Truck profile initiated.',
            username: user.username,
            token: generateToken(user._id)
        });
    } catch (err) {
        console.error("Registration failed:", err);
        res.status(500).json({ success: false, error: 'Server error during registration.' });
    }
});


// @route   POST /api/drivers/auth/login
// @desc    Authenticate driver and get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body; // Driver login uses email
  
    try {
        // 1. Check if user exists by email
        const user = await User.findOne({ email });
  
        // 2. Check user existence and password
        if (user && (await bcrypt.compare(password, user.password))) {
            // 3. Credentials are correct, send back success message and JWT token
            res.json({
                success: true,
                message: 'Login successful',
                username: user.username,
                role: user.role,
                token: generateToken(user._id), // Send the token
            });
        } else {
            // 4. Authentication failed
            res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
    } catch (err) {
        console.error("Login failed:", err);
        res.status(500).json({ success: false, error: 'Server error during login.' });
    }
});


// @route   GET /api/drivers/auth/profile
// @desc    Get driver profile (User details and Truck details)
// @access  Private (Driver Only)
router.get('/profile', protectDriver, async (req, res) => {
    try {
        // Fetch the user details (already attached by protectDriver middleware)
        const userDetails = req.user;
        
        // Fetch the associated truck profile
        const truckProfile = await Truck.findOne({ driver_id: req.user.id });

        if (!truckProfile) {
            // This should ideally not happen after registration, but is a safe guard
            return res.status(404).json({ success: false, error: 'Truck profile not found. Please submit your truck details.' });
        }
        
        res.json({
            success: true,
            data: { user: userDetails, truck: truckProfile }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error fetching profile.' });
    }
});


// @route   PUT /api/drivers/auth/profile
// @desc    Driver submits/updates their truck profile
// @access  Private (Driver Only)
router.put('/profile', protectDriver, async (req, res) => {
    // Only allow updating license plate and capacity tons
    const { license_plate, capacity_tons } = req.body;

    if (!license_plate || !capacity_tons) {
        return res.status(400).json({ success: false, error: 'License plate and capacity are required.' });
    }
    
    try {
        // Assuming the Truck model has the driver_name field
        const truck = await Truck.findOneAndUpdate(
            { driver_id: req.user.id },
            { 
                license_plate, 
                capacity_tons,
                driver_name: req.user.username // Ensure driver name is carried over
            },
            { new: true, runValidators: true } 
        );

        if (!truck) {
             // This might happen if registration failed to create the initial truck entry
             return res.status(404).json({ success: false, error: 'Truck profile not found for this driver. Please contact support.' });
        }
        
        res.json({
            success: true,
            message: 'Truck details updated successfully. Awaiting admin review if not yet approved.',
            data: truck
        });

    } catch (err) {
        console.error(err);
        // Handle unique constraint error (e.g., license plate already exists)
        if (err.code === 11000) { 
             return res.status(400).json({ success: false, error: 'License plate already registered by another truck.' });
        }
        res.status(500).json({ success: false, error: 'Server error updating truck profile.' });
    }
});


module.exports = router;