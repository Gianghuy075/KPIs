import { useEffect, useState } from 'react';
import workshopKpiService from '../../../services/workshopKpiService';
import { getMonthDateRange } from './utils';

export const useDailyEntries = ({ rows, dayMonth }) => {
  const [dayEntries, setDayEntries] = useState({});
  const [loadingDay, setLoadingDay] = useState(false);

  useEffect(() => {
    if (!rows.length || !dayMonth) {
      setDayEntries({});
      return;
    }

    const { from, to } = getMonthDateRange(dayMonth);

    let mounted = true;
    setLoadingDay(true);

    Promise.all(
      rows.map(async (kpi) => {
        try {
          const entries = await workshopKpiService.listDailyEntries(kpi.id, from, to);
          const map = {};
          (entries || []).forEach((entry) => {
            const key = entry.entryDate || entry.date;
            if (key) map[key] = entry;
          });
          return [kpi.id, map];
        } catch {
          return [kpi.id, {}];
        }
      }),
    )
      .then((results) => {
        if (!mounted) return;
        const merged = {};
        results.forEach(([id, map]) => {
          merged[id] = map;
        });
        setDayEntries(merged);
      })
      .finally(() => {
        if (mounted) setLoadingDay(false);
      });

    return () => {
      mounted = false;
    };
  }, [dayMonth, rows]);

  return { dayEntries, loadingDay };
};
