/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';

const AuthContext = createContext(null);

function isTokenUsable(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function getInitialSession() {
  const saved = localStorage.getItem('token') || '';
  if (!saved || !isTokenUsable(saved)) {
    if (saved) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return { token: '', user: null };
  }
  try {
    const raw = localStorage.getItem('user');
    return { token: saved, user: raw ? JSON.parse(raw) : null };
  } catch {
    return { token: saved, user: null };
  }
}

export function AuthProvider({ children }) {
  const [initialSession] = useState(getInitialSession);
  const [token, setToken] = useState(initialSession.token);
  const [user, setUser] = useState(initialSession.user);
  const [loading, setLoading] = useState(Boolean(initialSession.token));

  const saveSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!isTokenUsable(currentToken)) {
      clearSession();
      setLoading(false);
      return;
    }
    try {
      const data = await apiRequest('/api/auth/me');
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch {
      clearSession();
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) return;
    if (!isTokenUsable(currentToken)) {
      return;
    }
    let active = true;
    apiRequest('/api/auth/me')
      .then((data) => {
        if (active && data?.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          setUser(data.user);
        }
      })
      .catch(() => {
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    saveSession(data.token, data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token && data.user) {
      saveSession(data.token, data.user);
    }
    return data;
  };

  const logout = () => {
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: Boolean(!loading && token && user),
        isAdmin: Boolean(!loading && user?.role === 'admin'),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
