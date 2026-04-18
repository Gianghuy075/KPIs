import type { ApiMonthlyEntry } from '../types/api';

export const normalizeEntriesByMonth = (
  entriesByKpiId: Record<string, ApiMonthlyEntry[]>,
): Record<string, Record<number, ApiMonthlyEntry>> => {
  const normalized: Record<string, Record<number, ApiMonthlyEntry>> = {};

  Object.entries(entriesByKpiId || {}).forEach(([kpiId, entries]) => {
    const monthMap: Record<number, ApiMonthlyEntry> = {};
    (entries || []).forEach((entry) => {
      const monthIdx = (entry.month ?? entry.monthIndex ?? 1) - 1;
      monthMap[monthIdx] = entry;
    });
    normalized[kpiId] = monthMap;
  });

  return normalized;
};
