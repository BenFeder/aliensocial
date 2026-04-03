const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Notification = require('../models/Notification');
const PasswordReset = require('../models/PasswordReset');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sanitizeUserAvatar, sanitizeUsersAvatars } = require('../utils/avatarHelper');
const { sendPasswordResetEmail } = require('../utils/email');

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
        name: user.name,
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
        name: user.name,
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
      .populate('connections', 'username name avatar')
      .populate('connectionRequests', 'username name avatar')
      .populate('followedPages', 'name avatar');
    
    const sanitizedUser = sanitizeUserAvatar(user);
    sanitizedUser.connections = sanitizeUsersAvatars(sanitizedUser.connections);
    sanitizedUser.connectionRequests = sanitizeUsersAvatars(sanitizedUser.connectionRequests);
    
    res.json(sanitizedUser);
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
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } }
      ]
    })
      .select('username name avatar')
      .limit(10);

    res.json(sanitizeUsersAvatars(users));
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
      .populate('connections', 'username name avatar');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sanitizedUser = sanitizeUserAvatar(user);
    if (sanitizedUser.connections) {
      sanitizedUser.connections = sanitizeUsersAvatars(sanitizedUser.connections);
    }

    res.json(sanitizedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, name } = req.body;
    const user = await User.findById(req.userId);

    if (bio !== undefined) user.bio = bio;
    if (name !== undefined) user.name = name;

    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
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

// Forgot password - send reset email
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Enter a valid email')
], async (req, res) => {
  try {
    console.log('Forgot password request received for:', req.body.email);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    console.log('User found, creating reset token for:', user._id);

    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: user._id });

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log('Generated reset token');

    // Create password reset record (expires in 1 hour)
    const passwordReset = new PasswordReset({
      userId: user._id,
      token: resetToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });
    await passwordReset.save();
    console.log('Password reset record saved');

    // Send email with reset link
    await sendPasswordResetEmail(user.email, resetToken);
    console.log('Password reset email sent/logged');

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Reset password with token
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    console.log('Reset password request received for token:', req.params.token);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    // Find valid reset token
    const passwordReset = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() } // Not expired
    });

    if (!passwordReset) {
      console.log('Invalid or expired token:', token);
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    console.log('Valid token found for user:', passwordReset.userId);

    // Find user and update password
    const user = await User.findById(passwordReset.userId);
    if (!user) {
      console.log('User not found:', passwordReset.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password; // Will be hashed by pre-save hook
    await user.save();
    console.log('Password updated successfully for user:', user._id);

    // Delete the used reset token
    await PasswordReset.deleteOne({ _id: passwordReset._id });
    console.log('Reset token deleted');

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

// Change password (requires authentication)
router.put('/change-password', auth, [
  body('currentPassword').exists().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search taggable entities (connections and followed pages) for mentions
router.get('/mentions/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    // Get current user to access their connections and followed pages
    const currentUser = await User.findById(req.userId)
      .select('connections')
      .populate('connections', 'username name avatar');

    // Search in user's connections
    let connections;
    if (!q || q.trim().length < 1) {
      // Show all connections if no query
      connections = currentUser.connections;
    } else {
      // Filter by query
      connections = currentUser.connections.filter(user => {
        const username = user.username?.toLowerCase() || '';
        const name = user.name?.toLowerCase() || '';
        const query = q.toLowerCase();
        return username.includes(query) || name.includes(query);
      });
    }

    // Search in followed pages
    const Page = require('../models/Page');
    let followedPages;
    if (!q || q.trim().length < 1) {
      // Show all followed pages if no query
      followedPages = await Page.find({
        followers: req.userId
      })
        .select('name avatar')
        .limit(10);
    } else {
      // Filter by query
      followedPages = await Page.find({
        followers: req.userId,
        name: { $regex: q, $options: 'i' }
      })
        .select('name avatar')
        .limit(10);
    }

    // Format results - connections as users, pages as pages
    const userResults = connections.slice(0, 10).map(user => ({
      id: user._id,
      type: 'user',
      username: user.username,
      name: user.name || user.username,
      avatar: user.avatar
    }));

    const pageResults = followedPages.map(page => ({
      id: page._id,
      type: 'page',
      name: page.name,
      avatar: page.avatar
    }));

    // Combine and limit to 10 total results
    const results = [...userResults, ...pageResults].slice(0, 10);

    res.json(sanitizeUsersAvatars(results));
  } catch (error) {
    console.error('Mentions search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
