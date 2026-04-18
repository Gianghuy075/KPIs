import { useEffect, useMemo, useState } from 'react';
import { Card, Select, Space, Spin, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import EmployeeKpiView from '../../features/workshop-kpi/EmployeeKpiView';
import { getCurrentYear, getYearRange } from '../../constants/year';
import { useWorkshopKpiMeta } from '../../hooks/useWorkshopKpiMeta';
import { useWorkshopKpiDataset } from '../../hooks/useWorkshopKpiDataset';

const currentYear = getCurrentYear();
const yearOptions = getYearRange(currentYear).map((year) => ({ value: year, label: String(year) }));

const MyKPI = () => {
  const { user } = useAuth();
  const [year, setYear] = useState(currentYear);

  const phanXuongId = user?.phanXuongId;

  const {
    bscCategories,
    penaltyLogics,
    error: metaError,
  } = useWorkshopKpiMeta({ includePenaltyLogics: true });

  const {
    kpis,
    entriesByKpi,
    loading,
    error: datasetError,
  } = useWorkshopKpiDataset({
    year,
    workshopId: phanXuongId,
    includeMonthlyEntries: true,
    normalizeMonthlyEntries: true,
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

  if (!phanXuongId) {
    return (
      <Card title="KPI của tôi">
        <p style={{ color: '#6b7280' }}>Tài khoản chưa được gán phân xưởng.</p>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <span>KPI của tôi</span>
          <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 100 }} size="small" />
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <EmployeeKpiView
          kpis={kpis}
          bscCategoryMap={bscCategoryMap}
          penaltyLogics={penaltyLogics}
          year={year}
          allEntries={entriesByKpi}
        />
      )}
    </Card>
  );
};

export default MyKPI;
