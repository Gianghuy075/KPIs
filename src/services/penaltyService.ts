import { apiClient } from './apiClient';
import { normalizePenaltyLogic } from './apiMappers';
import type {
  ApiPenaltyLogic,
  CreatePenaltyLogicRequest,
  UpdatePenaltyLogicRequest,
  UUID,
} from '../types/api';

export default {
  list: (): Promise<ApiPenaltyLogic[]> =>
    apiClient.get('/penalty-logics').then((response) =>
      (response.data || []).map(normalizePenaltyLogic),
    ),
  create: (payload: CreatePenaltyLogicRequest): Promise<ApiPenaltyLogic> =>
    apiClient
      .post('/penalty-logics', payload)
      .then((response) => normalizePenaltyLogic(response.data)),
  update: (id: UUID, payload: UpdatePenaltyLogicRequest): Promise<ApiPenaltyLogic> =>
    apiClient
      .patch(`/penalty-logics/${id}`, payload)
      .then((response) => normalizePenaltyLogic(response.data)),
  remove: (id: UUID): Promise<void> =>
    apiClient.delete(`/penalty-logics/${id}`).then(() => undefined),
};
