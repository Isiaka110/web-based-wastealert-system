// models/User.js (Final and Corrected Version for Async Middleware)

const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Import bcrypt

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'], // Define roles for future expansion
    default: 'admin',
  }
});

// Middleware: Hash the password before saving the user document
// NOTE: We define this as an ASYNC function and DO NOT use the 'next' argument.
// Mongoose waits for the promise to resolve before continuing.
UserSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    // If we return here, Mongoose continues the save operation automatically.
    return;
  }
  
  // No need for try...catch here, Mongoose handles promise rejection errors
  // for async pre-hooks and passes them to the calling catch block (in authRoutes.js).
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Do NOT call next() here. The function completing is enough for Mongoose.
});

// Method to compare login password with the stored hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  // Use bcrypt's compare function
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);