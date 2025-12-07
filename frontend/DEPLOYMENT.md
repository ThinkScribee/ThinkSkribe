# ThinqScribe Frontend - Vercel Deployment Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Vercel CLI** installed globally
4. **Vercel account**

## Quick Setup

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Initial Setup (First Time Only)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Initialize Vercel project
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account/team
# - Link to existing project? No (for new project)
# - Project name: thinqscribe-frontend
# - Directory: ./
# - Override settings? No
```

## Deployment Commands

### Development Preview
```bash
npm run deploy:preview
# or
vercel
```

### Production Deployment
```bash
npm run deploy
# or
vercel --prod
```

### Local Development with Vercel
```bash
npm run vercel:dev
# or
vercel dev
```

## Environment Variables Setup

### 1. Set Environment Variables in Vercel Dashboard

Go to your Vercel project dashboard and add these environment variables:

**Production Variables:**
- `VITE_API_BASE_URL`: Your backend API URL
- `VITE_SOCKET_URL`: Your WebSocket server URL
- `VITE_APP_NAME`: ThinqScribe
- `VITE_APP_URL`: https://thinqscribe.com
- `VITE_ENABLE_ANALYTICS`: true
- `VITE_ENABLE_CHAT`: true
- `VITE_ENABLE_PAYMENTS`: true

### 2. Or Set via CLI

```bash
vercel env add VITE_API_BASE_URL production
vercel env add VITE_SOCKET_URL production
# ... add other variables
```

## Project Structure

```
frontend/
├── src/                    # Source code
├── public/                 # Static assets
├── dist/                   # Build output (auto-generated)
├── vercel.json            # Vercel configuration
├── .vercelignore          # Files to ignore during deployment
├── .env.example           # Environment variables template
├── .env.production        # Production environment variables
└── package.json           # Dependencies and scripts
```

## Vercel Configuration

The `vercel.json` file includes:
- **Framework Detection**: Automatic Vite framework detection
- **Build Configuration**: Uses npm run build command
- **SPA Routing**: Rewrites all routes to index.html for client-side routing
- **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
- **Static Assets**: Optimized caching for assets with immutable cache headers

## Custom Domain Setup

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Domains"
3. Add your custom domain: `thinqscribe.com`
4. Configure DNS records as instructed by Vercel

## Automatic Deployments

### GitHub Integration
1. Connect your GitHub repository to Vercel
2. Enable automatic deployments on push to main branch
3. Preview deployments for pull requests

### Manual Deployments
```bash
# Deploy current branch to preview
vercel

# Deploy to production
vercel --prod
```

## Monitoring and Analytics

- **Vercel Analytics**: Automatically enabled
- **Build Logs**: Available in Vercel dashboard
- **Performance Monitoring**: Built-in Vercel insights

## Troubleshooting

### Build Failures
```bash
# Check build locally
npm run build

# Check for TypeScript errors
npm run lint
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Check Vercel dashboard environment variables
- Redeploy after adding new variables

### Routing Issues
- Verify `vercel.json` routing configuration
- Check for client-side routing conflicts

## Performance Optimization

The deployment includes:
- **Static Asset Caching**: 1 year cache for immutable assets
- **Gzip Compression**: Automatic compression
- **CDN Distribution**: Global edge network
- **Image Optimization**: Automatic image optimization

## Security

- **HTTPS**: Automatic SSL certificates
- **CORS Headers**: Configured for API access
- **Environment Variables**: Secure server-side storage

## Support

For deployment issues:
1. Check Vercel documentation
2. Review build logs in Vercel dashboard
3. Test locally with `vercel dev`
4. Contact Vercel support if needed