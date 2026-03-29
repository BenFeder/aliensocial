import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { postsAPI, pagesAPI } from '../api';
import Post from '../components/Post';

const Home = () => {
  const { user, loading } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [formData, setFormData] = useState({
    content: '',
    image: null,
    video: null,
    pageId: ''
  });
  const [myPages, setMyPages] = useState([]);
  const [followedPages, setFollowedPages] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadFeed();
      loadPages();
    }
  }, [user]);

  const loadFeed = async () => {
    try {
      const response = await postsAPI.getFeed();
      setPosts(response.data);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoadingPosts(false);
    }
  };

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

    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('content', formData.content);
      if (formData.image) data.append('image', formData.image);
      if (formData.video) data.append('video', formData.video);
      if (formData.pageId) data.append('pageId', formData.pageId);

      await postsAPI.createPost(data);
      
      // Reset form
      setFormData({
        content: '',
        image: null,
        video: null,
        pageId: ''
      });
      // Reset file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => input.value = '');
      
      // Reload feed to show new post
      loadFeed();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handleSharePost = () => {
    // Refresh the feed to show the newly shared post
    loadFeed();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const allPages = [...myPages, ...followedPages];

  return (
    <div className="container">
      <h1 style={{ color: 'var(--alien-green)', marginBottom: '2rem', textAlign: 'center' }}>
        Feed
      </h1>
      
      {/* Create Post Form */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--alien-green)', marginBottom: '1rem' }}>Create Post</h2>
        {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
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
            rows="4"
            style={{ marginBottom: '1rem' }}
          />
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 250px', minWidth: '0' }}>
              <label>Image (optional)</label>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleChange}
              />
            </div>
            
            <div style={{ flex: '1 1 250px', minWidth: '0' }}>
              <label>Video (optional)</label>
              <input
                type="file"
                name="video"
                accept="video/*"
                onChange={handleChange}
              />
            </div>
          </div>
          
          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Post'}
          </button>
        </form>
      </div>
      
      {loadingPosts ? (
        <div className="loading">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <p>No posts yet. Connect with users or create your first post!</p>
        </div>
      ) : (
        posts.map(post => (
          <Post
            key={post._id}
            post={post}
            currentUser={user}
            onDelete={handleDeletePost}
            onUpdate={handleUpdatePost}
            onShare={handleSharePost}
          />
        ))
      )}
    </div>
  );
};

export default Home;
