// models/Truck.js (Updated Schema)

const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
    // CRITICAL FIX: The link to the driver's User document
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true, // Only one truck per driver
        ref: 'User' // Reference the User model
    },
    // Used for display/logging without needing an extra lookup
    driver_name: {
        type: String,
        required: true,
        trim: true
    },
    license_plate: {
        type: String,
        required: [true, 'License plate is required'],
        unique: true, // IMPORTANT: Ensure plate numbers are unique
        trim: true
    },
    capacity_tons: {
        type: Number,
        required: [true, 'Capacity is required'],
        min: 1
    },
    is_approved: {
        type: Boolean,
        default: false // Controlled by Admin
    },
    is_available: {
        type: Boolean,
        default: false // Controlled by Driver/System
    }
}, { timestamps: true });

module.exports = mongoose.model('Truck', TruckSchema);