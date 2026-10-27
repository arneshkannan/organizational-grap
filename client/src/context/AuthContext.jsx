import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('orggraph_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('orggraph_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    async function verifyUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.user);
          localStorage.setItem('orggraph_user', JSON.stringify(res.user));
        } catch (err) {
          console.error('Session expired or invalid:', err);
          setUser(null);
          setToken(null);
          localStorage.removeItem('orggraph_token');
          localStorage.removeItem('orggraph_user');
        }
      }
      setLoading(false);
    }

    verifyUser();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [token]);

  const login = async ({ email, password, role, departmentId }) => {
    const res = await api.post('/auth/login', { email, password, role, departmentId });
    localStorage.setItem('orggraph_token', res.token);
    localStorage.setItem('orggraph_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const loginWithGoogle = async ({ role, departmentId, email }) => {
    const res = await api.post('/auth/google-login', { role, departmentId, email });
    localStorage.setItem('orggraph_token', res.token);
    localStorage.setItem('orggraph_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('orggraph_token');
    localStorage.removeItem('orggraph_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
