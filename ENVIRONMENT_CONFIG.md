# Environment Variable Configuration Guide

This document outlines all environment variables used in the application and how to configure them for different deployment scenarios.

## Core Environment Variables

### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### OpenAI API Configuration
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### Backend Service URLs
These variables control how the frontend connects to the Python backend service:

```bash
# Main backend URL for API calls
BACKEND_URL=http://localhost:8000

# Public backend URL (accessible from client-side)
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Legacy extraction service URL (for backward compatibility)
EXTRACTION_SERVICE_URL=http://localhost:8000/api/v1/extract-concepts
```

### Frontend URL
Used by the Python service to call back to the Next.js API:

```bash
FRONTEND_URL=http://localhost:3000
```

### NextAuth Configuration
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### Node Environment
```bash
NODE_ENV=development
```

## Deployment Scenarios

### 1. Local Development

```bash
# Backend URLs
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
EXTRACTION_SERVICE_URL=http://localhost:8000/api/v1/extract-concepts

# Frontend URL
FRONTEND_URL=http://localhost:3000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
```

### 2. Docker Compose

The `docker-compose.yml` automatically configures:
- `BACKEND_URL=http://python-service:8000`
- `NEXT_PUBLIC_BACKEND_URL=http://python-service:8000`
- `FRONTEND_URL=http://web:3000`

### 3. Production (Vercel + Render.com)

```bash
# Backend URLs (pointing to Render.com deployment)
BACKEND_URL=https://recall.p3vg.onrender.com
NEXT_PUBLIC_BACKEND_URL=https://recall.p3vg.onrender.com
EXTRACTION_SERVICE_URL=https://recall.p3vg.onrender.com/api/v1/extract-concepts

# Frontend URL (pointing to Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
```

## Configuration Files

### 1. Local Development
Create a `.env.local` file in the root directory with local development values.

### 2. Docker Compose
The `docker-compose.yml` file automatically sets internal container URLs.

### 3. Vercel Production
Set environment variables in the Vercel dashboard or use the `vercel.json` configuration.

### 4. Render.com Python Service
Set the `FRONTEND_URL` environment variable in your Render.com service settings.

## API Route Connection Patterns

### Frontend → Backend
All API routes in `app/api/` use this pattern:

```typescript
const httpsUrl = process.env.BACKEND_URL || 'https://recall.p3vg.onrender.com';
const httpUrl = httpsUrl.replace('https://', 'http://');

let response;
try {
  console.log("Attempting HTTPS connection...");
  response = await fetch(`${httpsUrl}/api/v1/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
} catch (sslError) {
  console.log("HTTPS failed, trying HTTP fallback...");
  response = await fetch(`${httpUrl}/api/v1/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}
```

### Backend → Frontend
The Python service uses:

```python
frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
resp = await client.get(f"{frontend_url}/api/categories")
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure `FRONTEND_URL` is correctly set in the Python service
2. **Connection Refused**: Check that all services are running and URLs are accessible
3. **SSL Certificate Errors**: The HTTP fallback pattern handles this automatically
4. **Environment Variable Not Found**: Check that variables are properly set in your deployment platform

### Health Check Endpoints

- Frontend: `http://localhost:3000/api/health`
- Backend: `http://localhost:8000/api/v1/health`

### Testing Commands

```bash
# Test frontend health
curl http://localhost:3000/api/health

# Test backend health  
curl http://localhost:8000/api/v1/health

# Test concept extraction
curl -X POST http://localhost:8000/api/v1/extract-concepts \
  -H "Content-Type: application/json" \
  -d '{"conversation_text": "Test conversation"}'
```

## Security Notes

- Never commit actual API keys to version control
- Use different `NEXTAUTH_SECRET` values for different environments
- Keep production URLs secure and use HTTPS where possible
- The application includes automatic HTTP/HTTPS fallback for development flexibility 