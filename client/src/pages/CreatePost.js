import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../api';

const CreatePost = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    image: null,
    video: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    if (e.target.type === 'file') {
      setFormData({ ...formData, [e.target.name]: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.content && !formData.image && !formData.video) {
      setError('Post must have content, image, or video');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('content', formData.content);
      if (formData.image) data.append('image', formData.image);
      if (formData.video) data.append('video', formData.video);

      await postsAPI.createPost(data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ color: 'var(--alien-green)', marginBottom: '1.5rem' }}>Create Post</h1>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label>Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="What's on your mind?"
            rows="6"
          />
          
          <label>Image (optional)</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
          />
          
          <label>Video (optional)</label>
          <input
            type="file"
            name="video"
            accept="video/*"
            onChange={handleChange}
          />
          
          <button type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Create Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
