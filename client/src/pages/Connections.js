import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI, getImageUrl } from '../api';

const Connections = () => {
  const { user, loading, setUser } = useContext(AuthContext);
  const [connections, setConnections] = useState([]);
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

  const handleProfileClick = (username) => {
    navigate(`/${username}`);
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
      ) : connections.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>You don't have any connections yet. Use the search bar to find friends!</p>
        </div>
      ) : (
        <div className="card">
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
              <button
                onClick={() => handleRemoveConnection(connection._id)}
                className="btn-danger connection-remove-btn"
              >
                Remove Connection
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Connections;
