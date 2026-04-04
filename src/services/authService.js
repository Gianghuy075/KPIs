import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const authAxios = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const authService = {
  async login(identifier, password) {
    try {
      const res = await authAxios.post('/auth/login', { identifier, password });
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }
  },

  async refresh(refreshToken) {
    try {
      const res = await authAxios.post('/auth/refresh', { refreshToken });
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Refresh token failed';
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }
  },
};
