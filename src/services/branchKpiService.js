import { apiClient } from './apiClient';

export const branchKpiService = {
  async listByBranch(branchId) {
    const res = await apiClient.get('/branch-kpis', { params: { branchId } });
    return res.data ?? res;
  },
};
