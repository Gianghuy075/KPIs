import { apiClient } from './apiClient';

export const userService = {
  async getUsers() {
    const res = await apiClient.get('/users');
    return res.data ?? res;
  },

  async createUser(payload) {
    const res = await apiClient.post('/users', payload);
    return res.data ?? res;
  },

  async updateUser(id, payload) {
    const res = await apiClient.patch(`/users/${id}`, payload);
    return res.data ?? res;
  },

  async deleteUser(id) {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data ?? res;
  },
};
