// models/Report.js

const mongoose = require('mongoose');

// Define the structure of a Report document
const ReportSchema = new mongoose.Schema({
  // 1. Reporter Information (Optional/Contact)
  reporter_phone: {
    type: String,
    required: [true, 'Phone number is required for follow-up.'],
    trim: true,
    maxlength: [15, 'Phone number cannot be more than 15 characters.']
  },
  
  // 2. Incident Details
  description: {
    type: String,
    required: [true, 'A brief description of the waste is required.'],
    trim: true,
  },
  
  // 3. Location Information (Crucial for the system - Now uses State/LGA/Location Name only)
  location: {
    name: { // E.g., "Behind Main Auditorium" - Specific landmark/address part
      type: String,
      required: [true, 'A specific location name/landmark is required.'],
    },
    state_area: { // E.g., "Lagos"
        type: String,
        required: [true, 'The State/Area is required.'],
    },
    lga_city: { // E.g., "Ikeja" - The specific local government area/city
        type: String,
        required: [true, 'The Local Government Area/City is required.'],
    }
    // coordinates field has been removed entirely
  },

  // 4. Image Proof (The link from Cloudinary)
  image_url: {
    type: String,
    required: [true, 'An image proof of the waste pile is required.'],
  },
  
  // 5. System Management & Workflow Fields
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In-Progress', 'Cleared'], 
    default: 'Pending',
  },
  
  // --- NEW FIELDS FOR MULTI-ADMIN & LOGISTICS ---

  // Tracks which Admin/User last modified the report
  last_updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model (Admin who took action)
    default: null
  },
  
  // Tracks which Truck/Driver is assigned to the pickup
  assigned_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Truck', // Links to the NEW Truck model
    default: null
  },

  date_assigned: {
    type: Date,
    default: null
  },

  date_cleared: {
    type: Date,
    default: null
  },

  // Proof submitted by the Driver upon pickup
  proof_image_url: { 
    type: String, 
    default: null 
  },
  
  proof_notes: { 
    type: String, 
    default: null 
  },
  
  proof_submitted_at: { 
    type: Date, 
    default: null 
  },
  
  // --- END NEW FIELDS ---

}, { timestamps: { createdAt: 'date_reported' } });

// IMPORTANT: No '2dsphere' index is needed anymore.

const Report = mongoose.model('Report', ReportSchema);

module.exports = Report;