# 🚀 Deployment Guide - Frontend (Vercel) + Backend (Render)

## 📋 **Overview**

This guide walks you through deploying Recall with:
- **Frontend**: Next.js app on Vercel
- **Backend**: Python FastAPI service on Render  
- **Database**: PostgreSQL (can be hosted on Render)

## 🔧 **Prerequisites**

- GitHub account with your code repository
- Vercel account (free tier available)
- Render account (free tier available)
- OpenAI API key

---

## 🐍 **Step 1: Deploy Backend on Render**

### **1.1 Create Web Service**
1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your repository and branch

### **1.2 Configure Service**
- **Name**: `recall-backend` (or your preferred name)
- **Root Directory**: `pyservice`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python main.py`

### **1.3 Set Environment Variables**
Add these environment variables in Render:

| Variable | Value | Description |
|----------|-------|-------------|
| `OPENAI_API_KEY` | `your_openai_api_key` | Your OpenAI API key |
| `FRONTEND_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL (set after frontend deployment) |
| `PORT` | `10000` | Port for the service (auto-set by Render) |

### **1.4 Deploy**
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Note your backend URL: `https://your-backend-name.onrender.com`

---

## 🌐 **Step 2: Deploy Frontend on Vercel**

### **2.1 Create Project**
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Select the repository (not the `pyservice` folder)

### **2.2 Configure Build Settings**
Vercel should auto-detect Next.js. If not:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### **2.3 Set Environment Variables**
Add these environment variables in Vercel:

| Variable | Value | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `your_postgres_connection_string` | PostgreSQL database URL |
| `BACKEND_URL` | `https://your-backend-name.onrender.com` | Your Render backend URL |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Your Vercel app URL |
| `NEXTAUTH_SECRET` | `your_random_secret` | Random string for NextAuth |

### **2.4 Deploy**
1. Click **"Deploy"**
2. Wait for deployment (2-5 minutes)
3. Note your frontend URL: `https://your-app.vercel.app`

---

## 🗄️ **Step 3: Set Up Database**

### **Option A: Render PostgreSQL (Recommended)**
1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Choose **"Free"** plan
3. Set database name: `recall_db`
4. Click **"Create Database"**
5. Copy the **External Database URL**
6. Add this URL as `DATABASE_URL` in your Vercel environment variables

### **Option B: Other PostgreSQL Providers**
- **Supabase**: Free tier with 500MB
- **PlanetScale**: Free tier with 1GB
- **Railway**: Free tier with 1GB

---

## 🔄 **Step 4: Update Cross-Service Configuration**

### **4.1 Update Backend with Frontend URL**
1. Go to your Render backend service
2. Update environment variable:
   - `FRONTEND_URL` = `https://your-app.vercel.app`
3. Redeploy the service

### **4.2 Update Frontend with Backend URL**
1. Go to your Vercel project settings
2. Update environment variable:
   - `BACKEND_URL` = `https://your-backend-name.onrender.com`
3. Redeploy the frontend

---

## 🧪 **Step 5: Test Deployment**

### **5.1 Test Backend**
```bash
# Test health endpoint
curl https://your-backend-name.onrender.com/api/v1/health

# Test concept extraction
curl -X POST https://your-backend-name.onrender.com/api/v1/extract-concepts \
  -H "Content-Type: application/json" \
  -d '{"conversation_text": "Hash tables provide O(1) lookup time"}'
```

### **5.2 Test Frontend**
1. Visit `https://your-app.vercel.app`
2. Try analyzing a conversation
3. Check that concepts are extracted properly
4. Verify quiz generation works

### **5.3 Automated Testing**
```bash
# Set environment variables and run tests
FRONTEND_URL=https://your-app.vercel.app \
BACKEND_URL=https://your-backend-name.onrender.com \
node scripts/verify-apis.js
```

---

## 🚨 **Common Issues & Solutions**

### **CORS Errors**
If you get CORS errors, the backend might not be allowing your frontend domain:
1. Check that `FRONTEND_URL` is set correctly in Render
2. Restart the backend service

### **Environment Variables Not Working**
- Make sure variables are set in the correct service (Vercel for frontend, Render for backend)
- Redeploy after changing environment variables
- Check for typos in variable names

### **Database Connection Issues**
- Verify `DATABASE_URL` is correct in Vercel
- Make sure database is accessible from external connections
- Check database credentials and permissions

### **Backend Service Sleeping (Free Tier)**
Render free tier services sleep after 15 minutes of inactivity:
- First request after sleep takes 30-60 seconds
- Consider upgrading to paid tier for production
- Use a service like UptimeRobot to ping your backend periodically

---

## 💰 **Cost Breakdown**

### **Free Tier (Development)**
- **Vercel**: Free (100GB bandwidth, unlimited projects)
- **Render**: Free (750 hours/month, sleeps after 15min inactivity)
- **Database**: Free tier from various providers
- **Total**: $0/month + OpenAI API usage

### **Production Tier**
- **Vercel Pro**: $20/month (better performance, analytics)
- **Render Starter**: $7/month (no sleeping, better performance)
- **Database**: $7-15/month (depending on provider)
- **Total**: ~$35-50/month + OpenAI API usage

---

## 🔐 **Security Checklist**

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Restrict CORS origins in production
- [ ] Set up database backups
- [ ] Monitor API usage and costs
- [ ] Set up error tracking (Sentry, etc.)

---

## 📊 **Monitoring & Maintenance**

### **Logs**
- **Vercel**: Functions tab in dashboard
- **Render**: Logs tab in service dashboard

### **Performance**
- **Vercel**: Analytics tab (Pro plan)
- **Render**: Metrics tab in dashboard

### **Uptime Monitoring**
- Use UptimeRobot or similar to monitor both services
- Set up alerts for downtime

---

## 🎉 **You're Done!**

Your Recall application is now deployed with:
✅ Scalable frontend on Vercel  
✅ Robust backend on Render  
✅ Reliable database  
✅ Proper separation of concerns  

**Next Steps:**
- Set up custom domain (optional)
- Configure monitoring and alerts
- Set up CI/CD for automatic deployments
- Scale services as needed

Need help? Check the troubleshooting section or create an issue in the repository! 