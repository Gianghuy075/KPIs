import { getCurrentYear, getYearRange } from '../../../constants/year';

export const BONUS_CONFIG_CURRENT_YEAR = getCurrentYear();
export const BONUS_CONFIG_YEARS = getYearRange(BONUS_CONFIG_CURRENT_YEAR);

export const createDefaultBonusConfig = () => ({
  deptCoefficient: 1,
  individualRatio: 70,
  kpiWeightOverrides: {},
});

export const normalizeWeight = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num * 100) / 100));
};

export const isSameWeight = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 0.0001;

export const formatWeight = (value) => {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, '');
};
