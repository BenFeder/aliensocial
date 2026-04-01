import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI, authAPI } from '../api';
import '../styles/Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    fetchCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getNotifications();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchCount = async () => {
    try {
      const response = await notificationsAPI.getCount();
      setCount(response.data.count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      await notificationsAPI.markAsRead(notification._id);
      
      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      setCount(prev => Math.max(0, prev - 1));

      // Navigate based on notification type
      if (notification.type === 'comment') {
        navigate('/'); // Navigate to feed where the post is
      } else if (notification.type === 'message') {
        navigate(`/messages/${notification.sender._id}`);
      } else if (notification.type === 'connection') {
        navigate('/connections');
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const handleAcceptConnection = async (notification, e) => {
    e.stopPropagation();
    try {
      await authAPI.acceptConnection(notification.sender._id);
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      setCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error accepting connection:', error);
    }
  };

  const handleRejectConnection = async (notification, e) => {
    e.stopPropagation();
    try {
      await authAPI.rejectConnection(notification.sender._id);
      setNotifications(prev => prev.filter(n => n._id !== notification._id));
      setCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error rejecting connection:', error);
    }
  };

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case 'comment':
        return `commented on your post: "${notification.content}"`;
      case 'message':
        return `sent you a message: "${notification.content}"`;
      case 'connection':
        return notification.content;
      default:
        return '';
    }
  };

  return (
    <div className="notifications-container" ref={dropdownRef}>
      <button className="notifications-button" onClick={handleToggle}>
        🔔
        {count > 0 && <span className="notification-badge">{count}</span>}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="notifications-header">
            <h3>Notifications</h3>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">No new notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-avatar">
                    {notification.sender.avatar ? (
                      <img src={notification.sender.avatar} alt={notification.sender.username} />
                    ) : (
                      <div className="avatar-placeholder">
                        {notification.sender.username[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="notification-content">
                    <p>
                      <strong>{notification.sender.username}</strong> {getNotificationText(notification)}
                    </p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {notification.type === 'connection' && (
                      <div className="connection-actions">
                        <button
                          className="accept-btn"
                          onClick={(e) => handleAcceptConnection(notification, e)}
                        >
                          Accept
                        </button>
                        <button
                          className="reject-btn"
                          onClick={(e) => handleRejectConnection(notification, e)}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
