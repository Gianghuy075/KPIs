import { apiClient } from './apiClient';

export const userService = {
  getUsers: () => apiClient.get('/users').then(r => r.data),
  createUser: (payload) => apiClient.post('/users', payload).then(r => r.data),
  updateUser: (id, payload) => apiClient.patch(`/users/${id}`, payload).then(r => r.data),
  deactivateUser: (id) => apiClient.patch(`/users/${id}/deactivate`).then(r => r.data),
  activateUser: (id) => apiClient.patch(`/users/${id}`, { isActive: true }).then(r => r.data),
};
