import { apiClient } from './apiClient';

export default {
  list: (params) => apiClient.get('/bonus-configs', { params }).then(r => r.data),
  create: (payload) => apiClient.post('/bonus-configs', payload).then(r => r.data),
  update: (id, payload) => apiClient.patch(`/bonus-configs/${id}`, payload).then(r => r.data),
  saveWeightOverrides: (configId, overrides) =>
    apiClient.put(`/bonus-configs/${configId}/weight-overrides`, overrides).then(r => r.data),
};
