import dotenv from 'dotenv'
dotenv.config()
import express from 'express';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import writerRoutes from './routes/writer.js';
import paymentRoutes from './routes/payment.js';
import chatRoutes from './routes/chat.js';
import aiChatRoutes from './routes/aiChat.js';

import adminRoutes from './routes/admin.js';
import orderRoutes from './routes/order.js';
import supportRoutes from './routes/support.js';
import {errorHandler} from './middlewares/error.js';
import { initSocket } from './socket.js';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import notificationRoutes from './routes/notifications.js';
import messageRoutes from './routes/messages.js';
import agreementRoutes from './routes/agreement.js';
import locationRoutes from './routes/location.js';
import webhookRoutes from './routes/webhooks.js';

// Database connection
connectDB();
const app = express();

// Middlewares
// Updated CORS configuration in app.js
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
    'X-XSRF-TOKEN',
    'Set-Cookie',
    // Location and timezone headers
    'x-user-timezone',
    'x-user-country',
    'x-user-currency',
    'x-user-location',
    'x-client-ip',
    'x-forwarded-for'
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Content-Range',
    'Content-Disposition',
    'Authorization',
    'Set-Cookie'
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '350mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/writer', writerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-chat', aiChatRoutes);

app.use('/api/admin', adminRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/webhooks', webhookRoutes);
// Removed: app.use('/api/student', studentRoutes); // No longer needed

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Error handling
app.use(errorHandler);

export default app;