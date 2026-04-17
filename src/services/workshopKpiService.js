import { apiClient } from './apiClient';

export default {
  listWorkshops: () => apiClient.get('/phan-xuong').then(r => r.data),
  createWorkshop: (payload) => apiClient.post('/phan-xuong', payload).then(r => r.data),
  updateWorkshop: (id, payload) => apiClient.patch(`/phan-xuong/${id}`, payload).then(r => r.data),
  removeWorkshop: (id) => apiClient.delete(`/phan-xuong/${id}`),

  listBscCategories: () => apiClient.get('/bsc-categories').then(r => r.data),

  list: (params) => apiClient.get('/kpis', { params }).then(r => r.data),
  create: (payload) => apiClient.post('/kpis', payload).then(r => r.data),
  update: (id, payload) => apiClient.patch(`/kpis/${id}`, payload).then(r => r.data),
  remove: (id) => apiClient.delete(`/kpis/${id}`),

  getPeriodTargets: (kpiId, periodType) =>
    apiClient.get(`/kpis/${kpiId}/period-targets`, { params: { periodType } }).then(r => r.data),
  savePeriodTargets: (kpiId, targets) =>
    apiClient.put(`/kpis/${kpiId}/period-targets`, targets).then(r => r.data),

  getMonthlyEntries: (kpiId) =>
    apiClient.get(`/kpis/${kpiId}/monthly-entries`).then(r => r.data),
  updateMonthlyEntry: (kpiId, month, payload) =>
    apiClient.patch(`/kpis/${kpiId}/monthly-entries/${month}`, payload).then(r => r.data),

  getDailyEntry: (kpiId, date) =>
    apiClient.get(`/kpis/${kpiId}/daily-entries/${date}`).then(r => r.data),
  updateDailyEntry: (kpiId, date, payload) =>
    apiClient.patch(`/kpis/${kpiId}/daily-entries/${date}`, payload).then(r => r.data),
};
