// routes/driverAuthRoutes.js (FINAL ROBUST DRIVER AUTHENTICATION for EMIWIP)

const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const Truck = require('../models/Truck'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { protectDriver } = require('../middleware/authMiddleware'); // For the /profile route

// --- Helper function to generate JWT token ---
const generateToken = (id) => {
    // NOTE: Replace 'supersecretkey' with process.env.JWT_SECRET in your production setup
    return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', { 
        expiresIn: '7d', // Token lifetime
    });
};

// =================================================================
// 1. DRIVER REGISTRATION (POST /api/drivers/auth/register)
// =================================================================

router.post('/register', async (req, res) => {
    // Rename 'username' to 'rawUsername' for trimming logic
    const { username: rawUsername, email, password, license_plate, capacity_tons } = req.body; 
    
    // CRITICAL FIX 1: Trim the username and use it in the validation
    const username = rawUsername ? rawUsername.trim() : rawUsername;

    // Use a Mongoose transaction for atomicity: either User and Truck are created, or neither is.
    const session = await User.startSession(); 
    session.startTransaction();

    try {
        // Basic Validation (now checks for empty string after trimming)
        if (!username || username.length === 0 || !email || !password || !license_plate || !capacity_tons) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, error: 'Please fill all required fields: username, email, password, license plate, and truck capacity (tons).' });
        }

        // 1. Check if user already exists (using email as the primary unique field)
        let user = await User.findOne({ email }).session(session);
        if (user) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, error: 'User with that email already exists.' });
        }
        
        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create the User (Role: 'driver')
        const newUserArray = await User.create([{
            username: username, // Use the trimmed username
            email,
            password: hashedPassword,
            role: 'driver' // Critical role assignment
        }], { session });
        user = newUserArray[0];

        // 4. Create the associated Truck record (Fleet Unit)
        const newTruckArray = await Truck.create([{
            license_plate,
            capacity_tons,
            driver_id: user._id,
            driver_name: username,
            is_approved: false, // Default to false (Pending)
            is_assigned: false, // Truck is initially available
        }], { session });
        const truck = newTruckArray[0];

        // 5. Commit the transaction
        await session.commitTransaction();

        res.status(201).json({ 
            success: true,
            message: 'Registration successful. Your Fleet Unit is now pending review and approval by the Portal Manager.',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                truck_id: truck._id,
                license_plate: truck.license_plate,
            }
        });
    } catch (err) {
        await session.abortTransaction();
        console.error("Driver Registration failed with error:", err);
        
        // CRITICAL FIX 2: Handle Mongoose Validation Errors (This catches "Username is required")
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: `Validation Failed: ${errors.join(', ')}` });
        }
        
        // Handle the E11000 duplicate key error (for email, license_plate, or username uniqueness)
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0]; 
            const value = err.keyValue[field]; 
            return res.status(400).json({ 
                success: false, 
                error: `The ${field} '${value}' is already taken. Please choose a different one.` 
            });
        }

        res.status(500).json({ success: false, error: 'Server error during registration.' });
    } finally {
        session.endSession();
    }
});

// =================================================================
// 2. DRIVER LOGIN (POST /api/drivers/auth/login)
// =================================================================

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.role !== 'driver') {
            return res.status(401).json({ success: false, error: 'Invalid credentials or access denied.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password); 

        if (isMatch) {
            const truck = await Truck.findOne({ driver_id: user._id });

            // Check for truck approval status
            if (!truck || truck.is_approved !== true) {
                 return res.status(403).json({ 
                     success: false, 
                     error: 'Account pending review. Please wait for the Portal Manager to approve your Fleet Unit registration.' 
                 });
            }

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    license_plate: truck.license_plate, 
                    truck_id: truck._id,
                    is_approved: truck.is_approved,
                    token: generateToken(user._id), 
                },
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials.' });
        }

    } catch (err) {
        console.error("Driver login error:", err);
        res.status(500).json({ success: false, error: 'Server error during login.' });
    }
});

// =================================================================
// 3. GET DRIVER PROFILE (GET /api/drivers/auth/profile)
// =================================================================
router.get('/profile', protectDriver, async (req, res) => {
    try {
        const truck = await Truck.findOne({ driver_id: req.user._id });
        
        res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                },
                truck: truck || null,
            }
        });
    } catch (err) {
        console.error("Driver profile fetch error:", err);
        res.status(500).json({ success: false, error: 'Server error fetching profile.' });
    }
});


module.exports = router;