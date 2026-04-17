import { apiClient } from './apiClient';

export default {
  list: () => apiClient.get('/penalty-logics').then(r => r.data),
  create: (payload) => apiClient.post('/penalty-logics', payload).then(r => r.data),
  update: (id, payload) => apiClient.patch(`/penalty-logics/${id}`, payload).then(r => r.data),
  remove: (id) => apiClient.delete(`/penalty-logics/${id}`),
};
