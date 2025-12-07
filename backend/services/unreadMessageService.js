import Chat from '../models/Chat.js';
import User from '../models/User.js';
import { sendUnreadMessageEmail, sendUnreadMessagesSummaryEmail } from './resendEmailService.js';

// Track user's last seen timestamp for each chat
// Note: This is in-memory storage. For production, consider using Redis or database storage
const userLastSeen = new Map();

// Update user's last seen timestamp for a specific chat
export const updateUserLastSeen = (userId, chatId) => {
  const key = `${userId}-${chatId}`;
  userLastSeen.set(key, new Date());
  console.log(`Updated last seen for user ${userId} in chat ${chatId}`);
};

// Get user's last seen timestamp for a specific chat
export const getUserLastSeen = (userId, chatId) => {
  const key = `${userId}-${chatId}`;
  return userLastSeen.get(key) || new Date(0); // Return epoch if never seen
};

// Check for unread messages and send email notifications
export const checkAndSendUnreadNotifications = async () => {
  try {
    console.log('🔍 Checking for unread messages...');
    
    // Get all active chats with messages
    const chats = await Chat.find({ 'messages.0': { $exists: true } })
      .populate('participants', 'name email role emailNotifications lastEmailNotification')
      .lean();

    const notificationsToSend = [];

    for (const chat of chats) {
      if (chat.participants.length !== 2) continue; // Skip group chats for now

      const [participant1, participant2] = chat.participants;
      
      // Check unread messages for each participant
      await checkParticipantUnreadMessages(chat, participant1, participant2, notificationsToSend);
      await checkParticipantUnreadMessages(chat, participant2, participant1, notificationsToSend);
    }

    // Send notifications sequentially to avoid rate limiting
    console.log(`📧 Sending ${notificationsToSend.length} notifications sequentially...`);
    
    for (let i = 0; i < notificationsToSend.length; i++) {
      const notification = notificationsToSend[i];
      try {
        console.log(`📧 Sending notification ${i + 1}/${notificationsToSend.length} to ${notification.recipient.email}`);
        
        if (notification.type === 'single') {
          await sendUnreadMessageEmail(
            notification.recipient,
            notification.sender,
            notification.message,
            notification.chatId
          );
        } else if (notification.type === 'summary') {
          await sendUnreadMessagesSummaryEmail(
            notification.recipient,
            notification.messages
          );
        }

        // Update last email notification timestamp
        await User.findByIdAndUpdate(notification.recipient._id, {
          lastEmailNotification: new Date()
        });

        console.log(`✅ Sent ${notification.type} notification to ${notification.recipient.email}`);
      } catch (error) {
        console.error(`❌ Failed to send notification to ${notification.recipient.email}:`, error.message);
        // Continue with next notification even if one fails
      }
    }

    console.log(`📧 Processed ${notificationsToSend.length} notifications`);
  } catch (error) {
    console.error('Error in checkAndSendUnreadNotifications:', error);
  }
};

// Check unread messages for a specific participant
const checkParticipantUnreadMessages = async (chat, participant, otherParticipant, notificationsToSend) => {
  // Skip if participant has disabled email notifications
  if (!participant.emailNotifications) return;

  // Get participant's last seen timestamp
  const lastSeen = getUserLastSeen(participant._id.toString(), chat._id.toString());
  
  // Find unread messages from the other participant
  const unreadMessages = chat.messages.filter(msg => 
    msg.sender && msg.sender.toString() === otherParticipant._id.toString() &&
    new Date(msg.timestamp) > lastSeen &&
    !msg.read
  );

  if (unreadMessages.length === 0) return;

  // Check if we should send notification (avoid spam)
  const now = new Date();
  const lastNotification = participant.lastEmailNotification;
  
  // First notification: send immediately if no previous notification
  // Subsequent notifications: wait 4 hours
  const notificationCooldown = lastNotification ? 4 * 60 * 60 * 1000 : 0; // 4 hours or immediate

  if (lastNotification && (now - new Date(lastNotification)) < notificationCooldown) {
    console.log(`⏰ Skipping notification for ${participant.email} - too recent (last sent: ${lastNotification})`);
    return;
  }

  // Prepare notification
  if (unreadMessages.length === 1) {
    // Single message notification
    const message = unreadMessages[0];
    notificationsToSend.push({
      type: 'single',
      recipient: participant,
      sender: otherParticipant,
      message: {
        content: message.content,
        timestamp: message.timestamp
      },
      chatId: chat._id
    });
  } else {
    // Multiple messages summary
    const messages = unreadMessages.map(msg => ({
      content: msg.content,
      timestamp: msg.timestamp,
      sender: otherParticipant,
      chatId: chat._id
    }));

    notificationsToSend.push({
      type: 'summary',
      recipient: participant,
      messages: messages
    });
  }
};

