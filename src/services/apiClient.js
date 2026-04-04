import axios from 'axios';
import { authService } from './authService';
import { formatLog } from '../utils/logFormatter';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let tokenProvider = null;
let refreshPromise = null;

export const setTokenProvider = (provider) => {
  tokenProvider = provider;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (!tokenProvider) return config;
  const { accessToken } = tokenProvider.getTokens();
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (status !== 401 || originalRequest?.__isRetry || !tokenProvider) {
      return Promise.reject(error);
    }

    const { refreshToken } = tokenProvider.getTokens();
    if (!refreshToken) {
      tokenProvider.logout?.();
      console.debug(formatLog('401 without refreshToken, logout'));
      return Promise.reject(error);
    }

    // Avoid multiple refresh calls at once
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const data = await authService.refresh(refreshToken);
        await tokenProvider.saveTokens(data.accessToken, data.refreshToken, data.user);
        refreshPromise = null;
        return data.accessToken;
      })().catch((err) => {
        refreshPromise = null;
        tokenProvider.logout?.();
        console.debug(formatLog('Refresh token failed, logout', err?.response?.data || err?.message));
        throw err;
      });
    }

    const newAccess = await refreshPromise;
    originalRequest.__isRetry = true;
    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${newAccess}`;
    return apiClient(originalRequest);
  },
);
