// server.js

// 1. Load environment variables
require('dotenv').config();

// 2. Import modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// 3. Initialize the Express app
const app = express();
const PORT = process.env.PORT || 5000; // Use port from environment or default to 5000

// 4. Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allows the server to accept JSON data in the request body

// 5. Connect to MongoDB
const dbUri = process.env.MONGO_URI; 

mongoose.connect(dbUri)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// 6. Basic Test Route
// This is to ensure the server is running correctly
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: "WasteAlert API is running!", 
    environment: process.env.NODE_ENV || 'development'
  });
});

// ********** 7. Route Handlers (To be added in the next step!) **********
// app.use('/api/reports', require('./routes/reportRoutes'));
// app.use('/api/auth', require('./routes/authRoutes'));
// 7. Route Handlers 
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes'); // Import the new auth routes
// server.js (Add this below the existing reportRoutes and authRoutes)

// Truck/Logistics Routes
const truckRoutes = require('./routes/truckRoutes');
app.use('/api/trucks', truckRoutes); // Set up the endpoint
// Mount the routers
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes); // Use the auth routes for login/register


// 8. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});