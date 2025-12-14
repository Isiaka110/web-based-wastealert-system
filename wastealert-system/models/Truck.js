// models/Truck.js 

const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true, // Only one truck per driver/user
        ref: 'User' // Reference the User model
    },
    driver_name: {
        type: String,
        required: true,
        trim: true
    },
    license_plate: {
        type: String,
        required: [true, 'License plate is required'],
        unique: true, // IMPORTANT: Plate numbers must be unique across all units
        trim: true
    },
    capacity_tons: {
        type: Number,
        required: [true, 'Capacity (in tons) is required'],
        min: [1, 'Capacity must be at least 1 ton.']
    },
    is_approved: {
        type: Boolean,
        default: false // Controlled by Admin
    },
    // CRITICAL FIX: is_assigned is the field used in report/truck routes to mark busy/available
    is_assigned: {
        type: Boolean,
        default: false // True if currently assigned a report, False if available
    }
}, { timestamps: true });

// Note: Renamed 'is_available' to 'is_assigned' for clarity (True = Busy / False = Available)
// You may need to update 'truckRoutes.js' to use 'is_assigned' instead of 'is_available'.

module.exports = mongoose.model('Truck', TruckSchema);