import { Spin } from 'antd';
import { PeriodTargetHeader, PeriodTargetTabs } from './components';
import { usePeriodTargetState } from './usePeriodTargetState';

const PeriodTargetEditor = ({ kpis, bscCategoryMap, year }) => {
  const {
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
  } = usePeriodTargetState({
    kpis,
    bscCategoryMap,
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PeriodTargetHeader year={year} allDiffsZero={allDiffsZero} saving={saving} onSave={handleSave} />
      <PeriodTargetTabs
        rows={groupedRows}
        getLocal={getLocal}
        handleQuarterChange={handleQuarterChange}
        handleMonthChange={handleMonthChange}
        yearTarget={yearTarget}
        sumQuarterly={sumQuarterly}
        sumMonthly={sumMonthly}
      />
    </div>
  );
};

export default PeriodTargetEditor;
