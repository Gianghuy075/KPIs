import { apiClient } from './apiClient';
import type { ApiUser, CreateUserRequest, UpdateUserRequest, UUID } from '../types/api';

export const userService = {
  getUsers: (): Promise<ApiUser[]> => apiClient.get('/users').then((response) => response.data),
  createUser: (payload: CreateUserRequest): Promise<ApiUser> =>
    apiClient.post('/users', payload).then((response) => response.data),
  updateUser: (id: UUID, payload: UpdateUserRequest): Promise<ApiUser> =>
    apiClient.patch(`/users/${id}`, payload).then((response) => response.data),
  deactivateUser: (id: UUID): Promise<ApiUser> =>
    apiClient.patch(`/users/${id}/deactivate`).then((response) => response.data),
  activateUser: (id: UUID): Promise<ApiUser> =>
    apiClient.patch(`/users/${id}`, { isActive: true }).then((response) => response.data),
};
