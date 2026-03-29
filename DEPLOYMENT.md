# AlienSocial Deployment Guide

## Overview
- **Frontend**: Vercel (aliensocial.com)
- **Backend**: Render.com
- **Database**: MongoDB Atlas (recommended)
- **File Storage**: Note that Render's ephemeral filesystem requires external storage (Cloudinary, AWS S3, etc.) for persistent uploads

---

## Part 1: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/aliensocial?retryWrites=true&w=majority`)
5. Replace `<password>` with your actual database password
6. Keep this connection string for later

---

## Part 2: Deploy Backend to Render.com

### Step 1: Push Code to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Prepare for deployment"

# Create a new GitHub repository and push
git remote add origin https://github.com/yourusername/aliensocial.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Render
1. Go to [Render.com](https://render.com) and sign up/log in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `aliensocial-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (or set to `./` if needed)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or paid for better performance)

### Step 3: Set Environment Variables on Render
Go to "Environment" tab and add:
- `NODE_ENV` = `production`
- `MONGODB_URI` = `your_mongodb_atlas_connection_string`
- `JWT_SECRET` = `generate_a_long_random_string` (use a password generator)
- `CLIENT_URL` = `https://aliensocial.com`
- `PORT` = `5000` (Render will override this, but keep it)

### Step 4: Note Your Backend URL
After deployment, Render will give you a URL like:
`https://aliensocial-backend.onrender.com`

**Important**: Free Render instances spin down after inactivity. First request may take 30-60 seconds.

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Update API Configuration
The frontend needs to know your backend URL. This is already configured to use environment variables.

### Step 2: Deploy on Vercel
1. Go to [Vercel.com](https://vercel.com) and sign up/log in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `build` (auto-detected)

### Step 3: Set Environment Variables on Vercel
Under "Environment Variables", add:
- `REACT_APP_API_URL` = `https://aliensocial-backend.onrender.com/api`

Make sure to add it for all environments (Production, Preview, Development).

### Step 4: Deploy
Click "Deploy" and wait for the build to complete.

### Step 5: Configure Custom Domain
1. Purchase `aliensocial.com` from a domain registrar (Namecheap, GoDaddy, etc.)
2. In Vercel dashboard, go to your project → "Settings" → "Domains"
3. Add `aliensocial.com` and `www.aliensocial.com`
4. Vercel will provide DNS records to add to your domain registrar:
   - **A Record**: `@` → `76.76.19.19`
   - **CNAME**: `www` → `cname.vercel-dns.com`
5. Wait for DNS propagation (can take 24-48 hours)

---

## Part 4: Update Backend CORS Configuration

Make sure your backend allows requests from your domain. The code in `server/server.js` should be updated to use the CLIENT_URL environment variable.

---

## Part 5: Handle File Uploads (Important!)

**Problem**: Render uses ephemeral storage - uploaded files are deleted when the instance restarts.

**Solutions**:

### Option A: Use Cloudinary (Recommended - Free Tier Available)
1. Sign up at [Cloudinary](https://cloudinary.com)
2. Install: `npm install cloudinary multer-storage-cloudinary`
3. Update `server/middleware/upload.js` to use Cloudinary instead of local storage
4. Add Cloudinary credentials to Render environment variables

### Option B: Use AWS S3
1. Set up an S3 bucket
2. Install: `npm install aws-sdk multer-s3`
3. Update upload middleware to use S3
4. Add AWS credentials to Render environment variables

### Option C: Render Disk (Paid)
- Upgrade to a paid Render plan with persistent disk storage

---

## Part 6: Testing Your Deployment

1. Visit `https://aliensocial.com` (or your Vercel preview URL)
2. Try registering a user
3. Try logging in
4. Test posting, commenting, etc.
5. Check browser console for any API errors
6. Monitor Render logs for backend errors

---

## Troubleshooting

### "Network Error" or API not connecting
- Check that `REACT_APP_API_URL` in Vercel matches your Render backend URL
- Check CORS settings in backend
- Verify Render service is running (check logs)

### Backend crashes on Render
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure MongoDB connection string is correct

### File uploads not working
- Switch to Cloudinary or S3 (ephemeral storage issue)
- Check Render logs for file system errors

### Images not loading
- If using Cloudinary/S3, ensure URLs are being saved correctly to database
- Check that uploaded files are publicly accessible

---

## Post-Deployment Checklist

- [ ] Backend is running on Render
- [ ] Frontend is deployed on Vercel
- [ ] Custom domain is configured and working
- [ ] MongoDB Atlas is connected
- [ ] All environment variables are set
- [ ] CORS is properly configured
- [ ] File uploads are working (Cloudinary/S3)
- [ ] User registration/login works
- [ ] All features tested on production

---

## Useful Commands

```bash
# Check backend health
curl https://aliensocial-backend.onrender.com/api/health

# View Render logs
# Go to Render dashboard → Service → Logs

# Redeploy Vercel (if needed)
# Go to Vercel dashboard → Deployments → Click "..." → Redeploy

# Update environment variable
# Go to Render/Vercel dashboard → Settings/Environment → Update
```

---

## Cost Estimate (Starting Free)

- **MongoDB Atlas**: Free tier (512MB)
- **Render Backend**: Free tier (spins down after inactivity)
- **Vercel Frontend**: Free tier (unlimited bandwidth)
- **Domain**: ~$10-15/year
- **Cloudinary**: Free tier (25GB storage, 25GB bandwidth/month)

**Total to start**: ~$10-15/year for domain only!

---

## Scaling Later

When you need better performance:
- **Render**: Upgrade to $7/month (always on, 512MB RAM)
- **MongoDB Atlas**: Upgrade to $9/month (2GB storage)
- **Cloudinary**: Upgrade as needed
- **Vercel**: Free tier is generous, upgrade only if needed

Good luck with your deployment! 🚀
