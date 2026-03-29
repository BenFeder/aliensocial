import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI, commentsAPI, getImageUrl } from '../api';

const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const dateStr = date.toLocaleDateString();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} at ${timeStr}`;
};

const Post = ({ post: initialPost, currentUser, onDelete, onUpdate }) => {
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentContent, setCommentContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const handleLike = async () => {
    try {
      await postsAPI.likePost(post._id);
      const response = await postsAPI.getPost(post._id);
      setPost(response.data);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleEdit = async () => {
    try {
      const response = await postsAPI.updatePost(post._id, { content: editContent });
      setPost(response.data);
      setIsEditing(false);
      if (onUpdate) onUpdate(response.data);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await postsAPI.deletePost(post._id);
        if (onDelete) onDelete(post._id);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleShare = async () => {
    try {
      await postsAPI.sharePost(post._id, '');
      alert('Post shared to your profile!');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) return;

    try {
      const response = await commentsAPI.createComment({
        postId: post._id,
        content: commentContent
      });
      setPost({ ...post, comments: [...post.comments, response.data] });
      setCommentContent('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentsAPI.deleteComment(commentId);
        // Refresh comments from server to get updated list
        const response = await commentsAPI.getPostComments(post._id);
        setPost({ ...post, comments: response.data });
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleEditComment = async (commentId) => {
    try {
      await commentsAPI.updateComment(commentId, { content: editingCommentContent });
      // Refresh comments from server
      const response = await commentsAPI.getPostComments(post._id);
      setPost({ ...post, comments: response.data });
      setEditingCommentId(null);
      setEditingCommentContent('');
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleReply = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      await commentsAPI.createComment({
        postId: post._id,
        content: replyContent,
        parentCommentId
      });
      // Refresh comments from server to get updated list with replies
      const response = await commentsAPI.getPostComments(post._id);
      setPost({ ...post, comments: response.data });
      setReplyContent('');
      setReplyingToCommentId(null);
    } catch (error) {
      console.error('Error creating reply:', error);
    }
  };

  const displayPost = post.isShared && post.originalPost ? post.originalPost : post;

  // Determine what to display as the author
  const displayAuthor = post.postedAsPage && post.postedOnPage 
    ? { username: post.postedOnPage.name, avatar: post.postedOnPage.avatar, isPage: true }
    : { username: post.author.username, avatar: post.author.avatar, isPage: false };

  return (
    <div className="post">
      <div className="post-header">
        <img
          src={getImageUrl(displayAuthor.avatar) || 'https://via.placeholder.com/50'}
          alt={displayAuthor.username}
          className="post-avatar"
        />
        <div style={{ flex: 1 }}>
          <div className="post-author">{displayAuthor.username}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {formatDateTime(post.createdAt)}
          </div>
          {post.postedOnPage && !post.postedAsPage && (
            <div style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              marginTop: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              posted on 
              <img
                src={getImageUrl(post.postedOnPage.avatar) || 'https://via.placeholder.com/20'}
                alt={post.postedOnPage.name}
                style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '4px',
                  border: '1px solid var(--alien-green)',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/pages/${post.postedOnPage._id}`)}
              />
              <span 
                style={{ 
                  color: 'var(--alien-green)', 
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => navigate(`/pages/${post.postedOnPage._id}`)}
              >
                {post.postedOnPage.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {post.isShared && (
        <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Shared a post from {post.originalPost?.author?.username}
        </div>
      )}

      {isEditing ? (
        <div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          <button onClick={handleEdit}>Save</button>
          <button onClick={() => setIsEditing(false)} className="btn-secondary" style={{ marginLeft: '0.5rem' }}>
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div className="post-content">{displayPost.content}</div>
          
          {displayPost.image && (
            <img src={getImageUrl(displayPost.image)} alt="Post" className="post-media" />
          )}
          
          {displayPost.video && (
            <video controls className="post-media">
              <source src={getImageUrl(displayPost.video)} type="video/mp4" />
            </video>
          )}
        </>
      )}

      <div className="post-actions">
        {currentUser && <button onClick={handleLike}>👽 Like ({post.likes?.length || 0})</button>}
        {currentUser && <button onClick={() => setShowComments(!showComments)}>💬 Comment ({post.comments?.filter(c => !c.parentComment).length || 0})</button>}
        {currentUser && !post.isShared && <button onClick={handleShare}>🔄 Share</button>}
        {currentUser && (post.author._id === currentUser.id || post.author._id === currentUser._id) && !isEditing && (
          <>
            <button onClick={() => setIsEditing(true)}>✏️ Edit</button>
            <button onClick={handleDelete} className="btn-danger">🗑️ Delete</button>
          </>
        )}
      </div>

      {showComments && (
        <div style={{ marginTop: '1rem' }}>
          {currentUser && (
            <form onSubmit={handleComment} style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                style={{ width: '100%', marginBottom: '0.5rem' }}
              />
              <button type="submit">Post Comment</button>
            </form>
          )}

          {post.comments && post.comments.filter(c => !c.parentComment).map(comment => (
            <div key={comment._id} className="comment">
              <div className="comment-header">
                <img
                  src={getImageUrl(comment.author.avatar) || 'https://via.placeholder.com/30'}
                  alt={comment.author.username}
                  className="comment-avatar"
                />
                <span className="comment-author">{comment.author.username}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {formatDateTime(comment.createdAt)}
                </span>
              </div>
              
              {editingCommentId === comment._id ? (
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="text"
                    value={editingCommentContent}
                    onChange={(e) => setEditingCommentContent(e.target.value)}
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                  />
                  <button onClick={() => handleEditComment(comment._id)} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                    Save
                  </button>
                  <button 
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditingCommentContent('');
                    }} 
                    className="btn-secondary"
                    style={{ marginLeft: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="comment-content">
                    {comment.content}
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {currentUser && (
                      <button
                        onClick={() => {
                          setReplyingToCommentId(comment._id);
                          setReplyContent('');
                        }}
                        style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                      >
                        Reply
                      </button>
                    )}
                    {currentUser && (comment.author._id === currentUser.id || comment.author._id === currentUser._id) && (
                      <>
                        <button
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditingCommentContent(comment.content);
                          }}
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="btn-danger"
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyingToCommentId === comment._id && (
                    <form onSubmit={(e) => handleReply(e, comment._id)} style={{ marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder={`Reply to ${comment.author.username}...`}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                      />
                      <button type="submit" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                        Post Reply
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setReplyingToCommentId(null);
                          setReplyContent('');
                        }}
                        className="btn-secondary"
                        style={{ marginLeft: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Cancel
                      </button>
                    </form>
                  )}

                  {/* Display replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{ marginLeft: '2rem', marginTop: '0.5rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1rem' }}>
                      {comment.replies.map(reply => (
                        <div key={reply._id} className="comment" style={{ marginBottom: '0.5rem' }}>
                          <div className="comment-header">
                            <img
                              src={getImageUrl(reply.author.avatar) || 'https://via.placeholder.com/30'}
                              alt={reply.author.username}
                              className="comment-avatar"
                            />
                            <span className="comment-author">{reply.author.username}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              {formatDateTime(reply.createdAt)}
                            </span>
                          </div>
                          
                          {editingCommentId === reply._id ? (
                            <div style={{ marginTop: '0.5rem' }}>
                              <input
                                type="text"
                                value={editingCommentContent}
                                onChange={(e) => setEditingCommentContent(e.target.value)}
                                style={{ width: '100%', marginBottom: '0.5rem' }}
                              />
                              <button onClick={() => handleEditComment(reply._id)} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>
                                Save
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditingCommentContent('');
                                }} 
                                className="btn-secondary"
                                style={{ marginLeft: '0.5rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="comment-content">
                                {reply.content}
                              </div>
                              {currentUser && (reply.author._id === currentUser.id || reply.author._id === currentUser._id) && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(reply._id);
                                      setEditingCommentContent(reply.content);
                                    }}
                                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteComment(reply._id)}
                                    className="btn-danger"
                                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Post;
