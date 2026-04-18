import type { ApiNumber, UUID } from './common';
import type { PenaltyType } from './enums';

export interface ApiPenaltyTier {
  id?: UUID;
  penaltyLogicId?: UUID;
  minErrors: number;
  maxErrors: number;
  deduction: ApiNumber;
  sortOrder?: number;
}

export interface ApiPenaltyLogic {
  id: UUID;
  name: string;
  description?: string | null;
  type: PenaltyType | string;
  fixedPoints?: ApiNumber | null;
  percentPerError?: ApiNumber | null;
  maxDeduction?: ApiNumber | null;
  isSystemDefault?: boolean;
  createdById?: UUID | null;
  tiers?: ApiPenaltyTier[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePenaltyLogicRequest {
  name: string;
  description?: string;
  type: PenaltyType | string;
  fixedPoints?: number;
  percentPerError?: number;
  maxDeduction?: number;
  tiers?: ApiPenaltyTier[];
}

export type UpdatePenaltyLogicRequest = Partial<CreatePenaltyLogicRequest>;
