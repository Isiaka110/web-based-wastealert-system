// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

// --- 1. Protect Middleware (for Admin Routes) ---
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
      }

      // **CRITICAL FIX: Check for Admin role**
      if (user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Access denied: Admin role required' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Admin Auth Error:", error);
      res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

// --- 2. Protect Driver Middleware (for Driver Routes) ---
const protectDriver = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ success: false, error: 'Not authorized, driver not found' });
            }

            // **CRITICAL FIX: Check for Driver role**
            if (user.role !== 'driver') {
                return res.status(403).json({ success: false, error: 'Access denied: Driver role required' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error("Driver Auth Error:", error);
            res.status(401).json({ success: false, error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
};

// Export BOTH functions
module.exports = { protect, protectDriver };