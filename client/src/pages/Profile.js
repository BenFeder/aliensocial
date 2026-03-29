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
  const [bio, setBio] = useState('');
  const [editingBio, setEditingBio] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      const userResponse = await authAPI.getUserByUsername(username);
      setUser(userResponse.data);
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

  const handleUpdateBio = async () => {
    try {
      await authAPI.updateProfile({ bio });
      setUser({ ...user, bio });
      setEditingBio(false);
      alert('Bio updated successfully!');
    } catch (error) {
      console.error('Error updating bio:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await authAPI.connect(user._id);
      alert('Connected successfully!');
      loadProfile();
    } catch (error) {
      console.error('Error connecting:', error);
      alert(error.response?.data?.message || 'Failed to connect');
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
          
          {editingBio && isOwnProfile ? (
            <div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength="500"
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <button onClick={handleUpdateBio}>Save Bio</button>
              <button onClick={() => setEditingBio(false)} className="btn-secondary" style={{ marginLeft: '0.5rem' }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="profile-bio">
              {user.bio || 'No bio yet'}
              {isOwnProfile && (
                <button onClick={() => setEditingBio(true)} style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem' }}>
                  Edit Bio
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
                <button onClick={handleUnconnect} className="btn-danger">
                  Unconnect
                </button>
              ) : (
                <button onClick={handleConnect}>
                  Connect
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
