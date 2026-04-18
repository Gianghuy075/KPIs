import { useCallback, useEffect, useMemo, useState } from 'react';
import bonusConfigService from '../services/bonusConfigService';
import workshopKpiService from '../services/workshopKpiService';
import { normalizeEntriesByMonth } from '../utils/entryUtils';
import type {
  ApiBonusConfig,
  ApiKpi,
  ApiMonthlyEntry,
  BonusConfigListParams,
  KpiListParams,
} from '../types/api';

const EMPTY_KPIS: ApiKpi[] = [];
const EMPTY_OBJECT: Record<string, never> = {};

type EntriesListByKpi = Record<string, ApiMonthlyEntry[]>;
type EntriesByMonthByKpi = Record<string, Record<number, ApiMonthlyEntry>>;

type DatasetOptions = {
  year?: number | string;
  workshopId?: string | null;
  includeBonusConfig?: boolean;
  includeMonthlyEntries?: boolean;
  normalizeMonthlyEntries?: boolean;
  enabled?: boolean;
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const useWorkshopKpiDataset = ({
  year,
  workshopId,
  includeBonusConfig = false,
  includeMonthlyEntries = false,
  normalizeMonthlyEntries = false,
  enabled = true,
}: DatasetOptions = {}) => {
  const [kpis, setKpis] = useState<ApiKpi[]>(EMPTY_KPIS);
  const [bonusConfig, setBonusConfig] = useState<ApiBonusConfig | null>(null);
  const [entriesByKpi, setEntriesByKpi] = useState<EntriesListByKpi | EntriesByMonthByKpi>(EMPTY_OBJECT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = useCallback(() => setRefreshKey((prev) => prev + 1), []);

  useEffect(() => {
    if (!enabled || !workshopId || !year) {
      setKpis(EMPTY_KPIS);
      setBonusConfig(null);
      setEntriesByKpi(EMPTY_OBJECT);
      return;
    }

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const kpiParams: KpiListParams = {
          year,
          phanXuongId: workshopId,
        };
        const bonusParams: BonusConfigListParams = {
          year,
          phanXuongId: workshopId,
        };

        const kpiPromise = workshopKpiService.list(kpiParams);
        const bonusConfigPromise: Promise<ApiBonusConfig[]> = includeBonusConfig
          ? bonusConfigService.list(bonusParams)
          : Promise.resolve([]);

        const [kpiList, cfgList] = await Promise.all([
          kpiPromise,
          bonusConfigPromise,
        ]);

        if (!mounted) return;

        const normalizedKpis: ApiKpi[] = Array.isArray(kpiList) ? kpiList : [];
        setKpis(normalizedKpis);
        setBonusConfig(includeBonusConfig ? (cfgList?.[0] ?? null) : null);

        if (!includeMonthlyEntries) {
          setEntriesByKpi(EMPTY_OBJECT);
          return;
        }

        const entriesResults = await Promise.all(
          normalizedKpis.map(async (kpi): Promise<[string, ApiMonthlyEntry[]]> => {
            try {
              const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
              return [kpi.id, entries];
            } catch {
              return [kpi.id, []];
            }
          }),
        );

        if (!mounted) return;

        const rawEntries: EntriesListByKpi = {};
        entriesResults.forEach(([kpiId, entries]) => {
          rawEntries[kpiId] = entries;
        });

        setEntriesByKpi(
          normalizeMonthlyEntries
            ? normalizeEntriesByMonth(rawEntries)
            : rawEntries,
        );
      } catch (errorValue) {
        if (!mounted) return;
        setError(getErrorMessage(errorValue, 'Không thể tải dữ liệu KPI'));
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
