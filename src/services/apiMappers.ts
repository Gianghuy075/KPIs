import type {
  ApiBonusConfig,
  ApiDailyEntry,
  ApiKpi,
  ApiMonthlyEntry,
  ApiNumber,
  ApiPenaltyLogic,
  ApiPenaltyTier,
  ApiPeriodTarget,
  ApiWeightOverride,
} from '../types/api';

export const toNumber = (value: ApiNumber | null | undefined, fallback = 0): number => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toNullableNumber = (
  value: ApiNumber | null | undefined,
): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizePenaltyTier = (tier: ApiPenaltyTier): ApiPenaltyTier => ({
  ...tier,
  minErrors: toNumber(tier.minErrors),
  maxErrors: toNumber(tier.maxErrors),
  deduction: toNumber(tier.deduction),
  sortOrder: toNumber(tier.sortOrder, 0),
});

export const normalizePenaltyLogic = (logic: ApiPenaltyLogic): ApiPenaltyLogic => ({
  ...logic,
  fixedPoints: toNullableNumber(logic.fixedPoints),
  percentPerError: toNullableNumber(logic.percentPerError),
  maxDeduction: toNullableNumber(logic.maxDeduction),
  tiers: (logic.tiers || []).map(normalizePenaltyTier),
});

export const normalizeKpi = (kpi: ApiKpi): ApiKpi => ({
  ...kpi,
  year: toNumber(kpi.year),
  targetValue: toNumber(kpi.targetValue),
  weight: toNumber(kpi.weight),
});

export const normalizePeriodTarget = (target: ApiPeriodTarget): ApiPeriodTarget => ({
  ...target,
  targetValue: toNumber(target.targetValue),
});

export const normalizeMonthlyEntry = (entry: ApiMonthlyEntry): ApiMonthlyEntry => ({
  ...entry,
  month: toNumber(entry.month),
  actualValue: toNullableNumber(entry.actualValue),
  errorCount: toNumber(entry.errorCount, 0),
  note: entry.note ?? '',
});

export const normalizeDailyEntry = (entry: ApiDailyEntry): ApiDailyEntry => ({
  ...entry,
  actualValue: toNullableNumber(entry.actualValue),
  errorCount: toNumber(entry.errorCount, 0),
  note: entry.note ?? '',
  entryDate: entry.entryDate ?? entry.date,
});

export const normalizeWeightOverride = (override: ApiWeightOverride): ApiWeightOverride => ({
  ...override,
  customWeight: toNumber(override.customWeight),
});

export const normalizeBonusConfig = (config: ApiBonusConfig): ApiBonusConfig => ({
  ...config,
  year: toNumber(config.year),
  deptCoefficient: toNumber(config.deptCoefficient, 1),
  individualRatio: toNumber(config.individualRatio, 70),
  weightOverrides: (config.weightOverrides || []).map(normalizeWeightOverride),
});
