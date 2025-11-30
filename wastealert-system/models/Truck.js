// models/Truck.js

const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
    // Unique identifier for the vehicle
    license_plate: {
        type: String,
        required: [true, 'License plate is required'],
        unique: true,
        trim: true,
    },
    
    // Driver assigned to this truck
    driver_name: {
        type: String,
        required: [true, 'Driver name is required'],
        trim: true,
    },
    
    // Capacity helps the admin manage report assignment (e.g., assign small reports to small trucks)
    capacity_tons: {
        type: Number,
        default: 5,
        required: true,
    },
    
    // Status to quickly filter available trucks in the Admin Dashboard
    is_available: {
        type: Boolean,
        default: true,
    },
}, {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true 
});

// Export the model for use in routes (e.g., in a new logisticsRoute.js)
module.exports = mongoose.model('Truck', TruckSchema);