export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
};

export const calculateScore = (actual, target) => {
  if (!target || target === 0) return 0;
  return Math.min((actual / target) * 100, 150);
};

export const getStatus = (completionRate) => {
  if (completionRate >= 100) return 'completed';
  if (completionRate >= 70) return 'warning';
  return 'risk';
};

export const getStatusLabel = (status) => {
  const labels = {
    completed: 'Hoàn thành',
    warning: 'Cảnh báo',
    risk: 'Rủi ro',
  };
  return labels[status] || status;
};

export const getStatusColor = (status) => {
  const colors = {
    completed: 'success',
    warning: 'warning',
    risk: 'error',
  };
  return colors[status] || 'default';
};

export const PERSPECTIVES = {
  FINANCIAL: 'Tài chính',
  CUSTOMER: 'Khách hàng',
  INTERNAL: 'Quy trình nội bộ',
  LEARNING: 'Học hỏi & Phát triển',
};

export const PERSPECTIVE_COLORS = {
  [PERSPECTIVES.FINANCIAL]: '#1890ff',
  [PERSPECTIVES.CUSTOMER]: '#52c41a',
  [PERSPECTIVES.INTERNAL]: '#faad14',
  [PERSPECTIVES.LEARNING]: '#722ed1',
};
