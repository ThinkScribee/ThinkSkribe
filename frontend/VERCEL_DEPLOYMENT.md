# Vercel Deployment Guide for ThinqScribe Frontend

## Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **Vercel CLI**
4. **Vercel Account** (free tier available)

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

This will open your browser to authenticate with Vercel.

## Step 3: Navigate to Frontend Directory

```bash
cd frontend
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Build the Project (Optional - for testing)

```bash
npm run build
```

## Step 6: Deploy to Vercel

### Option A: Using the Deployment Script (Recommended)

**For Windows:**
```bash
deploy-vercel.bat
```

**For Mac/Linux:**
```bash
chmod +x deploy-vercel.sh
./deploy-vercel.sh
```

### Option B: Manual Deployment

```bash
vercel --prod
```

## Step 7: Configure Custom Domain

1. Go to your Vercel dashboard
2. Select your project
3. Go to "Settings" → "Domains"
4. Add your custom domain: `thinqscribe.com`
5. Configure DNS records as instructed by Vercel

## Environment Variables

The following environment variables are automatically set in `vercel.json`:

- `VITE_API_BASE_URL`: `https://thinkscribe.onrender.com/api`
- `VITE_FRONTEND_URL`: `https://thinqscribe.com`

## Build Configuration

The project is configured with:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x (recommended)

## Important Notes

### 1. SPA Routing
The `vercel.json` includes rewrite rules to handle React Router navigation:
```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

### 2. Security Headers
Security headers are automatically added:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

### 3. Caching
Static assets are cached for 1 year with immutable cache headers.

## Troubleshooting

### Build Errors
1. Check Node.js version: `node --version`
2. Clear npm cache: `npm cache clean --force`
3. Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Deployment Errors
1. Ensure you're logged in: `vercel whoami`
2. Check project settings: `vercel ls`
3. View deployment logs: `vercel logs`

### Domain Issues
1. Verify DNS configuration
2. Check domain verification status in Vercel dashboard
3. Ensure SSL certificate is provisioned

## Post-Deployment Checklist

- [ ] Verify the app loads correctly
- [ ] Test all major features
- [ ] Check mobile responsiveness
- [ ] Verify API connections
- [ ] Test authentication flow
- [ ] Check WebSocket connections
- [ ] Verify file uploads/downloads
- [ ] Test payment integration

## Monitoring

- **Vercel Analytics**: Available in dashboard
- **Performance**: Built-in performance monitoring
- **Error Tracking**: Automatic error reporting
- **Uptime**: 99.9% uptime guarantee

## Support

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Configure CI/CD for automatic deployments
3. Set up staging environment
4. Implement performance optimization
5. Set up backup and recovery procedures 