const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sanitizeUserAvatar } = require('../utils/avatarHelper');

// Get all conversations for the logged-in user
router.get('/conversations', auth, async (req, res) => {
  try {
    // Get all unique users the current user has messaged with
    const messages = await Message.find({
      $or: [{ sender: req.userId }, { recipient: req.userId }]
    }).sort({ createdAt: -1 });

    // Extract unique user IDs and get the latest message for each conversation
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const otherUserId = message.sender.toString() === req.userId 
        ? message.recipient.toString() 
        : message.sender.toString();
      
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, message);
      }
    });

    // Get user details for each conversation
    const conversations = await Promise.all(
      Array.from(conversationMap.entries()).map(async ([userId, lastMessage]) => {
        const user = await User.findById(userId).select('username avatar');
        const unreadCount = await Message.countDocuments({
          sender: userId,
          recipient: req.userId,
          read: false
        });
        
        return {
          user: sanitizeUserAvatar(user),
          lastMessage,
          unreadCount
        };
      })
    );

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/:userId', auth, async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    // Check if users are connected
    const currentUser = await User.findById(req.userId);
    const isConnected = currentUser.connections.includes(otherUserId);

    if (!isConnected) {
      return res.status(403).json({ message: 'You can only message your connections' });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: otherUserId },
        { sender: otherUserId, recipient: req.userId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'username avatar')
    .populate('recipient', 'username avatar');

    // Sanitize avatars
    const sanitizedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      msgObj.sender = sanitizeUserAvatar(msgObj.sender);
      msgObj.recipient = sanitizeUserAvatar(msgObj.recipient);
      return msgObj;
    });

    // Mark messages from the other user as read
    await Message.updateMany(
      { sender: otherUserId, recipient: req.userId, read: false },
      { read: true }
    );

    res.json(sanitizedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!content || !recipientId) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    // Check if sender and recipient are connected
    const sender = await User.findById(req.userId);
    const isConnected = sender.connections.includes(recipientId);

    if (!isConnected) {
      return res.status(403).json({ message: 'You can only message your connections' });
    }

    // Create the message
    const message = new Message({
      sender: req.userId,
      recipient: recipientId,
      content
    });

    await message.save();
    await message.populate('sender', 'username avatar');
    await message.populate('recipient', 'username avatar');

    // Sanitize avatars
    const sanitizedMessage = message.toObject();
    sanitizedMessage.sender = sanitizeUserAvatar(sanitizedMessage.sender);
    sanitizedMessage.recipient = sanitizeUserAvatar(sanitizedMessage.recipient);

    // Create a notification for the recipient
    const notification = new Notification({
      recipient: recipientId,
      sender: req.userId,
      type: 'message',
      message: message._id,
      content: content.substring(0, 100) // Preview of the message
    });

    await notification.save();

    res.status(201).json(sanitizedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      $or: [{ sender: req.userId }, { recipient: req.userId }]
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
