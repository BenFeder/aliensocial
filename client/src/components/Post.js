import React, { useState } from 'react';
import { postsAPI, commentsAPI, getImageUrl } from '../api';

const Post = ({ post: initialPost, currentUser, onDelete, onUpdate }) => {
  const [post, setPost] = useState(initialPost);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [commentContent, setCommentContent] = useState('');
  const [showComments, setShowComments] = useState(false);

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
        setPost({
          ...post,
          comments: post.comments.filter(c => c._id !== commentId)
        });
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const displayPost = post.isShared && post.originalPost ? post.originalPost : post;

  return (
    <div className="post">
      <div className="post-header">
        <img
          src={getImageUrl(post.author.avatar) || 'https://via.placeholder.com/50'}
          alt={post.author.username}
          className="post-avatar"
        />
        <div>
          <div className="post-author">{post.author.username}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {new Date(post.createdAt).toLocaleDateString()}
          </div>
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
        {currentUser && <button onClick={() => setShowComments(!showComments)}>💬 Comment ({post.comments?.length || 0})</button>}
        {currentUser && !post.isShared && <button onClick={handleShare}>🔄 Share</button>}
        {currentUser && post.author._id === currentUser.id && !isEditing && (
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

          {post.comments && post.comments.map(comment => (
            <div key={comment._id} className="comment">
              <div className="comment-header">
                <img
                  src={getImageUrl(comment.author.avatar) || 'https://via.placeholder.com/30'}
                  alt={comment.author.username}
                  className="comment-avatar"
                />
                <span className="comment-author">{comment.author.username}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="comment-content">
                {comment.content}
                {currentUser && comment.author._id === currentUser.id && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="btn-danger"
                    style={{ marginLeft: '1rem', padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Post;
