import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { pagesAPI, getImageUrl } from '../api';

const Pages = () => {
  const { user } = useContext(AuthContext);
  const [pages, setPages] = useState([]);
  const [myPages, setMyPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadPages();
    }
  }, [user]);

  const loadPages = async () => {
    try {
      const allPagesResponse = await pagesAPI.getPages();
      const myPagesResponse = await pagesAPI.getPages(user.id);
      
      setPages(allPagesResponse.data);
      setMyPages(myPagesResponse.data);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await pagesAPI.createPage(formData);
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
      loadPages();
      alert('Page created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create page');
    }
  };

  const handleFollowPage = async (pageId) => {
    try {
      await pagesAPI.followPage(pageId);
      loadPages();
      alert('Following page!');
    } catch (error) {
      console.error('Error following page:', error);
      alert(error.response?.data?.message || 'Failed to follow page');
    }
  };

  const handleUnfollowPage = async (pageId) => {
    try {
      await pagesAPI.unfollowPage(pageId);
      loadPages();
      alert('Unfollowed page!');
    } catch (error) {
      console.error('Error unfollowing page:', error);
    }
  };

  const handleDeletePage = async (pageId) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        await pagesAPI.deletePage(pageId);
        loadPages();
        alert('Page deleted!');
      } catch (error) {
        console.error('Error deleting page:', error);
      }
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ color: 'var(--alien-green)', marginBottom: '2rem' }}>Pages</h1>

      <div style={{ marginBottom: '2rem' }}>
        <button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Cancel' : 'Create New Page'}
        </button>
      </div>

      {showCreateForm && (
        <div className="card">
          <h2 style={{ color: 'var(--light-green)', marginBottom: '1rem' }}>Create Page</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleCreatePage}>
            <label>Page Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
            />
            <button type="submit">Create Page</button>
          </form>
        </div>
      )}

      <h2 style={{ color: 'var(--light-green)', marginTop: '2rem', marginBottom: '1rem' }}>
        My Pages ({myPages.length})
      </h2>
      {myPages.length === 0 ? (
        <div className="card">No pages yet. Create your first page!</div>
      ) : (
        myPages.map(page => (
          <div key={page._id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={getImageUrl(page.avatar) || 'https://via.placeholder.com/80'}
                alt={page.name}
                style={{ width: '80px', height: '80px', borderRadius: '10px', border: '2px solid var(--alien-green)' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'var(--alien-green)' }}>{page.name}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{page.description}</p>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {page.followers?.length || 0} followers
                </div>
              </div>
              <div>
                <button onClick={() => handleDeletePage(page._id)} className="btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      <h2 style={{ color: 'var(--light-green)', marginTop: '2rem', marginBottom: '1rem' }}>
        All Pages ({pages.length})
      </h2>
      {pages.map(page => {
        const isOwnPage = page.owner._id === user.id;
        const isFollowing = user.followedPages?.includes(page._id);

        return (
          <div key={page._id} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={getImageUrl(page.avatar) || 'https://via.placeholder.com/80'}
                alt={page.name}
                style={{ width: '80px', height: '80px', borderRadius: '10px', border: '2px solid var(--alien-green)' }}
              />
              <div style={{ flex: 1 }}>
                <h3 style={{ color: 'var(--alien-green)' }}>{page.name}</h3>
                <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>{page.description}</p>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {page.followers?.length || 0} followers • Owned by {page.owner.username}
                </div>
              </div>
              {!isOwnPage && (
                <div>
                  {isFollowing ? (
                    <button onClick={() => handleUnfollowPage(page._id)} className="btn-secondary">
                      Unfollow
                    </button>
                  ) : (
                    <button onClick={() => handleFollowPage(page._id)}>
                      Follow
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Pages;
