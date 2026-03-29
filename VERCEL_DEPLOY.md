# Deploy Full Stack to Vercel

## 🎯 Overview
Deploy both frontend (React) and backend (Express) on Vercel as a single application.

---

## 📋 Prerequisites

### 1. MongoDB Atlas Setup (5 minutes)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account + cluster
3. Click "Connect" → "Connect your application"
4. Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/aliensocial`
5. Replace `<password>` with your actual database password
6. **Whitelist all IPs**: Network Access → Add IP → `0.0.0.0/0` (allows Vercel to connect)

### 2. GitHub Repository
If not already pushed:
```bash
git init
git add .
git commit -m "Ready for Vercel deployment"
git remote add origin https://github.com/yourusername/aliensocial.git
git branch -M main
git push -u origin main
```

---

## 🚀 Deploy to Vercel

### Step 1: Import Project
1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect the settings

### Step 2: Configure Build Settings
- **Framework Preset**: Other (or leave auto-detected)
- **Root Directory**: `./` (leave as root)
- **Build Command**: Leave default or use `npm run build:vercel` if you add it
- **Output Directory**: Leave default
- **Install Command**: `npm install`

### Step 3: Set Environment Variables
Click "Environment Variables" and add:

**Required:**
- `MONGODB_URI` = `mongodb+srv://username:password@cluster.mongodb.net/aliensocial`
- `JWT_SECRET` = `your-super-secret-random-string` (generate a long random string)

**Optional:**
- `NODE_ENV` = `production` (usually auto-set)

**Important:** Add these to all environments (Production, Preview, Development)

### Step 4: Deploy!
Click "Deploy" and wait 2-3 minutes.

---

## 🌐 Configure Custom Domain

### Step 1: Add Domain in Vercel
1. Go to your project → "Settings" → "Domains"
2. Add `aliensocial.com`
3. Add `www.aliensocial.com`

### Step 2: Configure DNS
Go to your domain registrar (Namecheap, GoDaddy, etc.) and add:

**For apex domain (aliensocial.com):**
- Type: `A`
- Name: `@`
- Value: `76.76.19.19`

**For www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `cname.vercel-dns.com`

### Step 3: Wait for Propagation
DNS changes can take 1-48 hours to propagate worldwide.

---

## ⚠️ Important: File Upload Issue

**Problem:** Vercel uses serverless functions with read-only filesystem. File uploads won't persist.

**Solution: Use Cloudinary (Free)**

### Install Cloudinary
```bash
npm install cloudinary multer-storage-cloudinary
```

### Update Upload Middleware
Create or update `server/middleware/upload.js`:

```javascript
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Avatar storage
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aliensocial/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Post image storage
const postImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aliensocial/posts/images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
  }
});

// Post video storage
const postVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aliensocial/posts/videos',
    allowed_formats: ['mp4', 'mov', 'avi'],
    resource_type: 'video'
  }
});

const avatarUpload = multer({ storage: avatarStorage });
const postImageUpload = multer({ storage: postImageStorage });
const postVideoUpload = multer({ storage: postVideoStorage });

module.exports = {
  avatarUpload,
  postImageUpload,
  postVideoUpload
};
```

### Add Cloudinary Credentials to Vercel
Go to Vercel → Settings → Environment Variables and add:
- `CLOUDINARY_CLOUD_NAME` = your_cloud_name
- `CLOUDINARY_API_KEY` = your_api_key
- `CLOUDINARY_API_SECRET` = your_api_secret

Get these from [cloudinary.com](https://cloudinary.com) (free account).

---

## 🧪 Testing Your Deployment

1. Visit your Vercel URL (e.g., `https://aliensocial.vercel.app`)
2. Try registering a new user
3. Try logging in
4. Create a post
5. Upload an image (after Cloudinary setup)
6. Check browser console for errors
7. Check Vercel logs: Project → Deployments → Click deployment → "Functions" tab

---

## 🔧 Troubleshooting

### API Returns 404
- Check `vercel.json` routes configuration
- Ensure `/api/*` requests are routed to `server/server.js`
- Check Vercel function logs

### Database Connection Failed
- Verify `MONGODB_URI` is correct in Vercel environment variables
- Make sure MongoDB Atlas allows connections from `0.0.0.0/0`
- Check MongoDB Atlas cluster is running

### File Uploads Not Working
- This is expected without Cloudinary on Vercel
- Follow Cloudinary setup above
- Serverless functions have read-only filesystem

### CORS Errors
- Should not occur since frontend and backend are on same domain
- If issues persist, check `server/server.js` CORS configuration

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try running `npm install` locally to catch dependency issues

---

## 📊 What You Get (Free Tier)

✅ **Included:**
- Unlimited deployments
- Automatic HTTPS/SSL
- Global CDN
- Automatic Git integration
- Preview deployments for PRs
- 100 GB bandwidth/month
- Serverless functions

⚠️ **Limitations:**
- Serverless functions timeout (10s on free tier, 60s on Pro)
- Read-only filesystem (need external storage for uploads)
- 512 MB function size limit

---

## 💰 Cost Estimate

**Free to Start:**
- Vercel: Free tier (hobby)
- MongoDB Atlas: Free tier (512 MB)
- Cloudinary: Free tier (25 GB storage, 25 GB bandwidth/month)
- Domain: ~$10-15/year

**Total: Just the domain cost!**

---

## 🎯 Post-Deployment Checklist

- [ ] Backend API responding at `/api/health`
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Login works
- [ ] Posts can be created
- [ ] Cloudinary upload works
- [ ] Custom domain configured (if using)
- [ ] HTTPS enabled (automatic)
- [ ] Environment variables set
- [ ] MongoDB Atlas connected

---

## 🔄 Updating Your App

Changes automatically deploy when you push to GitHub:

```bash
git add .
git commit -m "Your changes"
git push
```

Vercel will automatically rebuild and deploy!

---

## 📈 Scaling Later

If you outgrow the free tier:
- **Vercel Pro**: $20/month (longer function timeouts, more bandwidth)
- **MongoDB Atlas**: From $9/month (more storage, backups)
- **Cloudinary**: From $99/month (more storage/bandwidth)

---

## 🆘 Need Help?

1. Check Vercel function logs: Dashboard → Functions
2. Check MongoDB Atlas logs: Atlas dashboard
3. Use Vercel's built-in monitoring
4. Common issues are usually environment variables or MongoDB connection

Good luck! 🚀
