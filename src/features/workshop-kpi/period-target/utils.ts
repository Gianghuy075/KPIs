export const emptyPeriodTargets = () => ({ quarterly: {}, monthly: {}, daily: {} });

export const parseNum = (value) => parseFloat(String(value).replace(/,/g, '')) || 0;

export const fmtNum = (value) =>
  value % 1 === 0
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });

export const distributeEvenly = (total, segments) => {
  if (total === 0 || segments === 0) return Array(segments).fill('');

  const base = Math.floor((total / segments) * 100) / 100;
  const remainder = Math.round((total - base * segments) * 100) / 100;

  return Array.from({ length: segments }, (_, index) => fmtNum(index === 0 ? base + remainder : base));
};

export const buildGroupedRows = (kpis, bscCategoryMap) => {
  const grouped = (kpis || []).reduce((acc, item) => {
    const bscName = bscCategoryMap?.[item.bscCategoryId] || 'Khác';
    if (!acc[bscName]) acc[bscName] = [];
    acc[bscName].push(item);
    return acc;
  }, {});

  const rows = [];
  Object.entries(grouped).forEach(([bsc, items]) => {
    items.forEach((item, index) => {
      rows.push({ ...item, _bsc: bsc, _isFirst: index === 0 });
    });
  });

  return rows;
};
