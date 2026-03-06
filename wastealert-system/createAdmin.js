require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is missing in .env file.");
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        const adminEmail = 'admin@wastealert.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (adminExists) {
            console.log('✅ Admin user already exists!');
            console.log(`Email: ${adminEmail}`);
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.create({
            username: 'SuperAdmin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            is_approved: true
        });

        console.log('✅ First-time Admin created successfully!');
        console.log('-----------------------------------');
        console.log(`Email:    ${adminEmail}`);
        console.log(`Password: admin123`);
        console.log('-----------------------------------');
        console.log('Please log in and remember to change your password!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error creating Admin:', err);
        process.exit(1);
    }
};

seedAdmin();
