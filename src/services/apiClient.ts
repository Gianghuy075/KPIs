import axios, {
  type AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorBody } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type TokenProvider = {
  getTokens: () => { accessToken?: string | null };
  logout?: () => void;
};

let tokenProvider: TokenProvider | null = null;

export const setTokenProvider = (provider: TokenProvider | null): void => {
  tokenProvider = provider;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!tokenProvider) return config;
  const { accessToken } = tokenProvider.getTokens();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error?.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
