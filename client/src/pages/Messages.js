import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { messagesAPI, authAPI } from '../api';
import '../styles/Messages.css';

const Messages = () => {
  const { userId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conversations');

  useEffect(() => {
    fetchConversations();
    fetchConnections();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchMessages(userId);
    }
  }, [userId]);

  const fetchConversations = async () => {
    try {
      const response = await messagesAPI.getConversations();
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const response = await messagesAPI.getMessages(otherUserId);
      setMessages(response.data);
      
      const conversation = conversations.find(c => c.user._id === otherUserId);
      if (conversation) {
        setSelectedConversation(conversation.user);
      } else {
        const userResponse = await authAPI.getUserByUsername(otherUserId);
        setSelectedConversation(userResponse.data);
      }

      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-content');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 403) {
        alert('You can only message your connections');
        navigate('/messages');
      }
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await messagesAPI.sendMessage({
        recipientId: selectedConversation._id,
        content: newMessage
      });

      setMessages([...messages, response.data]);
      setNewMessage('');

      fetchConversations();
      fetchConnections();

      setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-content');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status === 403) {
        alert('You can only message your connections');
      }
    }
  };

  const handleConversationClick = (conversation) => {
    navigate(`/messages/${conversation.user._id}`);
    setSelectedConversation(conversation.user);
    fetchMessages(conversation.user._id);
  };

  const handleConnectionClick = (connection) => {
    navigate(`/messages/${connection._id}`);
    setSelectedConversation(connection);
    fetchMessages(connection._id);
  };

  if (loading) {
    return <div className="messages-page">Loading...</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h2>Messages</h2>
            <div className="conversations-tabs">
              <button
                className={`tab-button ${activeTab === 'conversations' ? 'active' : ''}`}
                onClick={() => setActiveTab('conversations')}
              >
                Chats
              </button>
              <button
                className={`tab-button ${activeTab === 'connections' ? 'active' : ''}`}
                onClick={() => setActiveTab('connections')}
              >
                Connections
              </button>
            </div>
          </div>
          <div className="conversations-list">
            {activeTab === 'conversations' ? (
              conversations.length === 0 ? (
                <div className="no-conversations">
                  <p>No messages yet</p>
                  <p className="hint">Click on Connections tab to start a chat!</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.user._id}
                    className={`conversation-item ${
                      selectedConversation?._id === conversation.user._id ? 'active' : ''
                    }`}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className="conversation-avatar">
                      {conversation.user.avatar ? (
                        <img src={conversation.user.avatar} alt={conversation.user.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {conversation.user.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-username">
                        {conversation.user.username}
                        {conversation.unreadCount > 0 && (
                          <span className="unread-badge">{conversation.unreadCount}</span>
                        )}
                      </div>
                      <div className="conversation-preview">
                        {conversation.lastMessage.content.substring(0, 40)}
                        {conversation.lastMessage.content.length > 40 ? '...' : ''}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              connections.length === 0 ? (
                <div className="no-conversations">
                  <p>No connections yet</p>
                  <p className="hint">Connect with users to start messaging!</p>
                </div>
              ) : (
                connections.map((connection) => (
                  <div
                    key={connection._id}
                    className={`conversation-item ${
                      selectedConversation?._id === connection._id ? 'active' : ''
                    }`}
                    onClick={() => handleConnectionClick(connection)}
                  >
                    <div className="conversation-avatar">
                      {connection.avatar ? (
                        <img src={connection.avatar} alt={connection.username} />
                      ) : (
                        <div className="avatar-placeholder">
                          {connection.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-username">
                        {connection.username}
                      </div>
                      <div className="conversation-preview">
                        Click to start a conversation
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        <div className="messages-main">
          {selectedConversation ? (
            <>
              <div className="messages-header">
                <div className="message-user-info">
                  {selectedConversation.avatar ? (
                    <img src={selectedConversation.avatar} alt={selectedConversation.username} />
                  ) : (
                    <div className="avatar-placeholder">
                      {selectedConversation.username[0].toUpperCase()}
                    </div>
                  )}
                  <h3>{selectedConversation.username}</h3>
                </div>
              </div>
              <div className="messages-content">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`message ${
                      message.sender._id === user.id ? 'message-sent' : 'message-received'
                    }`}
                  >
                    <div className="message-bubble">
                      <p>{message.content}</p>
                      <span className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </>
          ) : (
            <div className="no-conversation-selected">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
