import { useMemo, useState } from 'react';
import { Tabs } from 'antd';
import { calculatePenalty } from '../../../utils/penaltyUtils';
import { calcCompletionRate } from '../../../utils/bonusUtils';
import {
  EMPLOYEE_KPI_COLORS,
  EMPLOYEE_KPI_PERIOD_ENUM,
  EMPLOYEE_KPI_PERIOD_LABELS,
} from './constants';
import { normalizeBscRows, groupRowsWithBscSpan } from './utils';
import { useDailyEntries } from './useDailyEntries';
import { DailyKpiTable, PeriodicKpiTable, YearKpiTable } from './components';

const getDefaultDayMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const EmployeeKpiView = ({ kpis, bscCategoryMap, penaltyLogics, year, allEntries }) => {
  const [dayMonth, setDayMonth] = useState(getDefaultDayMonth);

  const flatRows = useMemo(() => normalizeBscRows(kpis, bscCategoryMap), [kpis, bscCategoryMap]);

  const rowsWithBscSpan = useMemo(() => groupRowsWithBscSpan(flatRows), [flatRows]);

  const { dayEntries, loadingDay } = useDailyEntries({ rows: flatRows, dayMonth });

  const getMonthEntry = (kpiId, monthIdx) =>
    allEntries[kpiId]?.[monthIdx] ?? { actualValue: null, errorCount: 0 };

  const getPenaltyForItem = (item, errors, rate) => {
    const logic = penaltyLogics?.find((logicItem) => logicItem.id === item.penaltyLogicId);
    return calculatePenalty(logic, errors, rate);
  };

  const getYearActual = (kpiId) => {
    const entries = Array.from({ length: 12 }, (_, index) => getMonthEntry(kpiId, index));
    return entries.filter((entry) => entry.actualValue != null).pop()?.actualValue ?? null;
  };

  const getYearErrors = (kpiId) =>
    Array.from({ length: 12 }, (_, index) => getMonthEntry(kpiId, index)).reduce(
      (sum, entry) => sum + (entry.errorCount || 0),
      0,
    );

  const getMonthErrors = (kpiId, monthIdx) => getMonthEntry(kpiId, monthIdx).errorCount || 0;

  const getQuarterErrors = (kpiId, quarterIdx) => {
    const start = quarterIdx * 3;
    return [0, 1, 2].reduce((sum, offset) => sum + getMonthErrors(kpiId, start + offset), 0);
  };

  const getYearRate = (item) => {
    const actual = getYearActual(item.id);
    if (actual == null || !item.targetValue) return null;
    return calcCompletionRate(Number(actual), Number(item.targetValue));
  };

  const getMonthRate = (item, monthIdx) => {
    const entry = getMonthEntry(item.id, monthIdx);
    if (entry.actualValue == null || !item.targetValue) return null;
    const monthTarget = Number(item.targetValue) / 12;
    return monthTarget > 0 ? calcCompletionRate(Number(entry.actualValue), monthTarget) : null;
  };

  const helpers = {
    getMonthEntry,
    getPenaltyForItem,
    getYearActual,
    getYearErrors,
    getMonthErrors,
    getQuarterErrors,
    getYearRate,
    getMonthRate,
  };

  const tabItems = [
    {
      key: EMPLOYEE_KPI_PERIOD_ENUM.YEAR,
      label: EMPLOYEE_KPI_PERIOD_LABELS[EMPLOYEE_KPI_PERIOD_ENUM.YEAR],
      children: <YearKpiTable rows={rowsWithBscSpan} helpers={helpers} />,
    },
    {
      key: EMPLOYEE_KPI_PERIOD_ENUM.QUARTER,
      label: EMPLOYEE_KPI_PERIOD_LABELS[EMPLOYEE_KPI_PERIOD_ENUM.QUARTER],
      children: (
        <PeriodicKpiTable
          rows={rowsWithBscSpan}
          period={EMPLOYEE_KPI_PERIOD_ENUM.QUARTER}
          helpers={helpers}
        />
      ),
    },
    {
      key: EMPLOYEE_KPI_PERIOD_ENUM.MONTH,
      label: EMPLOYEE_KPI_PERIOD_LABELS[EMPLOYEE_KPI_PERIOD_ENUM.MONTH],
      children: (
        <PeriodicKpiTable
          rows={rowsWithBscSpan}
          period={EMPLOYEE_KPI_PERIOD_ENUM.MONTH}
          helpers={helpers}
        />
      ),
    },
    {
      key: EMPLOYEE_KPI_PERIOD_ENUM.DAY,
      label: EMPLOYEE_KPI_PERIOD_LABELS[EMPLOYEE_KPI_PERIOD_ENUM.DAY],
      children: (
        <DailyKpiTable
          dayMonth={dayMonth}
          setDayMonth={setDayMonth}
          rows={rowsWithBscSpan}
          loadingDay={loadingDay}
          dayEntries={dayEntries}
          helpers={helpers}
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: EMPLOYEE_KPI_COLORS.muted }}>
          Năm: <span style={{ fontWeight: 600, color: EMPLOYEE_KPI_COLORS.foreground }}>{year}</span>
        </span>
      </div>
      <Tabs defaultActiveKey={EMPLOYEE_KPI_PERIOD_ENUM.YEAR} items={tabItems} />
    </div>
  );
};

export default EmployeeKpiView;
