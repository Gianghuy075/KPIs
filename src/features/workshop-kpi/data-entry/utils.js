import { BSC_ORDER } from '../../../constants/bsc';

export const emptyEntry = () => ({ actualValue: '', errorCount: 0, note: '' });

export const getDefaultActiveDate = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate(),
  ).padStart(2, '0')}`;
};

export const buildFlatRows = (kpis = [], bscCategoryMap = {}) => {
  const enriched = kpis.map((kpi) => ({
    ...kpi,
    bsc: bscCategoryMap?.[kpi.bscCategoryId] || 'Khác',
  }));

  return enriched.sort((a, b) => {
    const ai = BSC_ORDER.indexOf(a.bsc);
    const bi = BSC_ORDER.indexOf(b.bsc);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
};

export const computeRowSpans = (items) => {
  const spans = {};
  let i = 0;

  while (i < items.length) {
    let j = i;
    while (j < items.length && items[j].bsc === items[i].bsc) j += 1;
    spans[items[i].id] = j - i;
    for (let k = i + 1; k < j; k += 1) spans[items[k].id] = 0;
    i = j;
  }

  return spans;
};

export const getQuarterAgg = (getMonthEntry, kpiId, quarterIndex) => {
  const startMonth = quarterIndex * 3;
  const entries = [0, 1, 2].map((offset) => getMonthEntry(kpiId, startMonth + offset));

  return {
    value: entries.filter((entry) => entry.actualValue).pop()?.actualValue || '—',
    totalErrors: entries.reduce((sum, entry) => sum + (entry.errorCount || 0), 0),
  };
};

export const getYearAgg = (getMonthEntry, kpiId) => {
  const entries = Array.from({ length: 12 }, (_, index) => getMonthEntry(kpiId, index));
  return {
    value: entries.filter((entry) => entry.actualValue).pop()?.actualValue || '—',
    totalErrors: entries.reduce((sum, entry) => sum + (entry.errorCount || 0), 0),
  };
};
