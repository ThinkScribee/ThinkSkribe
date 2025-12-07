import cron from 'node-cron';
import { checkAndSendUnreadNotifications, cleanupLastSeenData } from './unreadMessageService.js';

// Schedule jobs
export const startScheduledJobs = () => {
  console.log('🕐 Starting scheduled jobs...');

  // Check for unread messages every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    console.log('⏰ Running unread message check (every 4 hours)...');
    try {
      await checkAndSendUnreadNotifications();
    } catch (error) {
      console.error('Error in unread message check:', error);
    }
  });

  // Clean up old data every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🧹 Running data cleanup...');
    try {
      cleanupLastSeenData();
    } catch (error) {
      console.error('Error in data cleanup:', error);
    }
  });

  // Daily cleanup at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('🌙 Running daily cleanup...');
    try {
      cleanupLastSeenData();
      console.log('Daily cleanup completed');
    } catch (error) {
      console.error('Error in daily cleanup:', error);
    }
  });

  console.log('✅ Scheduled jobs started successfully');
};

// Manual trigger for testing
export const triggerUnreadCheck = async () => {
  console.log('🔍 Manual trigger: Checking for unread messages...');
  try {
    await checkAndSendUnreadNotifications();
    console.log('✅ Manual unread check completed');
  } catch (error) {
    console.error('❌ Manual unread check failed:', error);
    throw error;
  }
};
