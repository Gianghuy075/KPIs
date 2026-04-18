import { EMPLOYEE_KPI_BSC_ORDER, EMPLOYEE_KPI_OTHER_BSC } from './constants';

export const normalizeBscRows = (kpis, bscCategoryMap) => {
  const enriched = (kpis || []).map((kpi) => ({
    ...kpi,
    bsc: bscCategoryMap?.[kpi.bscCategoryId] || EMPLOYEE_KPI_OTHER_BSC,
  }));

  return enriched.sort((a, b) => {
    const ai = EMPLOYEE_KPI_BSC_ORDER.indexOf(a.bsc);
    const bi = EMPLOYEE_KPI_BSC_ORDER.indexOf(b.bsc);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
};

export const groupRowsWithBscSpan = (flatRows) => {
  const groups = {};
  flatRows.forEach((row) => {
    if (!groups[row.bsc]) groups[row.bsc] = [];
    groups[row.bsc].push(row);
  });

  const orderedBsc = EMPLOYEE_KPI_BSC_ORDER.filter((bsc) => groups[bsc]).concat(
    Object.keys(groups).filter((bsc) => !EMPLOYEE_KPI_BSC_ORDER.includes(bsc)),
  );

  const rows = [];
  orderedBsc.forEach((bscName) => {
    const items = groups[bscName] || [];
    items.forEach((item, index) => {
      rows.push({ ...item, _bsc: bscName, _bscSpan: index === 0 ? items.length : 0 });
    });
  });

  return rows;
};

export const getMonthDateRange = (dayMonth) => {
  const [year, month] = dayMonth.split('-');
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  const from = `${dayMonth}-01`;
  const to = `${dayMonth}-${String(daysInMonth).padStart(2, '0')}`;

  return { daysInMonth, from, to };
};
