/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { setTokenProvider } from '../services/apiClient';
import { legacyRoleMap } from '../constants/roles';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('accessToken');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedToken) setToken(savedToken);
    setInitialized(true);
  }, []);

  useEffect(() => {
    setTokenProvider({
      getTokens: () => ({ accessToken: token }),
      logout,
    });
  }, [token, user]);

  const normalizeRole = (role) => legacyRoleMap[role] || role;

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    const normalizedRole = normalizeRole(data?.user?.role);

    const userData = {
      ...data.user,
      role: normalizedRole,
      name: data.user.fullName || data.user.username,
      loginTime: new Date().toISOString(),
    };

    setUser(userData);
    setToken(data.accessToken);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('accessToken', data.accessToken);

    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
  };
  return (
    <AuthContext.Provider value={{ user, token, login, logout, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
