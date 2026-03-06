const app = require('../server.js');
const connectDB = require('../config/db');

module.exports = async (req, res) => {
    try {
        await connectDB();
        return app(req, res);
    } catch (err) {
        console.error('Vercel API Gateway Database Initialization Error:', err);
        return res.status(500).json({
            success: false,
            error: 'Database connection failed during serverless boot.',
            details: err.message
        });
    }
};
