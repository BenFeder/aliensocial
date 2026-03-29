# AlienSocial.com

A full-featured social networking platform built with the MERN stack.

## Features

- User registration and authentication
- Profile management with avatars
- Create, edit, and delete posts (text, images, videos)
- Comment on posts
- Share posts
- Connect/unconnect with users
- Create and manage Pages
- Follow Pages
- Custom alien green theme

## Tech Stack

- **Frontend**: React, HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT

## Installation

1. Install dependencies:
   ```
   npm run install-all
   ```

2. Configure MongoDB connection in `.env` file

3. Run the application:
   ```
   npm run dev
   ```

4. Access at `http://localhost:3000`

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Backend server port (default: 5000)
