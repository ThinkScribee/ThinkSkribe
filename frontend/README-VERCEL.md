# 🚀 ThinqScribe Frontend - Vercel Deployment

Complete setup and deployment guide for deploying the ThinqScribe frontend to Vercel.

## 📋 Quick Start

### 1. **Install Vercel CLI**
```bash
npm install -g vercel
```

### 2. **Run Setup Script**
```bash
# Automated setup
npm run setup:vercel

# Or manual setup
node setup-vercel.js
```

### 3. **Login to Vercel**
```bash
vercel login
```

### 4. **Initialize Project**
```bash
vercel
```

### 5. **Deploy**
```bash
# Preview deployment
npm run deploy:preview

# Production deployment
npm run deploy
```

## 🛠️ Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `setup:vercel` | `npm run setup:vercel` | Run automated Vercel setup |
| `deploy:preview` | `npm run deploy:preview` | Deploy to preview environment |
| `deploy` | `npm run deploy` | Deploy to production |
| `vercel:dev` | `npm run vercel:dev` | Run local development with Vercel |
| `vercel:build` | `npm run vercel:build` | Build for Vercel deployment |

## 🚀 Deployment Options

### Option 1: NPM Scripts (Recommended)
```bash
# Preview
npm run deploy:preview

# Production
npm run deploy
```

### Option 2: Shell Scripts
```bash
# Linux/Mac
./deploy.sh preview
./deploy.sh production

# Windows
deploy.bat preview
deploy.bat production
```

### Option 3: Direct Vercel CLI
```bash
# Preview
vercel

# Production
vercel --prod
```

## 🔧 Configuration Files

### `vercel.json`
Main Vercel configuration with:
- Framework detection for Vite
- Build and install commands
- SPA routing with rewrites
- Security headers
- Static asset caching
- Environment variables

### `.vercelignore`
Files and directories to exclude from deployment:
- `node_modules`
- Development files
- Build artifacts
- Environment files

### Environment Files
- `.env.example` - Template for environment variables
- `.env.production` - Production environment variables
- `.env` - Local development (not committed)

## 🌍 Environment Variables

### Required Variables
```bash
VITE_API_BASE_URL=https://your-backend-api.com/api
VITE_SOCKET_URL=https://your-backend-api.com
VITE_APP_NAME=ThinqScribe
VITE_APP_URL=https://thinqscribe.com
```

### Optional Variables
```bash
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_PAYMENTS=true
VITE_DEBUG_MODE=false
```

### Setting Variables in Vercel

#### Via Dashboard
1. Go to Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable for Production/Preview/Development

#### Via CLI
```bash
vercel env add VITE_API_BASE_URL production
vercel env add VITE_SOCKET_URL production
# ... add other variables
```

## 🔄 Automatic Deployments

### GitHub Integration
1. Connect repository to Vercel
2. Enable automatic deployments
3. Configure branch settings:
   - `main/master` → Production
   - Other branches → Preview

### GitHub Actions (Optional)
The included workflow (`.github/workflows/deploy.yml`) provides:
- Automated testing
- Linting checks
- Build verification
- Deployment to Vercel

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Organization ID
- `VERCEL_PROJECT_ID` - Project ID

## 🌐 Custom Domain Setup

### 1. Add Domain in Vercel
```bash
vercel domains add thinqscribe.com
```

### 2. Configure DNS
Add these records to your DNS provider:
```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. Verify Domain
```bash
vercel domains verify thinqscribe.com
```

## 📊 Monitoring & Analytics

### Built-in Vercel Analytics
- Automatically enabled
- Performance metrics
- User analytics
- Core Web Vitals

### Custom Analytics
Add your analytics service:
```javascript
// In your app
if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
  // Initialize your analytics
}
```

## 🐛 Troubleshooting

### Build Failures
```bash
# Test build locally
npm run build

# Check for errors
npm run lint

# Clear cache
rm -rf node_modules dist
npm install
```

### Environment Variables Not Working
- Ensure variables start with `VITE_`
- Check Vercel dashboard settings
- Redeploy after adding variables
- Verify in build logs

### Routing Issues
- Check `vercel.json` routing configuration
- Ensure SPA fallback is configured
- Test routes locally with `vercel dev`

### Performance Issues
- Check bundle size: `npm run build -- --analyze`
- Optimize images and assets
- Review Vercel analytics
- Enable compression in `vercel.json`

## 🔒 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use different values for different environments
- Rotate API keys regularly
- Use Vercel's secure variable storage

### CORS Configuration
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://thinqscribe.com"
        }
      ]
    }
  ]
}
```

## 📈 Performance Optimization

### Automatic Optimizations
- Gzip compression
- Image optimization
- CDN distribution
- Static asset caching

### Manual Optimizations
- Code splitting
- Lazy loading
- Bundle analysis
- Asset optimization

## 🆘 Support & Resources

### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)

### Commands Reference
```bash
# Vercel CLI help
vercel --help

# Project info
vercel inspect

# Logs
vercel logs

# Environment variables
vercel env ls
vercel env add
vercel env rm
```

### Getting Help
1. Check build logs in Vercel dashboard
2. Test locally with `vercel dev`
3. Review configuration files
4. Check environment variables
5. Contact Vercel support

---

## 🎉 Success!

Your ThinqScribe frontend is now ready for deployment to Vercel! 

**Next Steps:**
1. Set up your environment variables
2. Configure your custom domain
3. Enable automatic deployments
4. Monitor performance and analytics

Happy deploying! 🚀