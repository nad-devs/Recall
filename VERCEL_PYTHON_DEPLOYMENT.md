# Deploying Python Microservice to Vercel

## Overview
This guide shows how to deploy your Python concept extraction microservice to Vercel as serverless functions.

## Prerequisites
1. Vercel account (free tier works)
2. Vercel CLI installed: `npm i -g vercel`
3. OpenAI API key

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Set Environment Variables
In your Vercel dashboard or via CLI:
```bash
vercel env add OPENAI_API_KEY
# Enter your OpenAI API key when prompted
```

### 4. Deploy the Service
From your project root directory:
```bash
vercel --prod
```

### 5. Update Your Next.js App
After deployment, update the `EXTRACTION_SERVICE_URL` in your `.env` file:
```env
EXTRACTION_SERVICE_URL=https://your-vercel-deployment-url.vercel.app
```

## API Endpoints

After deployment, your Python service will be available at:
- `GET /api/v1/health` - Health check
- `POST /api/v1/extract-concepts` - Concept extraction

## Testing the Deployment

### Test Health Endpoint
```bash
curl https://your-vercel-deployment-url.vercel.app/api/v1/health
```

### Test Concept Extraction
```bash
curl -X POST https://your-vercel-deployment-url.vercel.app/api/v1/extract-concepts \
  -H "Content-Type: application/json" \
  -d '{
    "conversation_text": "I learned about React hooks today. useState is really useful for managing state.",
    "custom_api_key": "your-openai-key-optional"
  }'
```

## File Structure
```
├── vercel.json                    # Vercel configuration
├── pyservice/
│   ├── api/
│   │   ├── extract-concepts.py   # Main extraction endpoint
│   │   └── health.py             # Health check endpoint
│   └── requirements.txt          # Python dependencies
```

## Configuration Details

### vercel.json
- Maps URL routes to Python functions
- Sets Python runtime version
- Configures environment variables

### Python Functions
- Use `BaseHTTPRequestHandler` for Vercel compatibility
- Handle CORS headers for browser requests
- Support both regular and custom API keys

## Benefits of This Approach

✅ **Proven Python Code**: Uses your existing, working Python logic
✅ **Serverless Scaling**: Automatically scales with demand
✅ **Cost Effective**: Pay only for actual usage
✅ **Easy Deployment**: Single command deployment
✅ **Environment Variables**: Secure API key management
✅ **CORS Support**: Works with your Next.js frontend

## Troubleshooting

### Common Issues
1. **Import Errors**: Make sure all dependencies are in `requirements.txt`
2. **Timeout Issues**: Vercel has a 10-second timeout for hobby plan
3. **Memory Issues**: Optimize your code for serverless environment

### Debugging
- Check Vercel function logs in the dashboard
- Use `vercel logs` command to see real-time logs
- Test locally with `vercel dev`

## Next Steps

1. Deploy the service to Vercel
2. Update your Next.js app's environment variables
3. Test the integration
4. Monitor performance in Vercel dashboard

The Python microservice will work exactly as before, but now hosted on Vercel's serverless infrastructure! 