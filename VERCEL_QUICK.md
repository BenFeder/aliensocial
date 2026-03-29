# Quick Steps - Deploy to Vercel

## 1️⃣ MongoDB Atlas (5 min)
- Sign up at mongodb.com/cloud/atlas
- Create free cluster
- Get connection string
- **Important:** Whitelist all IPs (0.0.0.0/0) in Network Access

## 2️⃣ Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel"
git push
```

## 3️⃣ Deploy on Vercel (5 min)
1. Go to vercel.com → "New Project"
2. Import your GitHub repo
3. Add environment variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = any long random string
4. Click "Deploy"
5. Done! Your site is live

## 4️⃣ Custom Domain (Optional)
- In Vercel: Settings → Domains → Add `aliensocialnetwork.com`
- Configure DNS at your registrar (A record to 76.76.19.19)

## ⚠️ File Uploads
Vercel has read-only filesystem. You need Cloudinary:
1. Sign up at cloudinary.com (free)
2. Add credentials to Vercel env variables
3. Update upload middleware (see VERCEL_DEPLOY.md)

See [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) for detailed instructions.
