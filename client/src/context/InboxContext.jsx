import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { socket } from '../realtime';
import { useAuth } from './AuthContext';

const EMPTY_SUMMARY = {
  total: 0,
  unreadReplies: 0,
};

const InboxContext = createContext(null);

export function InboxProvider({ children }) {
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const refreshInbox = useCallback(async () => {
    if (!user) {
      setSummary(EMPTY_SUMMARY);
      return EMPTY_SUMMARY;
    }

    try {
      const data = await api.get('/api/messages/mine/summary');
      setSummary(data);
      return data;
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
    refreshInbox().catch(() => {});
  }, [loading, refreshInbox]);

  useEffect(() => {
    if (!user) return undefined;

    const handleInboxEvent = () => {
      refreshInbox().catch(() => {});
    };

    socket.on('user:messages', handleInboxEvent);

    return () => {
      socket.off('user:messages', handleInboxEvent);
    };
  }, [refreshInbox, user]);

  const value = useMemo(
    () => ({
      summary,
      refreshInbox,
      unreadReplies: summary.unreadReplies,
    }),
    [refreshInbox, summary]
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) {
    throw new Error('useInbox must be used within InboxProvider');
  }
  return ctx;
}
