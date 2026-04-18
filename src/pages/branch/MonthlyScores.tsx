import { useEffect, useMemo, useState } from 'react';
import { Select, Space, Card, Spin, message } from 'antd';
import MonthlyScoreView from '../../features/workshop-kpi/MonthlyScoreView';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentYear, getYearRange, toYearOptions } from '../../constants/year';
import { useWorkshopKpiMeta } from '../../hooks/useWorkshopKpiMeta';
import { useWorkshopKpiDataset } from '../../hooks/useWorkshopKpiDataset';

const currentYear = getCurrentYear();
const years = getYearRange(currentYear);

const MonthlyScores = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const phanXuongId = user?.phanXuongId;

  const {
    bscCategories,
    penaltyLogics,
    error: metaError,
  } = useWorkshopKpiMeta({ includePenaltyLogics: true });

  const {
    kpis,
    bonusConfig,
    loading,
    error: datasetError,
  } = useWorkshopKpiDataset({
    year: selectedYear,
    workshopId: phanXuongId,
    includeBonusConfig: true,
    enabled: Boolean(phanXuongId),
  });

  useEffect(() => {
    if (metaError) message.error(metaError);
  }, [metaError]);

  useEffect(() => {
    if (datasetError) message.error(datasetError);
  }, [datasetError]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [bscCategories]);

  const workshopKpis = useMemo(() => {
    if (!phanXuongId) return [];
    return (kpis || []).filter((kpi) => {
      const kpiWorkshopId = kpi.phanXuongId || kpi.phanXuong?.id;
      return String(kpiWorkshopId) === String(phanXuongId);
    });
  }, [kpis, phanXuongId]);

  const yearOptions = toYearOptions(years);

  if (!phanXuongId) {
    return <Card><div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Tài khoản của bạn chưa được gán phân xưởng.</div></Card>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Space>
          <span style={{ fontWeight: 500 }}>Năm:</span>
          <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} style={{ width: 100 }} />
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : workshopKpis.length === 0 ? (
        <Card><div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Chưa có KPI nào cho năm {selectedYear}.</div></Card>
      ) : (
        <MonthlyScoreView
          kpis={workshopKpis}
          bscCategoryMap={bscCategoryMap}
          penaltyLogics={penaltyLogics}
          year={selectedYear}
          bonusConfig={bonusConfig}
        />
      )}
    </div>
  );
};

export default MonthlyScores;
