const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Create page
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Page name is required' });
    }

    const page = new Page({
      name,
      description: description || '',
      owner: req.userId
    });

    await page.save();
    await page.populate('owner', 'username avatar');

    res.status(201).json(page);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search pages
router.get('/search/pages', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    const pages = await Page.find({
      name: { $regex: q, $options: 'i' }
    })
      .select('name description avatar')
      .limit(10);

    res.json(pages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pages (or user's pages)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const query = userId ? { owner: userId } : {};
    const pages = await Page.find(query)
      .populate('owner', 'username avatar')
      .sort({ createdAt: -1 });

    res.json(pages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single page
router.get('/:id', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('followers', 'username avatar');

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update page
router.put('/:id', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    if (page.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    page.name = req.body.name || page.name;
    page.description = req.body.description !== undefined ? req.body.description : page.description;
    page.about = req.body.about !== undefined ? req.body.about : page.about;

    await page.save();
    await page.populate('owner', 'username avatar');

    res.json(page);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get page posts
router.get('/:id/posts', async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const posts = await Post.find({ postedOnPage: req.params.id })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .populate('postedOnPage', 'name avatar')
      .populate({
        path: 'comments',
        populate: [
          { path: 'author', select: 'username avatar' },
          {
            path: 'replies',
            populate: { path: 'author', select: 'username avatar' }
          }
        ]
      });

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete page
router.delete('/:id', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    if (page.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove page from all followers
    await User.updateMany(
      { followedPages: req.params.id },
      { $pull: { followedPages: req.params.id } }
    );

    await Page.findByIdAndDelete(req.params.id);

    res.json({ message: 'Page deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow page
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    const user = await User.findById(req.userId);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    if (page.followers.includes(req.userId)) {
      return res.status(400).json({ message: 'Already following this page' });
    }

    page.followers.push(req.userId);
    user.followedPages.push(req.params.id);

    await page.save();
    await user.save();

    res.json({ message: 'Following page' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfollow page
router.delete('/:id/follow', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    const user = await User.findById(req.userId);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    page.followers = page.followers.filter(id => id.toString() !== req.userId);
    user.followedPages = user.followedPages.filter(id => id.toString() !== req.params.id);

    await page.save();
    await user.save();

    res.json({ message: 'Unfollowed page' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update page avatar
router.post('/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    if (page.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    page.avatar = `/uploads/avatars/${req.file.filename}`;
    await page.save();

    res.json({ avatar: page.avatar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
