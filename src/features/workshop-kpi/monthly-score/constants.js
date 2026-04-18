import { MONTH_NAMES_FULL } from '../../../constants/period';

export const MONTHLY_SCORE_MONTHS = MONTH_NAMES_FULL;

export const DEFAULT_BONUS_CONFIG = Object.freeze({
  deptCoefficient: 1,
  individualRatio: 70,
  kpiWeightOverrides: {},
});
