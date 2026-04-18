import { apiClient } from './apiClient';
import { normalizeBonusConfig } from './apiMappers';
import type {
  ApiBonusConfig,
  BonusConfigListParams,
  CreateBonusConfigRequest,
  ReplaceWeightOverridesRequest,
  UpdateBonusConfigRequest,
  UUID,
} from '../types/api';

export default {
  list: (params?: BonusConfigListParams): Promise<ApiBonusConfig[]> =>
    apiClient.get('/bonus-configs', { params }).then((response) =>
      (response.data || []).map(normalizeBonusConfig),
    ),
  create: (payload: CreateBonusConfigRequest): Promise<ApiBonusConfig> =>
    apiClient
      .post('/bonus-configs', payload)
      .then((response) => normalizeBonusConfig(response.data)),
  update: (id: UUID, payload: UpdateBonusConfigRequest): Promise<ApiBonusConfig> =>
    apiClient
      .patch(`/bonus-configs/${id}`, payload)
      .then((response) => normalizeBonusConfig(response.data)),
  saveWeightOverrides: (
    configId: UUID,
    overrides: ReplaceWeightOverridesRequest,
  ): Promise<unknown> =>
    apiClient
      .put(`/bonus-configs/${configId}/weight-overrides`, overrides)
      .then((response) => response.data),
};
