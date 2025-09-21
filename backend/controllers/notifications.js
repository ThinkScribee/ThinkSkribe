import Notification from '../models/Notification.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get all notifications for a user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = asyncHandler(async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      read: false 
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching notifications' 
    });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate notification ID
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Notification ID is required' 
      });
    }

    // Find and update notification
    const notification = await Notification.findOneAndUpdate(
      { 
        _id: id, 
        user: req.user._id  // Ensure user owns this notification
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification not found or access denied' 
      });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      read: false 
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid notification ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error marking notification as read' 
    });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = asyncHandler(async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error marking all notifications as read' 
    });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'Notification ID is required' 
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: req.user._id  // Ensure user owns this notification
    });

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: 'Notification not found or access denied' 
      });
    }

    // Get updated unread count
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      read: false 
    });

    res.json({
      success: true,
      message: 'Notification deleted',
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid notification ID format' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error deleting notification' 
    });
  }
});

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      read: false 
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error getting unread count' 
    });
  }
});