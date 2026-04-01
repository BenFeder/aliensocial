import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI, getImageUrl } from '../api';

const Connections = () => {
  const { user, loading, setUser } = useContext(AuthContext);
  const [connections, setConnections] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setConnections(response.data.connections || []);
      setConnectionRequests(response.data.connectionRequests || []);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (window.confirm('Are you sure you want to remove this connection?')) {
      try {
        await authAPI.unconnect(connectionId);
        setConnections(connections.filter(conn => conn._id !== connectionId));
        
        // Update user context
        const response = await authAPI.getCurrentUser();
        setUser({
          ...user,
          connections: response.data.connections
        });
      } catch (error) {
        console.error('Error removing connection:', error);
        alert('Failed to remove connection');
      }
    }
  };

  const handleAcceptRequest = async (userId) => {
    try {
      await authAPI.acceptConnection(userId);
      setConnectionRequests(connectionRequests.filter(req => req._id !== userId));
      loadConnections(); // Reload to update connections list
    } catch (error) {
      console.error('Error accepting connection:', error);
      alert('Failed to accept connection');
    }
  };

  const handleRejectRequest = async (userId) => {
    try {
      await authAPI.rejectConnection(userId);
      setConnectionRequests(connectionRequests.filter(req => req._id !== userId));
    } catch (error) {
      console.error('Error rejecting connection:', error);
      alert('Failed to reject connection');
    }
  };

  const handleProfileClick = (username) => {
    navigate(`/${username}`);
  };

  const handleMessageClick = (userId) => {
    navigate(`/messages/${userId}`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container">
      <h1 style={{ color: 'var(--alien-green)', marginBottom: '2rem', textAlign: 'center' }}>
        Your Connections
      </h1>

      {loadingConnections ? (
        <div className="loading">Loading connections...</div>
      ) : (
        <>
          {/* Connection Requests */}
          {connectionRequests.length > 0 && (
            <div className="card" style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '1rem', color: '#667eea' }}>Connection Requests</h2>
              {connectionRequests.map((request) => (
                <div key={request._id} className="connection-item">
                  <div className="connection-info" onClick={() => handleProfileClick(request.username)}>
                    <img
                      src={getImageUrl(request.avatar) || 'https://via.placeholder.com/50'}
                      alt={request.username}
                      className="connection-avatar"
                    />
                    <span className="connection-username">{request.username}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className="btn-primary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className="btn-danger"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Connections List */}
          {connections.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p>You don't have any connections yet. Use the search bar to find friends!</p>
            </div>
          ) : (
            <div className="card">
              <h2 style={{ marginBottom: '1rem', color: '#667eea' }}>My Connections</h2>
              {connections.map((connection) => (
                <div key={connection._id} className="connection-item">
                  <div className="connection-info" onClick={() => handleProfileClick(connection.username)}>
                    <img
                      src={getImageUrl(connection.avatar) || 'https://via.placeholder.com/50'}
                      alt={connection.username}
                      className="connection-avatar"
                    />
                    <span className="connection-username">{connection.username}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleMessageClick(connection._id)}
                      className="btn-primary"
                      style={{ padding: '0.5rem 1rem' }}
                    >
                      Message
                    </button>
                    <button
                      onClick={() => handleRemoveConnection(connection._id)}
                      className="btn-danger connection-remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Connections;
