require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const resetAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is missing in .env file.");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const adminEmail = 'admin@wastealert.com';
        const adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            console.log('❌ Admin user does not exist! Please run "node createAdmin.js" first.');
            process.exit(0);
        }

        // We assign the new plain password. The pre('save') hook in models/User.js will hash it.
        adminUser.password = 'admin123';
        await adminUser.save();

        console.log('✅ Admin password has been successfully reset to: admin123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error resetting Admin password:', err);
        process.exit(1);
    }
};

resetAdmin();
