import { useEffect, useState } from 'react';
import { Spin, message } from 'antd';
import { useMonthlyEntriesMap } from '../../../hooks/useMonthlyEntriesMap';
import {
  KpiBreakdownTable,
  MonthlyFilter,
  MonthlyInfoBanner,
  MonthlySummaryCards,
  PeopleScoreTable,
} from './components';
import { useMonthlyScoreData } from './useMonthlyScoreData';

const MonthlyScoreView = ({
  kpis,
  bscCategoryMap,
  penaltyLogics,
  year,
  bonusConfig,
  employees = [],
}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const {
    entriesByKpi,
    loading,
    error,
  } = useMonthlyEntriesMap({
    kpis,
    normalize: true,
    enabled: (kpis || []).length > 0,
  });

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const {
    config,
    scoreRows,
    individualScore,
    deptScore,
    finalScore,
    peopleRows,
  } = useMonthlyScoreData({
    kpis,
    bscCategoryMap,
    penaltyLogics,
    selectedMonth,
    bonusConfig,
    entriesByKpi,
    employees,
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <MonthlyInfoBanner config={config} />

      <MonthlyFilter selectedMonth={selectedMonth} onChange={setSelectedMonth} />

      <MonthlySummaryCards
        year={year}
        selectedMonth={selectedMonth}
        config={config}
        individualScore={individualScore}
        deptScore={deptScore}
        finalScore={finalScore}
      />

      <PeopleScoreTable
        selectedMonth={selectedMonth}
        peopleRows={peopleRows}
        individualScore={individualScore}
        deptScore={deptScore}
        finalScore={finalScore}
      />

      <KpiBreakdownTable
        selectedMonth={selectedMonth}
        config={config}
        scoreRows={scoreRows}
        individualScore={individualScore}
      />
    </div>
  );
};

export default MonthlyScoreView;
