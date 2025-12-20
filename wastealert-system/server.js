// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware setup
app.use(cors()); 
app.use(express.json()); // Essential for parsing JSON from frontend fetch calls

// 2. Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if DB connection fails
  });

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

// server.js
app.use('/api/trucks', require('./routes/truckRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/drivers/auth', require('./routes/driverAuthRoutes'));

// 6. Missing Function: 404 Catch-All
// This helps debug why routes like /profile might be failing
app.use((req, res) => {
    console.warn(`404 Alert: ${req.method} request to ${req.originalUrl} failed.`);
    res.status(404).json({ 
        error: 'Route Not Found', 
        message: `The path ${req.originalUrl} does not exist on this server.` 
    });
});

// 7. Missing Function: Global Error Handler
// Prevents the server from crashing when an error occurs in a route
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ 
        error: 'Internal Server Error', 
        message: err.message 
    });
});
// Only do this if you WANT "public" in your URL
app.use('/public', express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Endpoints active at http://localhost:${PORT}/api`);
});