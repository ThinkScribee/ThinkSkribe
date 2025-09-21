import React, { useEffect } from 'react';
import { useUnreadMessages } from '../hooks/useUnreadMessages';

// This component should be used in your chat pages to integrate unread message functionality
const ChatIntegration = ({ chatId, onMessageRead }) => {
  const { markAsRead, updateLastSeen, hasUnreadMessages, getUnreadCountForChat } = useUnreadMessages();

  // Update last seen when user enters the chat
  useEffect(() => {
    if (chatId) {
      updateLastSeen(chatId);
    }
  }, [chatId, updateLastSeen]);

  // Mark messages as read when user views the chat
  useEffect(() => {
    if (chatId && hasUnreadMessages(chatId)) {
      markAsRead(chatId);
      if (onMessageRead) {
        onMessageRead(chatId);
      }
    }
  }, [chatId, hasUnreadMessages, markAsRead, onMessageRead]);

  // You can use these functions in your chat components:
  // - hasUnreadMessages(chatId) - check if chat has unread messages
  // - getUnreadCountForChat(chatId) - get unread count for specific chat
  // - markAsRead(chatId) - mark messages as read
  // - updateLastSeen(chatId) - update last seen timestamp

  return null; // This is a utility component that doesn't render anything
};

export default ChatIntegration;
