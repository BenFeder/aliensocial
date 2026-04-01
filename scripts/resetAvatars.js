// Script to reset all avatar paths in the database
// Run this once to clear local avatar paths so users re-upload on Vercel

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../server/models/User');

const resetAvatars = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users with local avatar paths (starting with /uploads)
    const result = await User.updateMany(
      { avatar: { $regex: '^/uploads' } },
      { $unset: { avatar: "" } }
    );

    console.log(`Reset ${result.modifiedCount} avatar(s)`);
    console.log('Users will need to re-upload their avatars on the live site');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetAvatars();
