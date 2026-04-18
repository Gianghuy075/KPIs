export const PENALTY_TYPE_ENUM = Object.freeze({
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
  TIERED: 'tiered',
  CAP: 'cap',
});

export const PENALTY_TYPE_LABELS = Object.freeze({
  [PENALTY_TYPE_ENUM.FIXED]: 'Trừ điểm cố định',
  [PENALTY_TYPE_ENUM.PERCENTAGE]: 'Trừ theo %',
  [PENALTY_TYPE_ENUM.TIERED]: 'Trừ theo bậc',
  [PENALTY_TYPE_ENUM.CAP]: 'Trừ có giới hạn',
});

export const PENALTY_TYPE_STYLES = Object.freeze({
  [PENALTY_TYPE_ENUM.FIXED]: Object.freeze({ background: 'rgba(59,130,246,0.1)', color: '#1d4ed8' }),
  [PENALTY_TYPE_ENUM.PERCENTAGE]: Object.freeze({ background: 'rgba(16,185,129,0.1)', color: '#15803d' }),
  [PENALTY_TYPE_ENUM.TIERED]: Object.freeze({ background: 'rgba(245,158,11,0.1)', color: '#b45309' }),
  [PENALTY_TYPE_ENUM.CAP]: Object.freeze({ background: 'rgba(168,85,247,0.1)', color: '#7c3aed' }),
});
