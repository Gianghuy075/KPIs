import { useCallback, useEffect, useMemo, useState } from 'react';
import bonusConfigService from '../services/bonusConfigService';
import workshopKpiService from '../services/workshopKpiService';
import { normalizeEntriesByMonth } from '../utils/entryUtils';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};

export const useWorkshopKpiDataset = ({
  year,
  workshopId,
  includeBonusConfig = false,
  includeMonthlyEntries = false,
  normalizeMonthlyEntries = false,
  enabled = true,
} = {}) => {
  const [kpis, setKpis] = useState(EMPTY_ARRAY);
  const [bonusConfig, setBonusConfig] = useState(null);
  const [entriesByKpi, setEntriesByKpi] = useState(EMPTY_OBJECT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  useEffect(() => {
    if (!enabled || !workshopId || !year) {
      setKpis(EMPTY_ARRAY);
      setBonusConfig(null);
      setEntriesByKpi(EMPTY_OBJECT);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const requests = [
          workshopKpiService.list({ year, phanXuongId: workshopId }),
          includeBonusConfig
            ? bonusConfigService.list({ year, phanXuongId: workshopId })
            : Promise.resolve([]),
        ];

        const [kpiList, cfgList] = await Promise.all(requests);

        if (!mounted) return;

        const normalizedKpis = Array.isArray(kpiList) ? kpiList : [];
        setKpis(normalizedKpis);
        setBonusConfig(includeBonusConfig ? (cfgList?.[0] ?? null) : null);

        if (!includeMonthlyEntries) {
          setEntriesByKpi(EMPTY_OBJECT);
          return;
        }

        const entriesResults = await Promise.all(
          normalizedKpis.map(async (kpi) => {
            try {
              const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
              return [kpi.id, entries];
            } catch {
              return [kpi.id, []];
            }
          }),
        );

        if (!mounted) return;

        const rawEntries = {};
        entriesResults.forEach(([kpiId, entries]) => {
          rawEntries[kpiId] = entries;
        });

        setEntriesByKpi(
          normalizeMonthlyEntries ? normalizeEntriesByMonth(rawEntries) : rawEntries,
        );
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Không thể tải dữ liệu KPI');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [
    enabled,
    includeBonusConfig,
    includeMonthlyEntries,
    normalizeMonthlyEntries,
    refreshKey,
    workshopId,
    year,
  ]);

  return useMemo(
    () => ({
      kpis,
      bonusConfig,
      entriesByKpi,
      loading,
      error,
      reload,
    }),
    [bonusConfig, entriesByKpi, error, kpis, loading, reload],
  );
};
