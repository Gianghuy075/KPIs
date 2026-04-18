import { useEffect, useMemo, useState } from 'react';
import workshopKpiService from '../services/workshopKpiService';
import { normalizeEntriesByMonth } from '../utils/entryUtils';

const EMPTY_OBJECT = {};

export const useMonthlyEntriesMap = ({ kpis = [], normalize = false, enabled = true } = {}) => {
  const [entriesByKpi, setEntriesByKpi] = useState(EMPTY_OBJECT);
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
          kpis.map(async (kpi) => {
            try {
              const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
              return [kpi.id, entries];
            } catch {
              return [kpi.id, []];
            }
          }),
        );

        if (!mounted) return;

        const rawMap = {};
        results.forEach(([kpiId, entries]) => {
          rawMap[kpiId] = entries;
        });

        setEntriesByKpi(normalize ? normalizeEntriesByMonth(rawMap) : rawMap);
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Không thể tải dữ liệu nhập liệu');
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
