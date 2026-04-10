import { apiClient } from './apiClient';

export const companyKpiService = {
  async list() {
    const res = await apiClient.get('/kpis');
    return res.data ?? res;
  },
  async create(payload) {
    const res = await apiClient.post('/kpis', payload);
    return res.data ?? res;
  },
  async update(id, payload) {
    const res = await apiClient.patch(`/kpis/${id}`, payload);
    return res.data ?? res;
  },
  async remove(id) {
    const res = await apiClient.delete(`/kpis/${id}`);
    return res.data ?? res;
  },
  async distribute(id) {
    const res = await apiClient.post(`/kpis/${id}/distribute`);
    return res.data ?? res;
  },
};
