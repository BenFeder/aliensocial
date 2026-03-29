const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Log environment status
console.log('Server starting with env:', {
  hasMongoUri: !!process.env.MONGODB_URI,
  hasJwtSecret: !!process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV,
  isVercel: !!process.env.VERCEL
});

const connectDB = require('./config/db');

const app = express();

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('FATAL: MONGODB_URI is not set!');
}
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set!');
}

// In serverless, connection is handled by api/index.js
// In development, connect immediately
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
if (!isServerless) {
  connectDB().catch(err => console.error('MongoDB connection failed:', err));
}

// CORS Configuration
const corsOptions = {
  origin: '*', // Allow all origins for now
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Only create upload directories if NOT in serverless environment
if (!isServerless) {
  const fs = require('fs');
  const uploadDirs = [
    'uploads/avatars',
    'uploads/posts/images',
    'uploads/posts/videos'
  ];
  uploadDirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      console.log('Could not create upload directory (expected in serverless):', dir);
    }
  });
  
  // Serve static files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/pages', require('./routes/pages'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'AlienSocial API is running',
    env: {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

// Test endpoint for debugging
app.post('/api/test', (req, res) => {
  console.log('Test endpoint hit with body:', req.body);
  res.json({ received: req.body, message: 'Test successful' });
});

// Export for Vercel serverless
module.exports = app;

// Only start server in development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
