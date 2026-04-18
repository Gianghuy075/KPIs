export const normalizeEntriesByMonth = (entriesByKpiId) => {
  const normalized = {};

  Object.entries(entriesByKpiId || {}).forEach(([kpiId, entries]) => {
    const monthMap = {};
    (entries || []).forEach((entry) => {
      const monthIdx = (entry.month ?? entry.monthIndex ?? 1) - 1;
      monthMap[monthIdx] = entry;
    });
    normalized[kpiId] = monthMap;
  });

  return normalized;
};
