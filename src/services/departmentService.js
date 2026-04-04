import { apiClient } from './apiClient';

export const departmentService = {
  async getDepartments() {
    const res = await apiClient.get('/departments');
    return res.data ?? res;
  },

  async createDepartment(payload) {
    const res = await apiClient.post('/departments', payload);
    return res.data ?? res;
  },

  async updateDepartment(id, payload) {
    const res = await apiClient.patch(`/departments/${id}`, payload);
    return res.data ?? res;
  },

  async deleteDepartment(id) {
    const res = await apiClient.delete(`/departments/${id}`);
    return res.data ?? res;
  },
};
