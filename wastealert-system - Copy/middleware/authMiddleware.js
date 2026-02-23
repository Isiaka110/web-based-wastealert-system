// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Truck = require('../models/Truck');

// =================================================================
// 1. ADMIN PROTECTION MIDDLEWARE (protect)
// =================================================================
/**
 * Ensures the user is authenticated and has the role of 'admin' or 'superadmin'.
 * Used for Admin Dashboard stats, user approvals, and fleet management.
 */
const protect = async (req, res, next) => {
    let token;
    const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret'; 

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Safety check for empty or "undefined" strings from localStorage
            if (!token || token === 'undefined' || token === 'null') {
                return res.status(401).json({ success: false, error: 'Authentication token is missing or invalid.' });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Fetch user and exclude the password field
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ success: false, error: 'User no longer exists.' });
            }

            // Role Check: Restrict to Admins
            if (user.role !== 'admin' && user.role !== 'superadmin') {
                return res.status(403).json({ success: false, error: 'Access restricted to Platform Managers.' });
            }

            req.user = user;
            next();

        } catch (error) {
            console.error("Admin Auth Error:", error.message);
            res.status(401).json({ success: false, error: 'Session expired or invalid token.' });
        }
    } else {
        res.status(401).json({ success: false, error: 'No authorization token provided.' });
    }
};

// =================================================================
// 2. DRIVER PROTECTION MIDDLEWARE (protectDriver)
// =================================================================
/**
 * Ensures the user is authenticated and has the role of 'driver'.
 * Attaches req.user and req.truck to allow the dashboard to switch between 
 * Registration, Pending, and Active UI states.
 */
const protectDriver = async (req, res, next) => {
    let token;
    const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret'; 

    if (
        req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            if (!token || token === 'undefined' || token === 'null') {
                return res.status(401).json({ success: false, error: 'Driver token missing' });
            }

            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            // Ensure the user exists and is actually a driver
            if (!user || user.role !== 'driver') {
                return res.status(401).json({ success: false, error: 'Unauthorized: Driver account required.' });
            }
            
            // Fetch associated truck for the dashboard's checkAuthAndInit() logic
            const truck = await Truck.findOne({ driver_id: user._id });
            
            // Attach data to request for maximum compatibility with controller logic
            req.user = user; 
            req.truck = truck; 
            
            next();
        } catch (error) {
            console.error("Driver Auth Error:", error.message);
            res.status(401).json({ success: false, error: 'Not authorized' });
        }
    } else {
        res.status(401).json({ success: false, error: 'No authorization header found.' });
    }
};

module.exports = {
    protect,
    protectDriver,
};