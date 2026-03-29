const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create post
router.post('/', auth, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content && !req.files?.image && !req.files?.video) {
      return res.status(400).json({ message: 'Post must have content, image, or video' });
    }

    const post = new Post({
      author: req.userId,
      content: content || ''
    });

    if (req.files?.image) {
      const imageFile = req.files.image[0];
      // Cloudinary provides URL in path, local storage uses filename
      post.image = (imageFile.path && imageFile.path.startsWith('http')) 
        ? imageFile.path 
        : `/uploads/posts/images/${imageFile.filename}`;
    }
    if (req.files?.video) {
      const videoFile = req.files.video[0];
      // Cloudinary provides URL in path, local storage uses filename
      post.video = (videoFile.path && videoFile.path.startsWith('http'))
        ? videoFile.path
        : `/uploads/posts/videos/${videoFile.filename}`;
    }

    await post.save();
    await post.populate('author', 'username avatar');

    res.status(201).json(post);
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get feed (posts from connections)
router.get('/feed', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const connectionIds = [...user.connections, req.userId];

    const posts = await Post.find({ author: { $in: connectionIds } })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'username avatar' }
      })
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username avatar' },
        options: { sort: { createdAt: 1 } }
      })
      .limit(50);

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const posts = await Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'username avatar' }
      })
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username avatar' },
        options: { sort: { createdAt: 1 } }
      });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate({
        path: 'originalPost',
        populate: { path: 'author', select: 'username avatar' }
      })
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username avatar' },
        options: { sort: { createdAt: 1 } }
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.content = req.body.content || post.content;
    post.updatedAt = Date.now();

    await post.save();
    await post.populate('author', 'username avatar');

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete all comments associated with this post
    await Comment.deleteMany({ post: req.params.id });

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share post
router.post('/:id/share', auth, async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);

    if (!originalPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const sharedPost = new Post({
      author: req.userId,
      content: req.body.content || '',
      isShared: true,
      originalPost: req.params.id
    });

    await sharedPost.save();
    await sharedPost.populate('author', 'username avatar');
    await sharedPost.populate({
      path: 'originalPost',
      populate: { path: 'author', select: 'username avatar' }
    });

    // Add to shares array
    originalPost.shares.push({ user: req.userId });
    await originalPost.save();

    res.status(201).json(sharedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.likes.includes(req.userId)) {
      post.likes = post.likes.filter(id => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    res.json({ likes: post.likes.length, liked: post.likes.includes(req.userId) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
