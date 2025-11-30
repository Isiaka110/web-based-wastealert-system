// models/User.js (Pre-save hook removed to fix persistent TypeError)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Using bcryptjs

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
  },
  email: { 
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'superadmin', 'driver'], 
    default: 'admin',
  },
}, {
    timestamps: true,
});

// FIX: The UserSchema.pre('save', ...) hook has been removed entirely.
// Hashing is now handled synchronously in the route handlers (driverAuthRoutes.js).

// Method to compare login password with the stored hashed password (remains valid)
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;