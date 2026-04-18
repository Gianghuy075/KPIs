import type { UUID } from './common';

export interface ApiWorkshop {
  id: UUID;
  code: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiBscCategory {
  id: UUID;
  name: string;
  sortOrder?: number;
  createdAt?: string;
}
