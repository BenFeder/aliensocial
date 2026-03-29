# Quick Deployment Steps

## 1️⃣ Set Up MongoDB Atlas (5 minutes)
- Go to mongodb.com/cloud/atlas
- Create free cluster → Get connection string
- Save for later

## 2️⃣ Deploy Backend on Render (10 minutes)
1. Push code to GitHub (if not already)
2. Go to render.com → "New Web Service"
3. Connect GitHub repo
4. Settings:
   - Build: `npm install`
   - Start: `npm start`
5. Add Environment Variables:
   - `MONGODB_URI` = your MongoDB connection string
   - `JWT_SECRET` = any long random string
   - `CLIENT_URL` = `https://aliensocial.com`
   - `NODE_ENV` = `production`
6. Deploy and get URL: `https://your-app.onrender.com`

## 3️⃣ Deploy Frontend on Vercel (5 minutes)
1. Go to vercel.com → "New Project"
2. Import GitHub repo
3. Root Directory: `client`
4. Add Environment Variable:
   - `REACT_APP_API_URL` = `https://your-app.onrender.com/api`
5. Deploy!

## 4️⃣ Configure Domain (Optional)
1. In Vercel: Settings → Domains → Add `aliensocial.com`
2. Add DNS records at your domain registrar
3. Wait for propagation (up to 48 hours)

## 5️⃣ Fix File Uploads (Important!)
Render's free tier uses ephemeral storage. Files get deleted on restart.

**Quick Fix: Use Cloudinary**
```bash
npm install cloudinary multer-storage-cloudinary
```
Then update `server/middleware/upload.js` to use Cloudinary.

---

## ⚠️ Important Notes
- Free Render instances sleep after 15 min inactivity (first request takes 30-60s)
- MongoDB Atlas free tier has 512MB limit
- Update `CLIENT_URL` in Render after configuring custom domain

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.
