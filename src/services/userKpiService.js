import { apiClient } from './apiClient';

export const userKpiService = {
  async listMine() {
    const res = await apiClient.get('/user-kpis/me');
    return res.data ?? res;
  },
};
