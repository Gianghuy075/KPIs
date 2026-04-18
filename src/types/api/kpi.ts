import type { ApiNumber, UUID } from './common';
import type { PeriodType } from './enums';
import type { ApiPenaltyLogic } from './penalty';
import type { ApiBscCategory, ApiWorkshop } from './workshop';

export interface KpiListParams {
  year?: number | string;
  phanXuongId?: UUID;
  bscCategoryId?: UUID;
}

export interface CreateKpiRequest {
  year: number;
  phanXuongId: UUID;
  bscCategoryId: UUID;
  name: string;
  targetValue: number;
  targetUnit: string;
  weight: number;
  penaltyLogicId?: UUID;
}

export type UpdateKpiRequest = Partial<CreateKpiRequest>;

export interface ApiKpi {
  id: UUID;
  year: number;
  phanXuongId: UUID;
  bscCategoryId: UUID;
  name: string;
  targetValue: ApiNumber;
  targetUnit: string;
  weight: ApiNumber;
  penaltyLogicId?: UUID | null;
  createdById?: UUID | null;
  createdAt?: string;
  updatedAt?: string;
  bscCategory?: ApiBscCategory;
  penaltyLogic?: ApiPenaltyLogic | null;
  phanXuong?: ApiWorkshop;
}

export interface ApiPeriodTarget {
  id?: UUID;
  kpiId: UUID;
  periodType: PeriodType | string;
  periodKey: string;
  targetValue: ApiNumber;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReplacePeriodTargetsRequest {
  periodType: PeriodType | string;
  targets: Array<{
    periodKey: string;
    targetValue: number;
  }>;
}

export interface ApiMonthlyEntry {
  id?: UUID;
  kpiId: UUID;
  month: number;
  monthIndex?: number;
  actualValue?: ApiNumber | null;
  errorCount?: ApiNumber;
  note?: string;
  enteredById?: UUID | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiDailyEntry {
  id?: UUID;
  kpiId: UUID;
  entryDate?: string;
  date?: string;
  actualValue?: ApiNumber | null;
  errorCount?: ApiNumber;
  note?: string;
  enteredById?: UUID | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateMonthlyEntryRequest {
  actualValue?: number | null;
  errorCount?: number;
  note?: string;
}

export interface UpdateDailyEntryRequest {
  actualValue?: number | null;
  errorCount?: number;
  note?: string;
}
