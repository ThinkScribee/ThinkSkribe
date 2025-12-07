import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadByChat, setUnreadByChat] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/unread/count');
      
      if (response.data.success) {
        setUnreadCount(response.data.data.total);
        setUnreadByChat(response.data.data.byChat);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
      setError(err.response?.data?.message || 'Failed to fetch unread count');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark messages as read for a specific chat
  const markAsRead = useCallback(async (chatId) => {
    if (!user || !chatId) return;

    try {
      const response = await api.post(`/unread/mark-read/${chatId}`);
      
      if (response.data.success) {
        // Update local state
        setUnreadByChat(prev => prev.filter(chat => chat.chatId !== chatId));
        setUnreadCount(prev => {
          const chatToRemove = unreadByChat.find(chat => chat.chatId === chatId);
          return prev - (chatToRemove?.count || 0);
        });
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
      setError(err.response?.data?.message || 'Failed to mark messages as read');
    }
  }, [user, unreadByChat]);

  // Update last seen timestamp for a chat
  const updateLastSeen = useCallback(async (chatId) => {
    if (!user || !chatId) return;

    try {
      await api.post(`/unread/update-last-seen/${chatId}`);
    } catch (err) {
      console.error('Error updating last seen:', err);
    }
  }, [user]);

  // Get unread count for a specific chat
  const getUnreadCountForChat = useCallback((chatId) => {
    const chat = unreadByChat.find(c => c.chatId === chatId);
    return chat ? chat.count : 0;
  }, [unreadByChat]);

  // Check if a chat has unread messages
  const hasUnreadMessages = useCallback((chatId) => {
    return getUnreadCountForChat(chatId) > 0;
  }, [getUnreadCountForChat]);

  // Auto-fetch unread count on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Set up interval to periodically check for unread messages
      const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    unreadByChat,
    loading,
    error,
    fetchUnreadCount,
    markAsRead,
    updateLastSeen,
    getUnreadCountForChat,
    hasUnreadMessages
  };
};
