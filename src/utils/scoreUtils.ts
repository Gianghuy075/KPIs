import { KPI_COLORS } from '../constants/uiTokens';
import { FINAL_RATING_LABELS, FINAL_RATING_THRESHOLDS, RATE_THRESHOLDS } from '../constants/rating';

export const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

export const getRateStyle = (rate) => {
  if (rate >= RATE_THRESHOLDS.GOOD) return { color: KPI_COLORS.success, background: KPI_COLORS.successBg };
  if (rate >= RATE_THRESHOLDS.WARNING) return { color: KPI_COLORS.warning, background: KPI_COLORS.warningBg };
  return { color: KPI_COLORS.danger, background: KPI_COLORS.dangerBg };
};

export const getScoreStyle = (score) => {
  if (score >= RATE_THRESHOLDS.GOOD) return { color: KPI_COLORS.success, background: KPI_COLORS.successBg };
  if (score >= RATE_THRESHOLDS.WARNING) return { color: KPI_COLORS.warning, background: KPI_COLORS.warningBg };
  if (score >= RATE_THRESHOLDS.LOW) return { color: KPI_COLORS.orange, background: KPI_COLORS.orangeBg };
  return { color: KPI_COLORS.danger, background: KPI_COLORS.dangerBg };
};

export const getFinalRating = (score) => {
  if (score >= FINAL_RATING_THRESHOLDS.EXCELLENT) {
    return { label: FINAL_RATING_LABELS.EXCELLENT, color: KPI_COLORS.success, bg: KPI_COLORS.successBg };
  }
  if (score >= FINAL_RATING_THRESHOLDS.GOOD) {
    return { label: FINAL_RATING_LABELS.GOOD, color: KPI_COLORS.infoBlue, bg: KPI_COLORS.infoBlueBg };
  }
  if (score >= FINAL_RATING_THRESHOLDS.PASS) {
    return { label: FINAL_RATING_LABELS.PASS, color: KPI_COLORS.warning, bg: KPI_COLORS.warningBg };
  }
  if (score >= FINAL_RATING_THRESHOLDS.IMPROVE) {
    return { label: FINAL_RATING_LABELS.IMPROVE, color: KPI_COLORS.orange, bg: KPI_COLORS.orangeBg };
  }
  return { label: FINAL_RATING_LABELS.FAIL, color: KPI_COLORS.danger, bg: KPI_COLORS.dangerBg };
};
