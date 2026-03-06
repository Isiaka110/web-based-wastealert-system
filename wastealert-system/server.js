// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); // Add this line
const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware setup
app.use(cors());
app.use(express.json()); // Essential for parsing JSON from frontend fetch calls

// 2. Connect to MongoDB
const connectDB = require('./config/db');
if (process.env.NODE_ENV !== 'production') {
  connectDB(); // Start immediately for dev/test environments.
}

// 3. API Health Check (Use this to verify server is alive)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'WasteAlert Server is running' });
});

// 4. Route Handlers
const authRoutes = require('./routes/authRoutes');
const driverAuthRoutes = require('./routes/driverAuthRoutes');
const userRoutes = require('./routes/userRoutes');
const truckRoutes = require('./routes/truckRoutes');
const reportRoutes = require('./routes/reportRoutes');

// 5. Mounting the Routers
app.use('/api/auth', authRoutes);
app.use('/api/drivers/auth', driverAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trucks', truckRoutes);
app.use('/api/reports', reportRoutes);

// 6. Serve static files cleanly
app.use(express.static(path.join(__dirname, 'public')));

// 7. 404 Catch-All Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `The path ${req.originalUrl} does not exist on this server.`
  });
});

// 8. Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Endpoints active at http://localhost:${PORT}/api`);
  });
}

module.exports = app;