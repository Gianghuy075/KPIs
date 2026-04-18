import { Spin } from 'antd';
import { KPI_COLORS } from '../../../constants/uiTokens';
import { getQuarterAgg, getYearAgg } from './utils';
import { useDataEntryState } from './useDataEntryState';
import { DataEntryTabs } from './components';

const DataEntryView = ({ kpis, bscCategoryMap, year }) => {
  const {
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
  } = useDataEntryState({
    kpis,
    bscCategoryMap,
    year,
  });

  const quarterAgg = (kpiId, quarterIndex) => getQuarterAgg(getMonthEntry, kpiId, quarterIndex);
  const yearAgg = (kpiId) => getYearAgg(getMonthEntry, kpiId);

  if (loadingEntries) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: KPI_COLORS.muted }}>
          Năm: <strong style={{ color: KPI_COLORS.foreground }}>{year}</strong>
        </span>
      </div>
      <DataEntryTabs
        year={year}
        flatRows={flatRows}
        bscSpans={bscSpans}
        activeMonth={activeMonth}
        setActiveMonth={setActiveMonth}
        activeDate={activeDate}
        setActiveDate={setActiveDate}
        loadingDaily={loadingDaily}
        savingDay={savingDay}
        savingMonth={savingMonth}
        handleSaveDay={handleSaveDay}
        handleSaveMonth={handleSaveMonth}
        getDailyEntry={getDailyEntry}
        getMonthEntry={getMonthEntry}
        updateDailyEntry={updateDailyEntry}
        updateMonthEntry={updateMonthEntry}
        getQuarterAgg={quarterAgg}
        getYearAgg={yearAgg}
      />
    </div>
  );
};

export default DataEntryView;
