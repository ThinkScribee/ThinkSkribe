import express from 'express';
import { protect } from '../middlewares/auth.js';
import { 
  markMessagesAsRead, 
  getUnreadMessageCount, 
  updateUserLastSeen,
  getUserLastSeen 
} from '../services/unreadMessageService.js';
import { triggerUnreadCheck } from '../services/schedulerService.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/unread/mark-read/:chatId
// @desc    Mark messages as read for a specific chat
// @access  Private
router.post('/mark-read/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    await markMessagesAsRead(userId, chatId);
    
    res.json({ 
      success: true, 
      message: 'Messages marked as read',
      chatId 
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read',
      error: error.message 
    });
  }
});

// @route   GET /api/unread/count
// @desc    Get unread message count for the user
// @access  Private
router.get('/count', async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadData = await getUnreadMessageCount(userId);
    
    res.json({
      success: true,
      data: unreadData
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get unread count',
      error: error.message 
    });
  }
});

// @route   POST /api/unread/update-last-seen/:chatId
// @desc    Update user's last seen timestamp for a chat
// @access  Private
router.post('/update-last-seen/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    updateUserLastSeen(userId, chatId);
    
    res.json({ 
      success: true, 
      message: 'Last seen timestamp updated',
      chatId,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error updating last seen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update last seen',
      error: error.message 
    });
  }
});

// @route   GET /api/unread/last-seen/:chatId
// @desc    Get user's last seen timestamp for a chat
// @access  Private
router.get('/last-seen/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const lastSeen = getUserLastSeen(userId, chatId);
    
    res.json({ 
      success: true, 
      data: {
        chatId,
        lastSeen,
        userId
      }
    });
  } catch (error) {
    console.error('Error getting last seen:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get last seen',
      error: error.message 
    });
  }
});

// @route   POST /api/unread/trigger-check
// @desc    Manually trigger unread message check (for testing)
// @access  Private (Admin only)
router.post('/trigger-check', async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin role required.' 
      });
    }

    await triggerUnreadCheck();
    
    res.json({ 
      success: true, 
      message: 'Unread message check triggered successfully' 
    });
  } catch (error) {
    console.error('Error triggering unread check:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to trigger unread check',
      error: error.message 
    });
  }
});

export default router;
