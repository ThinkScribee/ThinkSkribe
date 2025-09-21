import React from 'react';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import { MessageCircle } from 'lucide-react';

const UnreadMessageBadge = ({ className = '', showText = false }) => {
  const { unreadCount, loading } = useUnreadMessages();

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <MessageCircle className="w-5 h-5 text-gray-400" />
        {showText && <span className="text-sm text-gray-500">Loading...</span>}
      </div>
    );
  }

  if (unreadCount === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <MessageCircle className="w-5 h-5 text-gray-400" />
        {showText && <span className="text-sm text-gray-500">No new messages</span>}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <MessageCircle className="w-5 h-5 text-blue-600" />
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      </div>
      {showText && (
        <span className="text-sm text-gray-700">
          {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
};

export default UnreadMessageBadge;
