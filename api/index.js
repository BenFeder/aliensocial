// Vercel serverless function wrapper
try {
  const app = require('../server/server');
  module.exports = app;
} catch (error) {
  console.error('Error loading Express app:', error);
  
  // Export a minimal error handler
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message
    });
  };
}
