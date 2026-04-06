import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { socket } from '../realtime';
import { useAuth } from './AuthContext';

const EMPTY_SUMMARY = {
  role: null,
  unreadCount: 0,
  hasThread: false,
  status: 'open',
  totalThreads: 0,
  unreadThreads: 0,
  unreadMessages: 0,
  priorityThreads: 0,
};

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const refreshChatSummary = useCallback(async () => {
    if (!user) {
      setSummary(EMPTY_SUMMARY);
      return EMPTY_SUMMARY;
    }

    try {
      const data = await api.get('/api/chat/summary');
      const nextSummary = { ...EMPTY_SUMMARY, ...data };
      setSummary(nextSummary);
      return nextSummary;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        setSummary(EMPTY_SUMMARY);
        return EMPTY_SUMMARY;
      }
      throw error;
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    refreshChatSummary().catch(() => {});
  }, [loading, refreshChatSummary]);

  useEffect(() => {
    if (!user) return undefined;

    const handleChatEvent = () => {
      refreshChatSummary().catch(() => {});
    };

    socket.on('chat:updated', handleChatEvent);

    return () => {
      socket.off('chat:updated', handleChatEvent);
    };
  }, [refreshChatSummary, user]);

  const value = useMemo(
    () => ({
      summary,
      refreshChatSummary,
      userUnreadCount: summary.unreadCount || 0,
      adminUnreadThreads: summary.unreadThreads || 0,
      adminUnreadMessages: summary.unreadMessages || 0,
    }),
    [refreshChatSummary, summary]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatSummary() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatSummary must be used within ChatProvider');
  }
  return ctx;
}
