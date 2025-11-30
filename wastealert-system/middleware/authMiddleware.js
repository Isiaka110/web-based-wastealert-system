// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model

const protect = async (req, res, next) => {
  let token;

  // 1. Check for the token in the request header
  // Tokens are typically sent in the format: "Bearer <TOKEN>"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (split "Bearer" and the token itself)
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify the token using the JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Find the user associated with the token's ID
      // Select('-password') excludes the password hash from the user object
      req.user = await User.findById(decoded.id).select('-password');

      // 4. Continue to the next middleware or route handler
      next();
    } catch (error) {
      console.error(error);
      // Token is invalid (e.g., expired or tampered with)
      res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  }

  // 5. If no token is found in the header
  if (!token) {
    res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

module.exports = { protect };