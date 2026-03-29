import React, { useState, useEffect, useContext } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { pagesAPI, postsAPI, getImageUrl } from '../api';
import Post from '../components/Post';

const PageView = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAboutEdit, setShowAboutEdit] = useState(false);
  const [aboutText, setAboutText] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postVideo, setPostVideo] = useState(null);
  const [postAsPage, setPostAsPage] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    loadPage();
    loadPosts();
  }, [id]);

  const loadPage = async () => {
    try {
      const pageResponse = await pagesAPI.getPage(id);
      setPage(pageResponse.data);
      setIsFollowing(pageResponse.data.followers?.some(f => f._id === user?.id || f._id === user?._id));
      setAboutText(pageResponse.data.about || '');
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const postsResponse = await pagesAPI.getPagePosts(id);
      setPosts(postsResponse.data);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleFollow = async () => {
    try {
      await pagesAPI.followPage(id);
      setIsFollowing(true);
      loadPage();
    } catch (error) {
      console.error('Error following page:', error);
    }
  };

  const handleUnfollow = async () => {
    try {
      await pagesAPI.unfollowPage(id);
      setIsFollowing(false);
      loadPage();
    } catch (error) {
      console.error('Error unfollowing page:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        await pagesAPI.deletePage(id);
        navigate('/pages');
      } catch (error) {
        console.error('Error deleting page:', error);
      }
    }
  };

  const handleUpdateAbout = async () => {
    try {
      await pagesAPI.updatePage(id, { about: aboutText });
      setShowAboutEdit(false);
      loadPage();
    } catch (error) {
      console.error('Error updating about:', error);
    }
  };

  const handleUploadAvatar = async (e) => {
    e.preventDefault();
    
    if (!avatarFile) {
      alert('Please select an image');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      await pagesAPI.uploadPageAvatar(id, formData);
      setAvatarFile(null);
      setShowAvatarUpload(false);
      loadPage();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar');
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    
    if (!postContent && !postImage && !postVideo) {
      alert('Post must have content, image, or video');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('content', postContent);
      formData.append('pageId', id);
      formData.append('postAsPage', postAsPage ? 'true' : 'false');
      
      console.log('Sending postAsPage:', postAsPage ? 'true' : 'false');
      console.log('Sending pageId:', id);
      
      if (postImage) {
        formData.append('image', postImage);
      }
      if (postVideo) {
        formData.append('video', postVideo);
      }

      await postsAPI.createPost(formData);
      setPostContent('');
      setPostImage(null);
      setPostVideo(null);
      setPostAsPage(false);
      setShowPostForm(false);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      alert(error.response?.data?.message || 'Failed to create post');
    }
  };

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!page) {
    return (
      <div className="container">
        <div className="card">Page not found</div>
      </div>
    );
  }

  const isOwner = page.owner._id === user.id || page.owner._id === user._id;
  const canPost = true; // All users can post on pages

  return (
    <div className="container">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem' }}>
          <img
            src={getImageUrl(page.avatar) || 'https://via.placeholder.com/150'}
            alt={page.name}
            style={{ 
              width: '150px', 
              height: '150px', 
              borderRadius: '10px', 
              border: '2px solid var(--alien-green)',
              objectFit: 'cover'
            }}
          />
          <div style={{ flex: 1 }}>
            <h1 style={{ color: 'var(--alien-green)', marginBottom: '1rem' }}>
              {page.name}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '1.1rem' }}>
              {page.description}
            </p>
            <div style={{ 
              display: 'flex', 
              gap: '2rem', 
              marginBottom: '1rem',
              fontSize: '0.95rem',
              color: 'var(--text-secondary)'
            }}>
              <span>{page.followers?.length || 0} followers</span>
              <span>Owned by <span 
                style={{ color: 'var(--alien-green)', cursor: 'pointer' }}
                onClick={() => navigate(`/${page.owner.username}`)}
              >
                {page.owner.username}
              </span></span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {isOwner ? (
                <>
                  <button onClick={handleDelete} className="btn-danger">
                    Delete Page
                  </button>
                </>
              ) : (
                <>
                  {isFollowing ? (
                    <button onClick={handleUnfollow} className="btn-secondary">
                      Unfollow
                    </button>
                  ) : (
                    <button onClick={handleFollow}>
                      Follow
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Upload Section */}
      {isOwner && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ color: 'var(--light-green)', margin: 0 }}>Page Avatar</h2>
            {!showAvatarUpload && (
              <button onClick={() => setShowAvatarUpload(true)} className="btn-secondary">
                Change Avatar
              </button>
            )}
          </div>
          {showAvatarUpload && (
            <form onSubmit={handleUploadAvatar}>
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files[0])}
                />
              </div>
              {avatarFile && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Selected: {avatarFile.name}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit">Upload</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAvatarUpload(false);
                    setAvatarFile(null);
                  }} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* About Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--light-green)', margin: 0 }}>About</h2>
          {isOwner && !showAboutEdit && (
            <button onClick={() => setShowAboutEdit(true)} className="btn-secondary">
              Edit
            </button>
          )}
        </div>
        {showAboutEdit ? (
          <div>
            <textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Tell people about this page..."
              rows="6"
              style={{ width: '100%', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={handleUpdateAbout}>Save</button>
              <button onClick={() => setShowAboutEdit(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
            {page.about || 'No information provided yet.'}
          </p>
        )}
      </div>

      {/* Create Post Section */}
      {canPost && (
        <div className="card">
          {!showPostForm ? (
            <button onClick={() => setShowPostForm(true)} style={{ width: '100%' }}>
              Create Post on {page.name}
            </button>
          ) : (
            <form onSubmit={handleCreatePost}>
              <h3 style={{ color: 'var(--light-green)', marginBottom: '1rem' }}>
                Create Post
              </h3>
              <textarea
                placeholder="What's on your mind?"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                rows="4"
                style={{ marginBottom: '1rem' }}
              />
              <div style={{ marginBottom: '1rem' }}>
                <label>Image (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPostImage(e.target.files[0])}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label>Video (optional)</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setPostVideo(e.target.files[0])}
                />
              </div>
              {isOwner && (
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="postAsPageCheckbox"
                    checked={postAsPage}
                    onChange={(e) => setPostAsPage(e.target.checked)}
                  />
                  <label htmlFor="postAsPageCheckbox" style={{ cursor: 'pointer', margin: 0 }}>
                    Post as <span style={{ color: 'var(--alien-green)' }}>{page.name}</span>
                  </label>
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit">Post</button>
                <button 
                  type="button" 
                  onClick={() => setShowPostForm(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <h2 style={{ color: 'var(--light-green)', marginTop: '2rem', marginBottom: '1rem' }}>
        Posts
      </h2>
      {posts.length === 0 ? (
        <div className="card">No posts yet.</div>
      ) : (
        posts.map(post => (
          <Post key={post._id} post={post} currentUser={user} onDelete={loadPosts} onUpdate={loadPosts} />
        ))
      )}
    </div>
  );
};

export default PageView;
