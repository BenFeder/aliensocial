const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Document will be automatically deleted after 1 hour
  }
});

// Index for faster lookups
passwordResetSchema.index({ token: 1 });
passwordResetSchema.index({ userId: 1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
