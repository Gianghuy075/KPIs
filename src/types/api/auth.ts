import type { ApiUser } from './users';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  user: ApiUser;
}
