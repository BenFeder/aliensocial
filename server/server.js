const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB (async, won't block)
connectDB().catch(err => console.error('MongoDB connection failed:', err));

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

// Remove file upload directory creation for serverless
// Upload directories only work in development
if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  const uploadDirs = [
    'uploads/avatars',
    'uploads/posts/images',
    'uploads/posts/videos'
  ];
  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Serve static files (only in development)
if (process.env.NODE_ENV !== 'production') {
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
