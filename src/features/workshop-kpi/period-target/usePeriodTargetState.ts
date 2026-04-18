import { useCallback, useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import workshopKpiService from '../../../services/workshopKpiService';
import {
  buildGroupedRows,
  distributeEvenly,
  emptyPeriodTargets,
  parseNum,
} from './utils';

export const usePeriodTargetState = ({ kpis, bscCategoryMap }) => {
  const [local, setLocal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!kpis?.length) {
      setLoading(false);
      setLocal({});
      return;
    }

    let mounted = true;

    const fetchAll = async () => {
      setLoading(true);
      const init = {};

      await Promise.all(
        kpis.map(async (item) => {
          try {
            const [quarterly, monthly] = await Promise.all([
              workshopKpiService.getPeriodTargets(item.id, 'quarterly'),
              workshopKpiService.getPeriodTargets(item.id, 'monthly'),
            ]);

            const qMap = {};
            quarterly.forEach((target, index) => {
              qMap[index] = target.targetValue != null ? String(target.targetValue) : '';
            });

            const mMap = {};
            monthly.forEach((target, index) => {
              mMap[index] = target.targetValue != null ? String(target.targetValue) : '';
            });

            init[item.id] = { quarterly: qMap, monthly: mMap, daily: {} };
          } catch {
            const yearVal = parseNum(item.targetValue);
            const qParts = distributeEvenly(yearVal, 4);
            const qMap = {};
            const mMap = {};

            qParts.forEach((qValue, qIndex) => {
              qMap[qIndex] = qValue;
              distributeEvenly(parseNum(qValue), 3).forEach((mValue, mIndex) => {
                mMap[qIndex * 3 + mIndex] = mValue;
              });
            });

            init[item.id] = { quarterly: qMap, monthly: mMap, daily: {} };
          }
        }),
      );

      if (!mounted) return;
      setLocal(init);
      setLoading(false);
    };

    fetchAll();

    return () => {
      mounted = false;
    };
  }, [kpis]);

  const groupedRows = useMemo(() => buildGroupedRows(kpis, bscCategoryMap), [kpis, bscCategoryMap]);

  const getLocal = (id) => local[id] ?? emptyPeriodTargets();

  const updateLocal = useCallback((id, updater) => {
    setLocal((prev) => ({ ...prev, [id]: updater(prev[id] ?? emptyPeriodTargets()) }));
  }, []);

  const handleQuarterChange = (item, quarterIndex, value) => {
    updateLocal(item.id, (periodTargets) => {
      const newQuarterly = { ...periodTargets.quarterly, [quarterIndex]: value };
      const newMonthly = { ...periodTargets.monthly };

      distributeEvenly(parseNum(value), 3).forEach((monthValue, monthOffset) => {
        newMonthly[quarterIndex * 3 + monthOffset] = monthValue;
      });

      return { ...periodTargets, quarterly: newQuarterly, monthly: newMonthly };
    });
  };

  const handleMonthChange = (item, monthIndex, value) => {
    updateLocal(item.id, (periodTargets) => ({
      ...periodTargets,
      monthly: { ...periodTargets.monthly, [monthIndex]: value },
    }));
  };

  const yearTarget = (item) => parseNum(item.targetValue);
  const sumQuarterly = (id) =>
    Object.values(getLocal(id).quarterly).reduce((sum, value) => sum + parseNum(value), 0);
  const sumMonthly = (id) =>
    Object.values(getLocal(id).monthly).reduce((sum, value) => sum + parseNum(value), 0);

  const allDiffsZero = (kpis || []).every((item) => {
    const target = yearTarget(item);
    if (target === 0) return true;
    return Math.abs(sumQuarterly(item.id) - target) < 0.01 && Math.abs(sumMonthly(item.id) - target) < 0.01;
  });

  const handleSave = async () => {
    if (!allDiffsZero) {
      message.error('Chưa thể lưu! Tất cả KPI phải có chênh lệch = 0.');
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        kpis.map(async (item) => {
          const pt = getLocal(item.id);
          const targets = [
            ...Object.entries(pt.quarterly).map(([index, value]) => ({
              periodType: 'quarterly',
              periodKey: String(Number(index) + 1),
              targetValue: parseNum(value),
            })),
            ...Object.entries(pt.monthly).map(([index, value]) => ({
              periodType: 'monthly',
              periodKey: String(Number(index) + 1),
              targetValue: parseNum(value),
            })),
          ];

          await workshopKpiService.savePeriodTargets(item.id, targets);
        }),
      );
      message.success('Đã lưu mục tiêu theo kỳ thành công!');
    } catch {
      message.error('Lưu thất bại, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    groupedRows,
    getLocal,
    handleQuarterChange,
    handleMonthChange,
    yearTarget,
    sumQuarterly,
    sumMonthly,
    allDiffsZero,
    handleSave,
  };
};
