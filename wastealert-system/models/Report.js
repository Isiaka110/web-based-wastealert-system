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
  
  // 3. Location Information (Crucial for the system)
  location: {
    name: { // E.g., "Behind Main Auditorium"
      type: String,
      required: true,
    },
    coordinates: { // Stored as [longitude, latitude] for Leaflet/GeoJSON
      type: [Number], 
      required: true,
      index: '2dsphere' // Special index for geospatial queries
    }
  },

  // 4. Image Proof (The link from Cloudinary)
  image_url: {
    type: String,
    required: [true, 'An image proof of the waste pile is required.'],
  },
  
  // 5. System Management Fields
  status: {
    type: String,
    enum: ['Pending', 'Cleared', 'In-Review'], // Defines the possible values
    default: 'Pending',
  },
  
  date_created: {
    type: Date,
    default: Date.now,
  },
  
  date_cleared: { // Admin will set this when they mark it as 'Cleared'
    type: Date,
  }
}, {
  timestamps: true // Adds `createdAt` and `updatedAt` timestamps automatically
});

// Export the model for use in our server/routes
module.exports = mongoose.model('Report', ReportSchema);