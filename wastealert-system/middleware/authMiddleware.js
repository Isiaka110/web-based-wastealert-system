// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Truck = require('../models/Truck'); // Needed for protectDriver

// =================================================================
// 1. ADMIN PROTECTION MIDDLEWARE (protect)
// =================================================================

/**
 * Ensures the user is authenticated and has the role of 'admin' or 'superadmin'.
 * This is the function that enforces the 'admin' role, regardless of the frontend name.
 */
const protect = async (req, res, next) => {
    let token;
    // CRITICAL: Use fallback secret if not in .env (for dev environment)
    const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_jwt_secret'; 

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Fetch user and exclude the password field
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
            }

            // CRITICAL ROLE CHECK: Use the database role string ('admin'/'superadmin')
            if (user.role !== 'admin' && user.role !== 'superadmin') {
                return res.status(403).json({ success: false, error: 'Not authorized: Access restricted to Platform Managers (Admins).' });
            }

            req.user = user;
            next();

        } catch (error) {
            console.error("JWT Verification Error:", error.message);
            // This catches expired tokens or invalid signatures, leading to the "Unauthorized" error
            res.status(401).json({ success: false, error: 'Not authorized, session expired or token failed.' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, error: 'Not authorized, no token provided.' });
    }
};

// =================================================================
// 2. DRIVER PROTECTION MIDDLEWARE (protectDriver)
// =================================================================

/**
 * Ensures the user is authenticated and has the role of 'driver'.
 * It also attaches the driver's associated Truck ID (Fleet Unit ID) to the request.
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
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ success: false, error: 'Not authorized, driver user not found' });
            }
            
            // Check for 'driver' role
            if (user.role !== 'driver') {
                return res.status(403).json({ success: false, error: 'Access restricted to Fleet Operators.' });
            }
            
            // Find the associated truck (Fleet Unit)
            const truck = await Truck.findOne({ driver_id: user._id });

            if (!truck) {
                return res.status(403).json({ success: false, error: 'No associated Fleet Unit found for this Operator.' });
            }
            
            // Attach driver and truck to the request
            req.driver = user;
            req.driver.truck = truck._id; // Store the truck ID for easy access in routes
            
            next();

        } catch (error) {
            console.error("Driver JWT Verification Error:", error.message);
            res.status(401).json({ success: false, error: 'Not authorized, session expired or token failed.' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, error: 'Not authorized, no token provided.' });
    }
};


module.exports = {
    protect,
    protectDriver,
};