// Mark messages as read for a user in a specific chat
export const markMessagesAsRead = async (userId, chatId) => {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return;

    // Update message read status for messages from other participants
    let updatedCount = 0;
    chat.messages.forEach(msg => {
      if (msg.sender && msg.sender.toString() !== userId.toString() && !msg.read) {
        msg.read = true;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await chat.save();
    }

    // Update last seen timestamp
    updateUserLastSeen(userId, chatId);

    console.log(`✅ Marked ${updatedCount} messages as read for user ${userId} in chat ${chatId}`);
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Get unread message count for a user
export const getUnreadMessageCount = async (userId) => {
  try {
    const chats = await Chat.find({
      participants: userId
    }).populate('participants', 'name email');

    let totalUnread = 0;
    const unreadByChat = [];

    for (const chat of chats) {
      const lastSeen = getUserLastSeen(userId, chat._id.toString());
      
      const unreadCount = chat.messages.filter(msg => 
        msg.sender && msg.sender.toString() !== userId.toString() &&
        new Date(msg.timestamp) > lastSeen &&
        !msg.read
      ).length;

      if (unreadCount > 0) {
        totalUnread += unreadCount;
        const lastMessage = chat.messages[chat.messages.length - 1];
        unreadByChat.push({
          chatId: chat._id,
          count: unreadCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            sender: chat.participants.find(p => p._id.toString() === lastMessage.sender?.toString())
          } : null
        });
      }
    }

    return {
      total: totalUnread,
      byChat: unreadByChat
    };
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return { total: 0, byChat: [] };
  }
};

// Send immediate notification for new message (called when message is sent)
export const sendImmediateNotification = async (chatId, senderId, messageContent) => {
  try {
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name email role emailNotifications lastEmailNotification')
      .lean();

    if (!chat || chat.participants.length !== 2) return;

    const [participant1, participant2] = chat.participants;
    const recipient = participant1._id.toString() === senderId.toString() ? participant2 : participant1;
    const sender = participant1._id.toString() === senderId.toString() ? participant1 : participant2;

    // Check if recipient has email notifications enabled
    if (!recipient.emailNotifications) return;

    // Check if recipient has never received an email (first notification)
    if (!recipient.lastEmailNotification) {
      console.log(`📧 Sending immediate notification to ${recipient.email} for new message`);
      
      await sendUnreadMessageEmail(
        recipient,
        sender,
        { content: messageContent, timestamp: new Date() },
        chatId
      );

      // Update last email notification timestamp
      await User.findByIdAndUpdate(recipient._id, {
        lastEmailNotification: new Date()
      });
    }
  } catch (error) {
    console.error('Error sending immediate notification:', error);
  }
};

// Clean up old last seen data (run periodically)
export const cleanupLastSeenData = () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  for (const [key, timestamp] of userLastSeen.entries()) {
    if (timestamp < oneWeekAgo) {
      userLastSeen.delete(key);
    }
  }

  console.log(`🧹 Cleaned up last seen data. Current entries: ${userLastSeen.size}`);
};
