const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { sanitizeUserAvatar } = require('../utils/avatarHelper');

// Get all notifications for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.userId })
      .populate('sender', 'username avatar')
      .populate('post')
      .sort({ createdAt: -1 })
      .limit(50);

    // Sanitize avatars
    const sanitizedNotifications = notifications.map(notif => {
      const notifObj = notif.toObject();
      if (notifObj.sender) {
        notifObj.sender = sanitizeUserAvatar(notifObj.sender);
      }
      return notifObj;
    });

    res.json(sanitizedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      recipient: req.userId, 
      read: false 
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
