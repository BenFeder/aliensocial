import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { postsAPI, pagesAPI } from '../api';

const CreatePost = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    content: '',
    image: null,
    video: null,
    pageId: ''
  });
  const [myPages, setMyPages] = useState([]);
  const [followedPages, setFollowedPages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadPages();
    }
  }, [user]);

  const loadPages = async () => {
    try {
      // Get pages owned by user
      const myPagesResponse = await pagesAPI.getPages(user.id);
      setMyPages(myPagesResponse.data);

      // Get all pages and filter for ones user follows
      const allPagesResponse = await pagesAPI.getPages();
      const followed = allPagesResponse.data.filter(page => 
        page.followers?.some(f => f._id === user.id) && page.owner._id !== user.id
      );
      setFollowedPages(followed);
    } catch (error) {
      console.error('Error loading pages:', error);
    }
  };

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
      if (formData.pageId) data.append('pageId', formData.pageId);

      await postsAPI.createPost(data);
      
      // Navigate to page if posted to page, otherwise to home
      if (formData.pageId) {
        navigate(`/pages/${formData.pageId}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  const allPages = [...myPages, ...followedPages];

  return (
    <div className="container">
      <div className="card">
        <h1 style={{ color: 'var(--alien-green)', marginBottom: '1.5rem' }}>Create Post</h1>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {allPages.length > 0 && (
            <>
              <label>Post To (optional)</label>
              <select
                name="pageId"
                value={formData.pageId}
                onChange={handleChange}
                style={{ marginBottom: '1rem' }}
              >
                <option value="">Your Feed</option>
                {myPages.length > 0 && (
                  <optgroup label="My Pages">
                    {myPages.map(page => (
                      <option key={page._id} value={page._id}>{page.name}</option>
                    ))}
                  </optgroup>
                )}
                {followedPages.length > 0 && (
                  <optgroup label="Pages You Follow">
                    {followedPages.map(page => (
                      <option key={page._id} value={page._id}>{page.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </>
          )}
          
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
