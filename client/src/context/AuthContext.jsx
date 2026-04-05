import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';
import { setSocketAuth } from '../realtime';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    const token = localStorage.getItem('token');
    setSocketAuth(token);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get('/api/auth/me');
      setUser(me);
    } catch {
      localStorage.removeItem('token');
      setSocketAuth(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setSocketAuth(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, name) => {
    const data = await api.post('/api/auth/register', { email, password, name });
    localStorage.setItem('token', data.token);
    setSocketAuth(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setSocketAuth(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await api.get('/api/auth/me');
    setUser(me);
    return me;
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
