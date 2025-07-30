# 🚀 EDU-SAGE Quick Start Guide

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Stripe account (for payments)

## 1. Environment Setup

### Backend Environment (.env file in backend directory)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/edusage
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edusage

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=30d

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Server
NODE_ENV=development
PORT=5000

# Email (optional)
EMAIL_FROM=noreply@edusage.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

## 2. Installation

### Backend Setup
```bash
cd backend
npm install
```

### Frontend Setup
```bash
cd frontend
npm install
```

## 3. Start the System

### Terminal 1 - Backend Server
```bash
cd backend
npm run dev
```
✅ Should show: "Server running in development mode on port 5000"

### Terminal 2 - Frontend Application
```bash
cd frontend
npm run dev
```
✅ Should show: "Local: http://localhost:5173/"

## 4. Verify System Health

### Check Backend Health
Open: http://localhost:5000/api/health
✅ Should return: `{"status": "healthy"}`

### Check Frontend
Open: http://localhost:5173
✅ Should show the EDU-SAGE landing page

## 5. Test User Accounts

### Create Test Accounts
1. Go to http://localhost:5173/signup
2. Create a student account
3. Create a writer account (use different email)

### Test Dashboard Access
1. Login as student → Should redirect to student dashboard
2. Login as writer → Should redirect to writer dashboard

## 6. Troubleshooting

### Common Issues & Solutions

#### 🔴 Backend won't start
```bash
# Check if MongoDB is running
mongosh  # Should connect successfully

# Check if port 5000 is available
lsof -i :5000  # Should show nothing or kill existing process

# Verify environment variables
cd backend && node -e "console.log(process.env.MONGODB_URI)"
```

#### 🔴 Frontend won't start
```bash
# Check if port 5173 is available
lsof -i :5173

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 🔴 Database connection fails
- Verify MongoDB is running
- Check MONGODB_URI in .env file
- For local MongoDB: `brew services start mongodb-community` (Mac)

#### 🔴 Dashboard not loading data
- Check browser console for errors
- Verify backend API is responding: http://localhost:5000/api/health
- Check authentication: localStorage should have 'edusage_auth_token'

#### 🔴 Socket connection issues
- Check browser console for socket errors
- Verify CORS settings in backend
- Try refreshing the page

## 7. Development Commands

### Backend
```bash
npm run dev          # Start with nodemon
npm run start        # Start production
npm run test         # Run tests
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## 8. Key Features to Test

### ✅ Authentication
- [ ] Student signup/login
- [ ] Writer signup/login
- [ ] JWT token storage
- [ ] Automatic redirects

### ✅ Student Dashboard
- [ ] Dashboard loads with stats
- [ ] Create new assignments
- [ ] Chat with writers
- [ ] Payment history

### ✅ Writer Dashboard  
- [ ] Dashboard loads with agreements
- [ ] Accept/reject agreements
- [ ] Track payments
- [ ] Chat with students

### ✅ Real-time Features
- [ ] Socket connection established
- [ ] Real-time notifications
- [ ] Chat messages
- [ ] Dashboard updates

### ✅ Payment System
- [ ] Create payment sessions
- [ ] Stripe checkout flow
- [ ] Payment confirmation
- [ ] Payment history

## 9. Production Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
STRIPE_SECRET_KEY=your_production_stripe_key
```

### Build Commands
```bash
# Frontend
npm run build

# Backend
npm run start
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Backend Console**:
   ```
   MongoDB Connected: your-cluster-name
   Server running in development mode on port 5000
   Socket.IO initialized
   ```

2. **Frontend Console** (Browser DevTools):
   ```
   🔌 [Socket] Connected successfully
   ✅ [Auth] User authenticated
   🎯 [API] Dashboard data received
   ```

3. **Working Features**:
   - Login/logout works smoothly
   - Dashboards load with real data
   - Chat system is functional
   - Payments can be initiated
   - Real-time notifications appear

---

**Need Help?** Check the browser console and backend logs for detailed error messages. 