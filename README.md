# ThinqScribe - AI-Powered Academic Writing Platform

ThinqScribe is a comprehensive academic writing platform that connects students with professional writers and AI-powered tools to enhance their academic work.

## 🚀 Features

- **AI-Powered Writing Assistant**: Advanced AI models for content generation and editing
- **Professional Writer Network**: Connect with verified academic writers
- **Real-time Collaboration**: Live chat and document collaboration
- **Payment Integration**: Secure payment processing with Stripe and Paystack
- **File Management**: Upload, store, and manage documents with AWS S3
- **Multi-language Support**: Support for various academic languages
- **Responsive Design**: Modern, mobile-friendly interface

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Stripe & Paystack** for payments
- **AWS S3** for file storage
- **Resend** for email services

### Frontend
- **React 19** with Vite
- **Ant Design** for UI components
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for data fetching
- **Socket.io Client** for real-time features

## 📁 Project Structure

```
ThinqScribe/
├── backend/                 # Node.js backend API
│   ├── config/             # Database and service configurations
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React contexts
│   │   ├── hooks/         # Custom React hooks
│   │   ├── api/           # API client functions
│   │   ├── services/      # Frontend services
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Fill in your environment variables:
     ```env
     MONGODB_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret
     STRIPE_SECRET_KEY=your_stripe_secret_key
     AWS_ACCESS_KEY_ID=your_aws_access_key
     AWS_SECRET_ACCESS_KEY=your_aws_secret_key
     # ... other variables
     ```

4. **Start the backend server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env.local`
   - Configure your frontend environment variables:
     ```env
     VITE_API_BASE_URL=http://localhost:5000/api
     VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
     # ... other variables
     ```

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/thinqscribe

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...

# Email
RESEND_API_KEY=re_...

# AWS
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# External APIs
SERP_API_KEY=your_serp_key
NEWS_API_KEY=your_news_key
```

### Frontend (.env.local)
```env
# API
VITE_API_BASE_URL=http://localhost:5000/api

# Payments (Public Keys Only)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...

# App Configuration
VITE_APP_NAME=ThinqScribe
VITE_FRONTEND_URL=http://localhost:5173
```

## 🚀 Deployment

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy using the provided `render.yaml` configuration

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy using the provided `vercel.json` configuration

## 🔒 Security

This project implements several security best practices:

- **Environment Variables**: All sensitive data is stored in environment variables
- **JWT Authentication**: Secure token-based authentication
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Input Validation**: Request validation using express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **Helmet.js**: Security headers middleware

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### User Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/orders` - Get user orders

### Writer Endpoints
- `GET /api/writers` - Get available writers
- `POST /api/writers/apply` - Apply as a writer
- `GET /api/writers/dashboard` - Writer dashboard data

### Chat Endpoints
- `GET /api/chat/conversations` - Get user conversations
- `POST /api/chat/messages` - Send message
- `GET /api/chat/messages/:conversationId` - Get conversation messages

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@thinqscribe.com or join our Discord community.

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Stripe for payment processing
- MongoDB for database services
- AWS for cloud storage
- Vercel and Render for hosting

---

**Note**: This is a private project. Please ensure all environment variables are properly configured and never commit sensitive information to version control.
