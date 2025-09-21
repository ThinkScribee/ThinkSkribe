# GitHub Setup Guide for ThinqScribe

This guide will help you safely push your ThinqScribe project to GitHub without exposing any sensitive information.

## 🔒 Security Checklist

Before pushing to GitHub, ensure you have completed all security measures:

### ✅ Environment Variables Secured
- [x] All `.env` files are in `.gitignore`
- [x] No hardcoded secrets in configuration files
- [x] Production config files use environment variables only
- [x] Example environment files created for reference

### ✅ Sensitive Data Removed
- [x] Database connection strings use environment variables
- [x] API keys and tokens use environment variables
- [x] Payment gateway secrets use environment variables
- [x] AWS credentials use environment variables
- [x] Email service credentials use environment variables

### ✅ Configuration Files Secured
- [x] `backend/production.config.js` - Removed hardcoded fallbacks
- [x] `frontend/production.config.js` - Removed hardcoded URLs
- [x] `backend/render.yaml` - Uses environment variables properly
- [x] `frontend/vercel.json` - Uses placeholder URLs

## 🚀 GitHub Repository Setup

### 1. Initialize Git Repository

```bash
# Navigate to your project root
cd C:\Users\USER\Documents\ThinqScribe

# Initialize git repository
git init

# Add all files (respecting .gitignore)
git add .

# Create initial commit
git commit -m "Initial commit: ThinqScribe AI-powered academic writing platform"
```

### 2. Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Repository name: `ThinqScribe` (or your preferred name)
5. Description: "AI-Powered Academic Writing Platform"
6. Set visibility to **Private** (recommended for production apps)
7. **DO NOT** initialize with README, .gitignore, or license (we already have these)
8. Click "Create repository"

### 3. Connect Local Repository to GitHub

```bash
# Add GitHub remote (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/ThinqScribe.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## 🔧 Environment Variables for Deployment

### Backend (Render/Heroku)
Set these environment variables in your hosting platform:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_jwt_secret
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
PAYSTACK_SECRET_KEY=sk_live_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
PAYSTACK_WEBHOOK_SECRET=whsec_your_paystack_webhook_secret
EMAIL_FROM=noreply@thinqscribe.com
RESEND_API_KEY=re_your_resend_api_key
CLIENT_URL=https://your-frontend-url.com
FRONTEND_URL=https://your-frontend-url.com
SESSION_SECRET=your_session_secret
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name
SERP_API_KEY=your_serp_api_key
NEWS_API_KEY=your_news_api_key
OPENAI_API_KEY=sk-your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key
```

### Frontend (Vercel/Netlify)
Set these environment variables in your hosting platform:

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
VITE_FRONTEND_URL=https://your-frontend-url.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
VITE_PAYSTACK_PUBLIC_KEY=pk_live_your_paystack_public_key
VITE_SOCKET_URL=https://your-backend-url.onrender.com
VITE_APP_NAME=ThinqScribe
VITE_APP_VERSION=1.0.0
VITE_ENABLE_PAYMENTS=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_FILE_UPLOAD=true
VITE_ENABLE_NOTIFICATIONS=true
```

## 🔍 Final Security Verification

Before pushing, run these commands to verify no secrets are exposed:

```bash
# Check for any remaining .env files
find . -name ".env*" -type f

# Check for hardcoded secrets in JavaScript files
grep -r "sk_live_\|sk_test_\|pk_live_\|pk_test_\|mongodb://\|mongodb+srv://" --include="*.js" --include="*.jsx" --include="*.json" .

# Check for AWS keys
grep -r "AKIA\|aws_access_key_id\|aws_secret_access_key" --include="*.js" --include="*.jsx" --include="*.json" .

# Check for email credentials
grep -r "smtp\|mailtrap\|resend" --include="*.js" --include="*.jsx" --include="*.json" .
```

## 📋 Deployment Checklist

### Before Deployment:
- [ ] All environment variables are set in hosting platform
- [ ] Database is accessible from hosting platform
- [ ] Payment gateways are configured with live keys
- [ ] Email service is configured
- [ ] AWS S3 bucket is configured
- [ ] Domain names are updated in configuration

### After Deployment:
- [ ] Test all authentication flows
- [ ] Test payment processing
- [ ] Test file upload functionality
- [ ] Test email notifications
- [ ] Test real-time chat features
- [ ] Verify all API endpoints work

## 🚨 Security Reminders

1. **Never commit `.env` files** - They contain sensitive information
2. **Use environment variables** - All secrets should be in environment variables
3. **Regular security audits** - Periodically check for exposed secrets
4. **Rotate keys regularly** - Change API keys and secrets periodically
5. **Monitor access logs** - Keep track of who accesses your repositories
6. **Use private repositories** - Keep your code private until ready for public release

## 📞 Support

If you encounter any issues during the GitHub setup process:

1. Check the [GitHub Documentation](https://docs.github.com/)
2. Verify your environment variables are properly set
3. Ensure all `.env` files are in your `.gitignore`
4. Double-check that no secrets are hardcoded in your files

## 🎉 You're Ready!

Once you've completed all the steps above, your ThinqScribe project is ready for GitHub and deployment. Your code is secure, and no sensitive information will be exposed.

Happy coding! 🚀
