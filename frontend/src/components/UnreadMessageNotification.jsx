import React, { useState, useEffect } from 'react';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { Bell, MessageCircle, X } from 'lucide-react';

const UnreadMessageNotification = () => {
  const { unreadCount, unreadByChat, markAsRead, updateLastSeen } = useUnreadMessages();
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [lastNotifiedMessage, setLastNotifiedMessage] = useState(null);

  // Show notification when new unread messages arrive
  useEffect(() => {
    if (unreadCount > 0 && unreadByChat.length > 0) {
      const latestChat = unreadByChat[unreadByChat.length - 1];
      if (latestChat && latestChat.lastMessage) {
        const messageId = `${latestChat.chatId}-${latestChat.lastMessage.timestamp}`;
        
        // Only show notification if this is a new message
        if (lastNotifiedMessage !== messageId) {
          setCurrentNotification({
            chatId: latestChat.chatId,
            senderName: latestChat.lastMessage.sender?.name || 'Someone',
            message: latestChat.lastMessage.content,
            count: latestChat.count
          });
          setShowNotification(true);
          setLastNotifiedMessage(messageId);

          // Auto-hide after 5 seconds
          const timer = setTimeout(() => {
            setShowNotification(false);
          }, 5000);

          return () => clearTimeout(timer);
        }
      }
    }
  }, [unreadCount, unreadByChat, lastNotifiedMessage]);

  const handleNotificationClick = () => {
    if (currentNotification) {
      // Mark as read and navigate to chat
      markAsRead(currentNotification.chatId);
      setShowNotification(false);
      
      // Navigate to chat (you can customize this based on your routing)
      window.location.href = `/chat/${currentNotification.chatId}`;
    }
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || !currentNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-slide-in">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                New message from {currentNotification.senderName}
              </p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {currentNotification.message}
              </p>
              {currentNotification.count > 1 && (
                <p className="text-xs text-gray-400 mt-1">
                  +{currentNotification.count - 1} more message{currentNotification.count > 2 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleNotificationClick}
            className="flex-1 bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            View Message
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 bg-gray-100 text-gray-700 text-xs font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default UnreadMessageNotification;
