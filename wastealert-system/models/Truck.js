// models/Truck.js
const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
    license_plate: { type: String, required: [true, 'License plate is required'], unique: true },
    driver_name: { type: String, required: true }, // As requested by your validation error
    capacity_tons: { type: Number, required: [true, 'Capacity is required'] },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    is_approved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Truck', TruckSchema);