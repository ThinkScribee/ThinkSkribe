import express from 'express';
import { protect } from '../middlewares/auth.js';
import { testResendConnection } from '../services/resendEmailService.js';
import { sendUnreadMessageEmail } from '../services/resendEmailService.js';

const router = express.Router();

// Test Resend connection
router.get('/resend-connection', async (req, res) => {
  try {
    const isConnected = await testResendConnection();
    
    res.json({
      success: isConnected,
      message: isConnected ? 'Resend connection successful' : 'Resend connection failed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Resend connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Resend connection test failed',
      error: error.message
    });
  }
});

// Test unread message email (requires authentication)
router.post('/unread-email', protect, async (req, res) => {
  try {
    const { recipientEmail, senderName, messageContent } = req.body;

    if (!recipientEmail || !senderName || !messageContent) {
      return res.status(400).json({
        success: false,
        message: 'recipientEmail, senderName, and messageContent are required'
      });
    }

    // Create mock data for testing
    const mockRecipient = {
      email: recipientEmail,
      name: 'Test User'
    };

    const mockSender = {
      name: senderName
    };

    const mockMessage = {
      content: messageContent,
      timestamp: new Date()
    };

    await sendUnreadMessageEmail(mockRecipient, mockSender, mockMessage, 'test-chat-id');

    res.json({
      success: true,
      message: 'Test unread message email sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test unread email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test unread email',
      error: error.message
    });
  }
});

export default router;
