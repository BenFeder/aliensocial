import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { postsAPI } from '../api';
import Post from '../components/Post';

const Home = () => {
  const { user, loading } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (user) {
      loadFeed();
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

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleUpdatePost = (updatedPost) => {
    setPosts(posts.map(p => p._id === updatedPost._id ? updatedPost : p));
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
        Your Feed
      </h1>
      
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
          />
        ))
      )}
    </div>
  );
};

export default Home;
