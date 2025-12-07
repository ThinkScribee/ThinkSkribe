// Example of how to integrate unread message functionality into your existing chat components

import React, { useState, useEffect } from 'react';
import { useUnreadMessages } from '../hooks/useUnreadMessages';
import UnreadMessageBadge from '../components/UnreadMessageBadge';
import UnreadMessageNotification from '../components/UnreadMessageNotification';
import ChatIntegration from '../components/ChatIntegration';

const ChatIntegrationExample = () => {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const { unreadByChat, hasUnreadMessages, getUnreadCountForChat } = useUnreadMessages();

  // Example chat list with unread indicators
  const renderChatList = () => {
    return unreadByChat.map(chat => (
      <div 
        key={chat.chatId}
        className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
          hasUnreadMessages(chat.chatId) ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        }`}
        onClick={() => setSelectedChatId(chat.chatId)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Chat {chat.chatId}</h3>
            <p className="text-sm text-gray-500">Last message preview...</p>
          </div>
          {hasUnreadMessages(chat.chatId) && (
            <UnreadMessageBadge 
              className="text-sm"
              showText={false}
            />
          )}
        </div>
      </div>
    ));
  };

  return (
    <div className="h-screen flex">
      {/* Chat List Sidebar */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Messages</h2>
          <UnreadMessageBadge showText={true} />
        </div>
        <div className="overflow-y-auto">
          {renderChatList()}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatId ? (
          <div className="flex-1 p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                Chat {selectedChatId}
                {hasUnreadMessages(selectedChatId) && (
                  <span className="ml-2 text-sm text-blue-600">
                    ({getUnreadCountForChat(selectedChatId)} unread)
                  </span>
                )}
              </h3>
            </div>
            
            {/* Your existing chat component would go here */}
            <div className="border rounded-lg p-4 h-96 bg-gray-50">
              <p className="text-gray-500">Your chat messages would appear here...</p>
            </div>

            {/* Integration component - this handles the unread message logic */}
            <ChatIntegration 
              chatId={selectedChatId}
              onMessageRead={(chatId) => {
                console.log(`Messages marked as read for chat ${chatId}`);
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a chat to start messaging
          </div>
        )}
      </div>

      {/* Unread Message Notifications */}
      <UnreadMessageNotification />
    </div>
  );
};

export default ChatIntegrationExample;
