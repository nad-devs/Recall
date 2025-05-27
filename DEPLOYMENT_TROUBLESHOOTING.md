# Deployment Troubleshooting Guide

## 🚨 **Analysis Not Working After Redeployment - FIXED**

If your analysis functionality stops working after redeploying the frontend, follow this checklist:

### ✅ **Step 1: Verify Vercel Environment Variables**

In your Vercel dashboard, ensure these environment variables are set:

```bash
# Required for backend connections
BACKEND_URL=https://recall.p3vg.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://recall.p3vg.onrender.com
EXTRACTION_SERVICE_URL=https://recall.p3vg.onrender.com/api/v1/extract-concepts

# Database (should already be set)
DATABASE_URL=your_database_url

# OpenAI API Key (should already be set)
OPENAI_API_KEY=your_openai_key

# NextAuth (should already be set)
NEXTAUTH_URL=https://your-vercel-app.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
```

### ✅ **Step 2: Verify Render.com Environment Variables**

In your Render.com Python service, ensure this environment variable is set:

```bash
# CRITICAL: This must point to your Vercel app
FRONTEND_URL=https://your-vercel-app.vercel.app

# OpenAI API Key (should already be set)
OPENAI_API_KEY=your_openai_key
```

### ✅ **Step 3: Test the Connection**

After deployment, test these endpoints:

1. **Frontend Health Check**: `https://your-app.vercel.app/api/health`
2. **Backend Health Check**: `https://recall.p3vg.onrender.com/api/v1/health`
3. **Analysis Endpoint**: Try the analysis feature in your app

### ✅ **Step 4: Check Browser Console**

If analysis still fails:
1. Open Browser Developer Tools (F12)
2. Go to Console tab
3. Try to analyze a conversation
4. Look for error messages that show:
   - Network errors (failed fetch)
   - CORS errors
   - 500/503 server errors

## 🔧 **Common Issues and Solutions**

### **Issue 1: "Backend service unavailable" Error**
**Cause**: Render.com service is asleep or environment variables are wrong
**Solution**: 
1. Visit `https://recall.p3vg.onrender.com/api/v1/health` to wake up the service
2. Verify `BACKEND_URL` in Vercel matches your Render.com URL

### **Issue 2: "CORS Error" in Browser Console**
**Cause**: Frontend URL not set correctly in Render.com
**Solution**: 
1. Set `FRONTEND_URL=https://your-vercel-app.vercel.app` in Render.com
2. Redeploy the Python service

### **Issue 3: "Connection timeout" or SSL Errors**
**Cause**: HTTPS connection issues
**Solution**: ✅ **Already Fixed** - The code now automatically falls back to HTTP

### **Issue 4: Analysis Returns Empty Results**
**Cause**: Backend is working but returning no concepts
**Solution**: 
1. Check OpenAI API key is valid in Render.com
2. Check backend logs in Render.com dashboard
3. Verify the conversation text is being sent correctly

## 🧪 **Testing Commands**

Run these commands to test the connection:

```bash
# Test frontend health
curl https://your-app.vercel.app/api/health

# Test backend health
curl https://recall.p3vg.onrender.com/api/v1/health

# Test concept extraction
curl -X POST https://recall.p3vg.onrender.com/api/v1/extract-concepts \
  -H "Content-Type: application/json" \
  -d '{"conversation_text": "Hash tables provide O(1) lookup time"}'
```

## 📝 **Deployment Checklist**

Before deploying, verify:

- [ ] All environment variables are set in Vercel
- [ ] `FRONTEND_URL` is set correctly in Render.com
- [ ] Backend service is awake and responding
- [ ] OpenAI API key is valid and has credits
- [ ] Database connection is working

## 🆘 **Emergency Recovery Steps**

If everything breaks:

1. **Redeploy Backend First**: Go to Render.com and trigger a manual deployment
2. **Wait for Backend**: Give it 2-3 minutes to fully start
3. **Test Backend**: Visit the health endpoint
4. **Redeploy Frontend**: Trigger Vercel redeployment
5. **Clear Browser Cache**: Hard refresh your app

## 🎯 **What We Fixed**

The recent routing fixes address these issues:

1. **Inconsistent URLs**: All API routes now use environment variables
2. **SSL Fallback**: Automatic HTTP fallback for connection issues
3. **Environment Variables**: Proper configuration for all deployment scenarios
4. **CORS Configuration**: Backend accepts requests from your frontend domain

Your analysis should now work consistently after redeployments! 🚀 