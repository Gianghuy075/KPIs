import { useEffect, useMemo, useState } from 'react';
import { message } from 'antd';
import workshopKpiService from '../../../services/workshopKpiService';
import {
  buildFlatRows,
  computeRowSpans,
  emptyEntry,
  getDefaultActiveDate,
} from './utils';

export const useDataEntryState = ({ kpis, bscCategoryMap, year }) => {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [activeDate, setActiveDate] = useState(getDefaultActiveDate);

  const [monthlyEntries, setMonthlyEntries] = useState({});
  const [dailyEntries, setDailyEntries] = useState({});
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [savingMonth, setSavingMonth] = useState(false);
  const [savingDay, setSavingDay] = useState(false);

  const flatRows = useMemo(() => buildFlatRows(kpis, bscCategoryMap), [kpis, bscCategoryMap]);
  const bscSpans = useMemo(() => computeRowSpans(flatRows), [flatRows]);

  useEffect(() => {
    if (!kpis?.length) {
      setLoadingEntries(false);
      setMonthlyEntries({});
      return;
    }

    let mounted = true;
    setLoadingEntries(true);

    Promise.all(
      kpis.map(async (kpi) => {
        const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
        const map = {};
        entries.forEach((entry, index) => {
          map[index] = {
            actualValue: entry.actualValue ?? '',
            errorCount: entry.errorCount ?? 0,
            note: entry.note ?? '',
          };
        });
        return [kpi.id, map];
      }),
    )
      .then((results) => {
        if (!mounted) return;
        const init = {};
        results.forEach(([id, map]) => {
          init[id] = map;
        });
        setMonthlyEntries(init);
      })
      .catch(() => message.error('Không thể tải dữ liệu nhập liệu'))
      .finally(() => {
        if (mounted) setLoadingEntries(false);
      });

    return () => {
      mounted = false;
    };
  }, [kpis]);

  useEffect(() => {
    if (!kpis?.length || !activeDate) {
      setDailyEntries({});
      return;
    }

    let mounted = true;
    setLoadingDaily(true);

    Promise.all(
      kpis.map(async (kpi) => {
        try {
          const entry = await workshopKpiService.getDailyEntry(kpi.id, activeDate);
          return [
            kpi.id,
            {
              actualValue: entry.actualValue ?? '',
              errorCount: entry.errorCount ?? 0,
              note: entry.note ?? '',
            },
          ];
        } catch {
          return [kpi.id, emptyEntry()];
        }
      }),
    )
      .then((results) => {
        if (!mounted) return;
        const map = {};
        results.forEach(([id, entry]) => {
          map[id] = entry;
        });
        setDailyEntries(map);
      })
      .finally(() => {
        if (mounted) setLoadingDaily(false);
      });

    return () => {
      mounted = false;
    };
  }, [kpis, activeDate]);

  const getMonthEntry = (kpiId, monthIdx) => monthlyEntries[kpiId]?.[monthIdx] ?? emptyEntry();
  const getDailyEntry = (kpiId) => dailyEntries[kpiId] ?? emptyEntry();

  const updateMonthEntry = (kpiId, monthIdx, field, value) => {
    setMonthlyEntries((prev) => ({
      ...prev,
      [kpiId]: {
        ...prev[kpiId],
        [monthIdx]: { ...getMonthEntry(kpiId, monthIdx), [field]: value },
      },
    }));
  };

  const updateDailyEntry = (kpiId, field, value) => {
    setDailyEntries((prev) => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], [field]: value },
    }));
  };

  const handleSaveMonth = async () => {
    setSavingMonth(true);
    try {
      await Promise.all(
        flatRows.map((row) => {
          const entry = getMonthEntry(row.id, activeMonth);
          return workshopKpiService.updateMonthlyEntry(row.id, activeMonth + 1, {
            actualValue: entry.actualValue !== '' ? Number(entry.actualValue) : null,
            errorCount: entry.errorCount || 0,
            note: entry.note || '',
          });
        }),
      );
      message.success(`Đã lưu dữ liệu tháng ${activeMonth + 1}/${year}`);
    } catch {
      message.error('Lưu thất bại, vui lòng thử lại');
    } finally {
      setSavingMonth(false);
    }
  };

  const handleSaveDay = async () => {
    setSavingDay(true);
    try {
      await Promise.all(
        flatRows.map((row) => {
          const entry = getDailyEntry(row.id);
          return workshopKpiService.updateDailyEntry(row.id, activeDate, {
            actualValue: entry.actualValue !== '' ? Number(entry.actualValue) : null,
            errorCount: entry.errorCount || 0,
            note: entry.note || '',
          });
        }),
      );
      message.success(`Đã lưu dữ liệu ngày ${activeDate}`);
    } catch {
      message.error('Lưu thất bại, vui lòng thử lại');
    } finally {
      setSavingDay(false);
    }
  };

  return {
    activeMonth,
    setActiveMonth,
    activeDate,
    setActiveDate,
    loadingEntries,
    loadingDaily,
    savingMonth,
    savingDay,
    flatRows,
    bscSpans,
    getMonthEntry,
    getDailyEntry,
    updateMonthEntry,
    updateDailyEntry,
    handleSaveMonth,
    handleSaveDay,
  };
};
