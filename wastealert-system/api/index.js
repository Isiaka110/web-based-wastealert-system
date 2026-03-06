const app = require('../server.js');
const connectDB = require('../config/db');

// Connect to MongoDB here so Vercel Serverless Functions initializes it.
connectDB();

module.exports = app;
