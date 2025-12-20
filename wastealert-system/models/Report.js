// models/Report.js
const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  reporter_phone: {
    type: String,
    required: [true, 'Phone number is required.'],
    trim: true,
    maxlength: [15, 'Phone number cannot be more than 15 characters.']
  },
  description: {
    type: String,
    required: [true, 'A description of the waste is required.'],
    trim: true,
  },
  location: {
    // Corrected to location_name to match app.js and reportRoutes.js
    location_name: { 
      type: String,
      required: [true, 'A specific location name/landmark is required.'],
    },
    state_area: { 
        type: String,
        required: [true, 'The State/Area is required.'],
    },
    lga_city: { 
        type: String,
        required: [true, 'The Local Government Area/City is required.'],
    }
    // coordinates field and 2dsphere index have been removed
  },
  image_url: {
    type: String,
    required: [true, 'An image proof is required.'],
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In-Progress', 'Cleared'], 
    default: 'Pending',
  },
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck',
    default: null
  },
  date_assigned: { type: Date, default: null },
  date_cleared: { type: Date, default: null },
  proof_image_url: { type: String, default: null },
  proof_notes: { type: String, default: null },
  proof_submitted_at: { type: Date, default: null }
}, { timestamps: { createdAt: 'date_reported' } });

module.exports = mongoose.model('Report', ReportSchema);