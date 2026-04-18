import type { UserRole } from './enums';
import type { UUID } from './common';
import type { ApiWorkshop } from './workshop';

export interface ApiUser {
  id: UUID;
  username: string;
  fullName: string;
  role: UserRole | string;
  phanXuongId?: UUID | null;
  managerId?: UUID | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  phanXuong?: ApiWorkshop | null;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  fullName: string;
  role: UserRole | string;
  phanXuongId?: UUID;
  managerId?: UUID;
}

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, 'password'>> & {
  isActive?: boolean;
};
