import type { ApiNumber, UUID } from './common';
import type { ApiWorkshop } from './workshop';
import type { ApiKpi } from './kpi';

export interface BonusConfigListParams {
  year?: number | string;
  phanXuongId?: UUID;
}

export interface CreateBonusConfigRequest {
  year: number;
  phanXuongId: UUID;
  deptCoefficient: number;
  individualRatio: number;
}

export interface UpdateBonusConfigRequest {
  deptCoefficient?: number;
  individualRatio?: number;
}

export interface ApiWeightOverride {
  id?: UUID;
  bonusConfigId?: UUID;
  kpiId: UUID;
  customWeight: ApiNumber;
  kpi?: ApiKpi;
}

export interface ReplaceWeightOverridesRequest {
  overrides: ApiWeightOverride[];
}

export interface ApiBonusConfig {
  id: UUID;
  year: number;
  phanXuongId: UUID;
  deptCoefficient: ApiNumber;
  individualRatio: ApiNumber;
  createdById?: UUID | null;
  createdAt?: string;
  updatedAt?: string;
  phanXuong?: ApiWorkshop;
  weightOverrides?: ApiWeightOverride[];
}
