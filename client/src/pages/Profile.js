import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { authAPI, postsAPI, getImageUrl } from '../api';
import Post from '../components/Post';
import AvatarEditor from '../components/AvatarEditor';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarFile, setAvatarFile] = useState(null);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const userResponse = await authAPI.getUserByUsername(username);
      setUser(userResponse.data);
      setName(userResponse.data.name || '');
      setBio(userResponse.data.bio || '');

      const postsResponse = await postsAPI.getUserPosts(username);
      setPosts(postsResponse.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      setAvatarFile(file);
      setShowAvatarEditor(true);
    }
  };

  const handleAvatarSave = async (positionedFile) => {
    const formData = new FormData();
    formData.append('avatar', positionedFile);

    try {
      const response = await authAPI.uploadAvatar(formData);
      setUser({ ...user, avatar: response.data.avatar });
      setAvatarFile(null);
      setShowAvatarEditor(false);
      alert('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    }
  };

  const handleAvatarCancel = () => {
    setAvatarFile(null);
    setShowAvatarEditor(false);
  };

  const handleUpdateProfile = async () => {
    try {
      await authAPI.updateProfile({ name, bio });
      setUser({ ...user, name, bio });
      setEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await authAPI.connect(user._id);
      alert('Connection request sent successfully!');
      loadProfile();
    } catch (error) {
      console.error('Error connecting:', error);
      alert(error.response?.data?.message || 'Failed to send connection request');
    }
  };

  const handleUnconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect?')) {
      try {
        await authAPI.unconnect(user._id);
        alert('Disconnected successfully!');
        loadProfile();
      } catch (error) {
        console.error('Error disconnecting:', error);
      }
    }
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handleSharePost = () => {
    // Refresh the profile to show updated share count
    loadProfile();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <div className="container">User not found</div>;
  }

  const isOwnProfile = currentUser && currentUser.username === username;
  const isConnected = currentUser && user.connections?.some(c => c._id === currentUser.id);

  return (
    <div className="container">
      <div className="profile-header">
        <img
          src={getImageUrl(user.avatar) || 'https://via.placeholder.com/150'}
          alt={user.username}
          className="avatar avatar-large"
        />
        <div className="profile-info">
          <h1>{user.username}</h1>
          {user.name && <h2 style={{ marginTop: '0.25rem', color: '#666', fontWeight: 'normal' }}>{user.name}</h2>}
          
          {editingProfile && isOwnProfile ? (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength="100"
                  placeholder="Enter your name"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '600' }}>Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength="500"
                  placeholder="Tell us about yourself"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
                />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <button onClick={handleUpdateProfile}>Save Profile</button>
                <button onClick={() => setEditingProfile(false)} className="btn-secondary" style={{ marginLeft: '0.5rem' }}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-bio">
              {user.bio || 'No bio yet'}
              {isOwnProfile && (
                <button onClick={() => setEditingProfile(true)} style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem' }}>
                  Edit Profile
                </button>
              )}
            </div>
          )}

          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-value">{posts.length}</div>
              <div className="profile-stat-label">Posts</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{user.connections?.length || 0}</div>
              <div className="profile-stat-label">Connections</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-value">{user.followedPages?.length || 0}</div>
              <div className="profile-stat-label">Followed Pages</div>
            </div>
          </div>

          {isOwnProfile && (
            <div style={{ marginTop: '1rem' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarSelect}
                id="avatar-upload"
                style={{ display: 'none' }}
              />
              <label htmlFor="avatar-upload">
                <button 
                  type="button"
                  onClick={() => document.getElementById('avatar-upload').click()}
                >
                  Change Avatar
                </button>
              </label>
            </div>
          )}

          {!isOwnProfile && currentUser && (
            <div style={{ marginTop: '1rem' }}>
              {isConnected ? (
                <>
                  <button onClick={handleUnconnect} className="btn-danger">
                    Remove Connection
                  </button>
                  <button 
                    onClick={() => window.location.href = `/messages/${user._id}`}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Send Message
                  </button>
                </>
              ) : (
                <button onClick={handleConnect}>
                  Send Connection Request
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <h2 style={{ color: 'var(--alien-green)', marginBottom: '1.5rem' }}>Posts</h2>
      
      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No posts yet</p>
        </div>
      ) : (
        posts.map(post => (
          <Post
            key={post._id}
            post={post}
            currentUser={currentUser}
            onDelete={handleDeletePost}
            onUpdate={handleUpdatePost}
            onShare={handleSharePost}
          />
        ))
      )}
      
      {showAvatarEditor && avatarFile && (
        <AvatarEditor
          imageFile={avatarFile}
          onSave={handleAvatarSave}
          onCancel={handleAvatarCancel}
        />
      )}
    </div>
  );
};

export default Profile;
