import { apiClient } from './apiClient';

export const branchService = {
  async getBranches() {
    const res = await apiClient.get('/branches');
    return res.data ?? res;
  },

  async createBranch(payload) {
    const res = await apiClient.post('/branches', payload);
    return res.data ?? res;
  },

  async updateBranch(id, payload) {
    const res = await apiClient.patch(`/branches/${id}`, payload);
    return res.data ?? res;
  },

  async deleteBranch(id) {
    const res = await apiClient.delete(`/branches/${id}`);
    return res.data ?? res;
  },

  // Lấy chi nhánh theo ID cùng các phòng ban của nó
  async getBranchWithDepartments(id) {
    const res = await apiClient.get(`/branches/${id}/departments`);
    return res.data ?? res;
  },
};
