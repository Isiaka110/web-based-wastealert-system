require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Truck = require('./models/Truck');

async function fixApprovals() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB...');

        // 1. Find all drivers who have a verified truck but are unapproved themselves
        const trucks = await Truck.find({ is_approved: true });
        for (const truck of trucks) {
            if (truck.driver_id) {
                await User.findByIdAndUpdate(truck.driver_id, { is_approved: true });
                console.log(`Auto-approved driver ${truck.driver_id} due to verified truck ${truck.license_plate}`);
            }
        }

        // 2. Find all trucks whose drivers are approved but the truck is unapproved
        const approvedUsers = await User.find({ role: 'driver', is_approved: true });
        for (const user of approvedUsers) {
            await Truck.findOneAndUpdate({ driver_id: user._id }, { is_approved: true });
            console.log(`Auto-verified truck for approved driver ${user.username}`);
        }

        console.log('✅ Synchronization complete!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixApprovals();
