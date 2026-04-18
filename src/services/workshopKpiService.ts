import { apiClient } from './apiClient';
import {
  normalizeDailyEntry,
  normalizeKpi,
  normalizeMonthlyEntry,
  normalizePeriodTarget,
} from './apiMappers';
import type {
  ApiBscCategory,
  ApiDailyEntry,
  ApiKpi,
  ApiMonthlyEntry,
  ApiPeriodTarget,
  ApiWorkshop,
  CreateKpiBulkRequest,
  KpiListParams,
  PeriodType,
  ReplacePeriodTargetsRequest,
  UpsertKpiBulkRequest,
  UpdateDailyEntryRequest,
  UpdateMonthlyEntryRequest,
  UUID,
} from '../types/api';

export default {
  listWorkshops: (): Promise<ApiWorkshop[]> =>
    apiClient.get('/phan-xuong').then((response) => response.data || []),
  createWorkshop: (payload: Partial<ApiWorkshop>): Promise<ApiWorkshop> =>
    apiClient.post('/phan-xuong', payload).then((response) => response.data),
  updateWorkshop: (id: UUID, payload: Partial<ApiWorkshop>): Promise<ApiWorkshop> =>
    apiClient.patch(`/phan-xuong/${id}`, payload).then((response) => response.data),
  removeWorkshop: (id: UUID): Promise<void> =>
    apiClient.delete(`/phan-xuong/${id}`).then(() => undefined),

  listBscCategories: (): Promise<ApiBscCategory[]> =>
    apiClient.get('/bsc-categories').then((response) => response.data || []),

  list: (params?: KpiListParams): Promise<ApiKpi[]> =>
    apiClient.get('/kpis', { params }).then((response) =>
      (response.data || []).map(normalizeKpi),
    ),
  create: (payload: Partial<ApiKpi>): Promise<ApiKpi> =>
    apiClient.post('/kpis', payload).then((response) => normalizeKpi(response.data)),
  createBulk: (payload: CreateKpiBulkRequest): Promise<ApiKpi[]> =>
    apiClient
      .post('/kpis/bulk', payload)
      .then((response) => (response.data || []).map(normalizeKpi)),
  upsertBulk: (payload: UpsertKpiBulkRequest): Promise<ApiKpi[]> =>
    apiClient
      .post('/kpis/bulk', payload)
      .then((response) => (response.data || []).map(normalizeKpi)),
  update: (id: UUID, payload: Partial<ApiKpi>): Promise<ApiKpi> =>
    apiClient.patch(`/kpis/${id}`, payload).then((response) => normalizeKpi(response.data)),
  remove: (id: UUID): Promise<void> =>
    apiClient.delete(`/kpis/${id}`).then(() => undefined),

  getPeriodTargets: (kpiId: UUID, periodType?: PeriodType): Promise<ApiPeriodTarget[]> =>
    apiClient.get(`/kpis/${kpiId}/period-targets`, { params: { periodType } }).then((response) =>
      (response.data || []).map(normalizePeriodTarget),
    ),
  savePeriodTargets: (
    kpiId: UUID,
    payload: ReplacePeriodTargetsRequest,
  ): Promise<ApiPeriodTarget[]> =>
    apiClient
      .put(`/kpis/${kpiId}/period-targets`, payload)
      .then((response) => (response.data || []).map(normalizePeriodTarget)),

  getMonthlyEntries: (kpiId: UUID): Promise<ApiMonthlyEntry[]> =>
    apiClient.get(`/kpis/${kpiId}/monthly-entries`).then((response) =>
      (response.data || []).map(normalizeMonthlyEntry),
    ),
  updateMonthlyEntry: (
    kpiId: UUID,
    month: number,
    payload: UpdateMonthlyEntryRequest,
  ): Promise<ApiMonthlyEntry> =>
    apiClient
      .patch(`/kpis/${kpiId}/monthly-entries/${month}`, payload)
      .then((response) => normalizeMonthlyEntry(response.data)),

  listDailyEntries: (kpiId: UUID, from?: string, to?: string): Promise<ApiDailyEntry[]> =>
    apiClient.get(`/kpis/${kpiId}/daily-entries`, { params: { from, to } }).then((response) =>
      (response.data || []).map(normalizeDailyEntry),
    ),
  getDailyEntry: (kpiId: UUID, date: string): Promise<ApiDailyEntry> =>
    apiClient
      .get(`/kpis/${kpiId}/daily-entries/${date}`)
      .then((response) => normalizeDailyEntry(response.data)),
  updateDailyEntry: (
    kpiId: UUID,
    date: string,
    payload: UpdateDailyEntryRequest,
  ): Promise<ApiDailyEntry> =>
    apiClient
      .patch(`/kpis/${kpiId}/daily-entries/${date}`, payload)
      .then((response) => normalizeDailyEntry(response.data)),
};
