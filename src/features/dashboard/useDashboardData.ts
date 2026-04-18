import { useCallback, useEffect, useMemo, useState } from 'react';
import workshopKpiService from '../../services/workshopKpiService';
import penaltyService from '../../services/penaltyService';
import { calcCompletionRate } from '../../utils/bonusUtils';
import { getStatus } from '../../utils/kpiUtils';
import { DASHBOARD_BSC_ORDER, DASHBOARD_BSC_SHORT_NAMES } from '../../constants/dashboard';

export const useDashboardData = ({ year, user }) => {
  const [rawKpis, setRawKpis] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [penaltyLogics, setPenaltyLogics] = useState([]);
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'system_admin';
  const phanXuongId = user?.phanXuongId;

  useEffect(() => {
    Promise.all([workshopKpiService.listBscCategories(), penaltyService.list()])
      .then(([bsc, penalty]) => {
        setBscCategories(bsc);
        setPenaltyLogics(penalty);
      })
      .catch(() => {});
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = { year };
      if (!isAdmin && phanXuongId) params.phanXuongId = phanXuongId;
      const kpiList = await workshopKpiService.list(params);
      setRawKpis(kpiList || []);

      const entriesMap = {};
      await Promise.all(
        (kpiList || []).map(async (kpi) => {
          try {
            const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
            entriesMap[kpi.id] = entries;
          } catch {
            entriesMap[kpi.id] = [];
          }
        }),
      );

      setAllEntries(entriesMap);
    } catch (err) {
      setError(err?.message || 'Không tải được KPI');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, phanXuongId, year]);

  useEffect(() => {
    refresh();
  }, [refresh, user?.role]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [bscCategories]);

  const kpis = useMemo(
    () =>
      rawKpis.map((kpi) => {
        const entries = allEntries[kpi.id] || [];
        const withData = entries.filter((entry) => entry.actualValue != null);
        const actual = withData.length ? withData[withData.length - 1].actualValue : null;
        const completionRate =
          actual != null && kpi.targetValue
            ? calcCompletionRate(Number(actual), Number(kpi.targetValue))
            : 0;

        return {
          id: kpi.id,
          name: kpi.name,
          unit: kpi.targetUnit || '',
          weight: Number(kpi.weight || 0),
          target: Number(kpi.targetValue || 0),
          actual: actual ?? null,
          completionRate,
          bsc: bscCategoryMap[kpi.bscCategoryId] || 'Khác',
          status: getStatus(completionRate),
        };
      }),
    [allEntries, bscCategoryMap, rawKpis],
  );

  const stats = useMemo(() => {
    if (!kpis.length) return null;

    const completed = kpis.filter((kpi) => kpi.status === 'completed').length;
    const warning = kpis.filter((kpi) => kpi.status === 'warning').length;
    const risk = kpis.filter((kpi) => kpi.status === 'risk').length;

    const weighted = kpis.reduce(
      (acc, kpi) => {
        acc.totalWeight += kpi.weight || 0;
        acc.weightedScore += (kpi.completionRate * (kpi.weight || 0)) / 100;
        return acc;
      },
      { weightedScore: 0, totalWeight: 0 },
    );

    const overallScore =
      weighted.totalWeight > 0
        ? (weighted.weightedScore / weighted.totalWeight) * 100
        : kpis.reduce((sum, kpi) => sum + kpi.completionRate, 0) / kpis.length;

    return {
      totalKPIs: kpis.length,
      overallScore: parseFloat(overallScore.toFixed(1)),
      completed,
      warning,
      risk,
      totalWeight: weighted.totalWeight,
    };
  }, [kpis]);

  const overallStatus = stats ? getStatus(stats.overallScore) : null;

  const categoryData = useMemo(() => {
    const map = {};
    kpis.forEach((kpi) => {
      map[kpi.bsc] = (map[kpi.bsc] || 0) + (kpi.weight || 1);
    });

    return Object.entries(map).map(([name, weight]) => ({
      name,
      value: weight,
      weight,
      perspective: name,
    }));
  }, [kpis]);

  const bscBarData = useMemo(() => {
    const groups = {};

    kpis.forEach((kpi) => {
      if (!groups[kpi.bsc]) groups[kpi.bsc] = [];
      groups[kpi.bsc].push(kpi.completionRate);
    });

    return DASHBOARD_BSC_ORDER
      .filter((bsc) => groups[bsc])
      .map((bsc) => ({
        name: DASHBOARD_BSC_SHORT_NAMES[bsc] || bsc,
        fullName: bsc,
        avg: groups[bsc].reduce((sum, value) => sum + value, 0) / groups[bsc].length,
        count: groups[bsc].length,
      }));
  }, [kpis]);

  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => ({
      month: `T${index + 1}`,
      weightedScore: 0,
      totalWeight: 0,
    }));

    kpis.forEach((kpi) => {
      const entries = allEntries[kpi.id] || [];
      entries.forEach((entry) => {
        const monthIndex = (entry.month ?? entry.monthIndex ?? 1) - 1;
        if (monthIndex >= 0 && monthIndex < 12 && entry.actualValue != null && kpi.target > 0) {
          const rate = calcCompletionRate(Number(entry.actualValue), kpi.target);
          months[monthIndex].weightedScore += rate * (kpi.weight || 1);
          months[monthIndex].totalWeight += kpi.weight || 1;
        }
      });
    });

    return months.map((month) => ({
      month: month.month,
      score:
        month.totalWeight > 0
          ? parseFloat((month.weightedScore / month.totalWeight).toFixed(1))
          : null,
    }));
  }, [allEntries, kpis]);

  return {
    rawKpis,
    setRawKpis,
    bscCategories,
    penaltyLogics,
    allEntries,
    loading,
    error,
    refresh,
    bscCategoryMap,
    kpis,
    stats,
    overallStatus,
    categoryData,
    bscBarData,
    monthlyTrend,
    isAdmin,
  };
};
