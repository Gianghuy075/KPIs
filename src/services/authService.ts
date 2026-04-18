import axios from 'axios';
import type { AxiosError } from 'axios';
import type { ApiErrorBody, ChangePasswordRequest, LoginRequest, LoginResponse } from '../types/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const authAxios = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const getErrorMessage = (err: AxiosError<ApiErrorBody>): string => {
  const raw = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
  return Array.isArray(raw) ? raw.join(', ') : String(raw);
};

export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const payload: LoginRequest = { username, password };
    try {
      const res = await authAxios.post<LoginResponse>('/auth/login', payload);
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as AxiosError<ApiErrorBody>));
    }
  },

  async changePassword(payload: ChangePasswordRequest): Promise<void> {
    await authAxios.patch('/auth/change-password', payload);
  },
};
