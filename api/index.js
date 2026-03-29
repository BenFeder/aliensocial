// Vercel serverless function wrapper
const connectDB = require('../server/config/db');

let app;
let isConnecting = false;
let connectionError = null;

// Initialize app and database connection
async function initializeApp() {
  if (app) return app;
  if (connectionError) throw connectionError;
  
  if (!isConnecting) {
    isConnecting = true;
    try {
      console.log('Initializing serverless function...');
      
      // Wait for MongoDB connection
      await connectDB();
      console.log('MongoDB connected in serverless function');
      
      // Load Express app
      app = require('../server/server');
      console.log('Express app loaded');
      
      return app;
    } catch (error) {
      console.error('Error initializing app:', error);
      connectionError = error;
      throw error;
    }
  }
  
  // Wait for initialization to complete
  while (isConnecting && !app && !connectionError) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (connectionError) throw connectionError;
  return app;
}

// Export handler that waits for initialization
module.exports = async (req, res) => {
  try {
    const expressApp = await initializeApp();
    return expressApp(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      error: 'Server initialization failed',
      message: error.message
    });
  }
};
