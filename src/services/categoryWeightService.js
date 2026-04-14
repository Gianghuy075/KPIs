import { apiClient } from './apiClient';

export const categoryWeightService = {
  getAdminWeights: () =>
    apiClient.get('/category-weights/admin').then((r) => r.data),

  setAdminWeights: (weights) =>
    apiClient.put('/category-weights/admin', { weights }).then((r) => r.data),

  getBranchWeights: (branchId) =>
    apiClient.get(`/category-weights/branch/${branchId}`).then((r) => r.data),

  setBranchWeights: (branchId, weights) =>
    apiClient.put(`/category-weights/branch/${branchId}`, { weights }).then((r) => r.data),
};
