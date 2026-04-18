import { useEffect, useMemo, useState } from 'react';
import workshopKpiService from '../services/workshopKpiService';
import { normalizeEntriesByMonth } from '../utils/entryUtils';
import type { ApiKpi, ApiMonthlyEntry } from '../types/api';

const EMPTY_OBJECT: Record<string, never> = {};

type EntriesListByKpi = Record<string, ApiMonthlyEntry[]>;
type EntriesByMonthByKpi = Record<string, Record<number, ApiMonthlyEntry>>;

type MonthlyEntriesOptions = {
  kpis?: ApiKpi[];
  normalize?: boolean;
  enabled?: boolean;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const useMonthlyEntriesMap = ({
  kpis = [],
  normalize = false,
  enabled = true,
}: MonthlyEntriesOptions = {}) => {
  const [entriesByKpi, setEntriesByKpi] = useState<EntriesListByKpi | EntriesByMonthByKpi>(EMPTY_OBJECT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!enabled || !kpis.length) {
      setEntriesByKpi(EMPTY_OBJECT);
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchEntries = async () => {
      setLoading(true);
      setError('');

      try {
        const results = await Promise.all(
          kpis.map(async (kpi): Promise<[string, ApiMonthlyEntry[]]> => {
            try {
              const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
              return [kpi.id, entries];
            } catch {
              return [kpi.id, []];
            }
          }),
        );

        if (!mounted) return;

        const rawMap: EntriesListByKpi = {};
        results.forEach(([kpiId, entries]) => {
          rawMap[kpiId] = entries;
        });

        setEntriesByKpi(normalize ? normalizeEntriesByMonth(rawMap) : rawMap);
      } catch (errorValue) {
        if (!mounted) return;
        setError(getErrorMessage(errorValue, 'Không thể tải dữ liệu nhập liệu'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEntries();

    return () => {
      mounted = false;
    };
  }, [enabled, kpis, normalize]);

  return useMemo(
    () => ({ entriesByKpi, loading, error }),
    [entriesByKpi, error, loading],
  );
};
