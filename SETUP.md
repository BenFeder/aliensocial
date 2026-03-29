# AlienSocialNetwork.com - Setup Instructions

## Prerequisites

1. Node.js (v14 or higher)
2. MongoDB (local installation or MongoDB Atlas account)
3. npm or yarn package manager

## Installation Steps

### 1. Install Backend Dependencies

Open a terminal in the project root directory:

```bash
cd C:\Users\Bball\AlienSocial
npm install
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 3. Configure MongoDB

Option A - Local MongoDB:
- Ensure MongoDB is installed and running on your machine
- The default connection string in `.env` is `mongodb://localhost:27017/aliensocial`

Option B - MongoDB Atlas:
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in the `.env` file

### 4. Update Environment Variables

Edit the `.env` file in the root directory:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key_here_change_in_production
PORT=5000
NODE_ENV=development
```

### 5. Run the Application

Open TWO terminal windows:

Terminal 1 (Backend):
```bash
cd C:\Users\Bball\AlienSocial
npm run server
```

Terminal 2 (Frontend):
```bash
cd C:\Users\Bball\AlienSocial
npm run client
```

Alternatively, run both simultaneously:
```bash
npm run dev
```

### 6. Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Features Overview

### User Features
- ✅ Register with email, username, and password (one account per email)
- ✅ Login/Logout functionality
- ✅ Profile at aliensocialnetwork.com/username
- ✅ Upload and update avatar
- ✅ Edit bio

### Social Features
- ✅ Create posts with text, images, or videos
- ✅ Edit and delete own posts
- ✅ Comment on posts from connected users
- ✅ Edit and delete own comments
- ✅ Share posts to your profile
- ✅ Like posts
- ✅ Connect/Unconnect with users

### Pages
- ✅ Create and manage your own Pages
- ✅ Follow/Unfollow other Pages
- ✅ Delete Pages you own

### Design
- 🎨 Alien green (#39ff14) primary color
- 🎨 Light green (#7fff00) secondary color
- 🎨 Chromium silver (#c0c0c0) tertiary color
- 🎨 Dark theme with glowing effects

## Project Structure

```
AlienSocial/
├── server/                 # Backend
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth, upload middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   └── server.js          # Express server
├── client/                # Frontend
│   ├── public/
│   └── src/
│       ├── components/    # React components
│       ├── context/       # Auth context
│       ├── pages/         # Page components
│       ├── api.js         # API utilities
│       └── App.js         # Main app
├── uploads/               # Uploaded files (auto-created)
├── .env                   # Environment variables
└── package.json           # Dependencies

```

## API Endpoints

### Users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/me` - Get current user
- `GET /api/users/:username` - Get user by username
- `PUT /api/users/profile` - Update profile
- `POST /api/users/avatar` - Upload avatar
- `POST /api/users/connect/:userId` - Connect with user
- `DELETE /api/users/connect/:userId` - Unconnect from user

### Posts
- `POST /api/posts` - Create post
- `GET /api/posts/feed` - Get feed
- `GET /api/posts/user/:username` - Get user's posts
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/share` - Share post
- `POST /api/posts/:id/like` - Like/unlike post

### Comments
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `GET /api/comments/post/:postId` - Get post comments

### Pages
- `POST /api/pages` - Create page
- `GET /api/pages` - Get all pages
- `GET /api/pages/:id` - Get single page
- `PUT /api/pages/:id` - Update page
- `DELETE /api/pages/:id` - Delete page
- `POST /api/pages/:id/follow` - Follow page
- `DELETE /api/pages/:id/follow` - Unfollow page

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify network access for MongoDB Atlas

### Port Already in Use
- Change PORT in `.env` for backend
- Frontend uses port 3000 by default

### File Upload Issues
- Ensure `uploads` directories are created
- Check file size limits (default: 50MB)

## Security Notes

⚠️ **Important for Production:**
1. Change `JWT_SECRET` to a strong, random string
2. Use environment variables for sensitive data
3. Enable HTTPS
4. Add rate limiting
5. Implement proper error handling
6. Add input sanitization
7. Set up CORS properly for your domain

## Support

For issues or questions, please refer to the documentation or create an issue in the project repository.

Enjoy AlienSocial! 👽🚀
