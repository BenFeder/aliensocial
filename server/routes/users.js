const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Register
router.post('/register', [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    console.log('Registration attempt:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    // Check if user already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('Email already exists:', email);
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log('Username already exists:', username);
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Create new user
    const user = new User({ email, username, password });
    await user.save();
    console.log('User created successfully:', user._id);

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: error.stack?.split('\n')[0] // First line of stack trace
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('connections', 'username avatar')
      .populate('connectionRequests', 'username avatar')
      .populate('followedPages', 'name avatar');
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/search/users', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      username: { $regex: q, $options: 'i' }
    })
      .select('username avatar')
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by username
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email')
      .populate('connections', 'username avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio } = req.body;
    const user = await User.findById(req.userId);

    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.userId);
    
    // Cloudinary provides the full URL in req.file.path
    // Local disk storage provides filename, we construct the path
    if (req.file.path && req.file.path.startsWith('http')) {
      // Cloudinary URL
      user.avatar = req.file.path;
    } else {
      // Local file path
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }
    
    await user.save();

    res.json({ avatar: user.avatar });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send connection request
router.post('/connect/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.userId === req.params.userId) {
      return res.status(400).json({ message: 'Cannot connect with yourself' });
    }

    if (currentUser.connections.includes(req.params.userId)) {
      return res.status(400).json({ message: 'Already connected' });
    }

    if (targetUser.connectionRequests.includes(req.userId)) {
      return res.status(400).json({ message: 'Connection request already sent' });
    }

    // Add connection request to target user
    targetUser.connectionRequests.push(req.userId);
    await targetUser.save();

    // Create notification for target user
    const notification = new Notification({
      recipient: req.params.userId,
      sender: req.userId,
      type: 'connection',
      content: 'wants to connect with you'
    });
    await notification.save();

    res.json({ message: 'Connection request sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept connection request
router.post('/connect/:userId/accept', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const requestingUser = await User.findById(req.params.userId);

    if (!requestingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there's a pending request
    if (!currentUser.connectionRequests.includes(req.params.userId)) {
      return res.status(400).json({ message: 'No connection request from this user' });
    }

    // Add to connections for both users
    currentUser.connections.push(req.params.userId);
    requestingUser.connections.push(req.userId);

    // Remove from connection requests
    currentUser.connectionRequests = currentUser.connectionRequests.filter(
      id => id.toString() !== req.params.userId
    );

    await currentUser.save();
    await requestingUser.save();

    // Delete the connection notification
    await Notification.deleteOne({
      recipient: req.userId,
      sender: req.params.userId,
      type: 'connection'
    });

    res.json({ message: 'Connection request accepted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject connection request
router.delete('/connect/:userId/reject', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);

    if (!currentUser.connectionRequests.includes(req.params.userId)) {
      return res.status(400).json({ message: 'No connection request from this user' });
    }

    // Remove from connection requests
    currentUser.connectionRequests = currentUser.connectionRequests.filter(
      id => id.toString() !== req.params.userId
    );

    await currentUser.save();

    // Delete the connection notification
    await Notification.deleteOne({
      recipient: req.userId,
      sender: req.params.userId,
      type: 'connection'
    });

    res.json({ message: 'Connection request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unconnect with user
router.delete('/connect/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.userId);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.connections = currentUser.connections.filter(
      id => id.toString() !== req.params.userId
    );
    targetUser.connections = targetUser.connections.filter(
      id => id.toString() !== req.userId
    );

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'Unconnected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
