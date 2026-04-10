import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { setTokenProvider } from '../services/apiClient';
import { roleLabels, legacyRoleMap } from '../constants/roles';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('accessToken');
    const savedRefresh = localStorage.getItem('refreshToken');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedToken) setToken(savedToken);
    if (savedRefresh) setRefreshToken(savedRefresh);
    setInitialized(true);
  }, []);

  useEffect(() => {
    setTokenProvider({
      getTokens: () => ({ accessToken: token, refreshToken }),
      saveTokens: (newAccess, newRefresh, newUser) => {
        if (newAccess) {
          setToken(newAccess);
          localStorage.setItem('accessToken', newAccess);
        }
        if (newRefresh) {
          setRefreshToken(newRefresh);
          localStorage.setItem('refreshToken', newRefresh);
        }
        if (newUser) {
          setUser(newUser);
          localStorage.setItem('currentUser', JSON.stringify(newUser));
        }
      },
      logout,
    });
  }, [token, refreshToken, user]);

  const normalizeRole = (role) => legacyRoleMap[role] || role;

  const login = async (identifier, password) => {
    const data = await authService.login(identifier, password);
    const normalizedRole = normalizeRole(data?.user?.role);

    const userData = {
      ...data.user,
      role: normalizedRole,
      name: getRoleName(normalizedRole),
      loginTime: new Date().toISOString(),
    };

    setUser(userData);
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    return userData;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  const getRoleName = (role) => {
    return roleLabels[normalizeRole(role)] || role;
  };

  return (
    <AuthContext.Provider value={{ user, token, refreshToken, login, logout, initialized }}>
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
