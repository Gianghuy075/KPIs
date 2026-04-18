export const BSC_ENUM = Object.freeze({
  FINANCIAL: 'Tài chính',
  CUSTOMER: 'Khách hàng',
  INTERNAL: 'Quy trình nội bộ',
  LEARNING: 'Học hỏi & Phát triển',
  OTHER: 'Khác',
});

export const BSC_ORDER = Object.freeze([
  BSC_ENUM.FINANCIAL,
  BSC_ENUM.CUSTOMER,
  BSC_ENUM.INTERNAL,
  BSC_ENUM.LEARNING,
]);

export const BSC_COLORS = Object.freeze({
  [BSC_ENUM.FINANCIAL]: Object.freeze({ color: '#1d4ed8', background: 'rgba(59,130,246,0.1)' }),
  [BSC_ENUM.CUSTOMER]: Object.freeze({ color: '#15803d', background: 'rgba(16,185,129,0.1)' }),
  [BSC_ENUM.INTERNAL]: Object.freeze({ color: '#b45309', background: 'rgba(245,158,11,0.1)' }),
  [BSC_ENUM.LEARNING]: Object.freeze({ color: '#7c3aed', background: 'rgba(168,85,247,0.1)' }),
});

export const BSC_TABLE_COLORS = Object.freeze({
  [BSC_ENUM.FINANCIAL]: Object.freeze({ color: '#1d4ed8', background: '#dbeafe' }),
  [BSC_ENUM.CUSTOMER]: Object.freeze({ color: '#15803d', background: '#dcfce7' }),
  [BSC_ENUM.INTERNAL]: Object.freeze({ color: '#b45309', background: '#fef3c7' }),
  [BSC_ENUM.LEARNING]: Object.freeze({ color: '#7c3aed', background: '#ede9fe' }),
});
