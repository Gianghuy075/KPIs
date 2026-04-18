import { useEffect, useMemo, useState } from 'react';
import { Select, Card, Space, Spin, message } from 'antd';
import EmployeeKpiView from './EmployeeKpiView';
import { useWorkshopKpiDataset } from '../../hooks/useWorkshopKpiDataset';
import { useWorkshopKpiMeta } from '../../hooks/useWorkshopKpiMeta';
import { getCurrentYear, getYearRange } from '../../constants/year';

const currentYear = getCurrentYear();
const yearOptions = getYearRange(currentYear).map((year) => ({ value: year, label: String(year) }));

const AdminKpiOverview = () => {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);

  const {
    workshops,
    bscCategories,
    penaltyLogics,
    loading: loadingMeta,
    error: metaError,
  } = useWorkshopKpiMeta({ includeWorkshops: true, includePenaltyLogics: true });

  useEffect(() => {
    if (workshops.length && !selectedWorkshopId) {
      setSelectedWorkshopId(workshops[0].id);
    }
  }, [selectedWorkshopId, workshops]);

  const {
    kpis,
    entriesByKpi,
    loading: loadingKpis,
    error: datasetError,
  } = useWorkshopKpiDataset({
    year: selectedYear,
    workshopId: selectedWorkshopId,
    includeMonthlyEntries: true,
    normalizeMonthlyEntries: true,
    enabled: Boolean(selectedWorkshopId),
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

  if (loadingMeta) return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Space>
          <span style={{ fontWeight: 500 }}>Năm:</span>
          <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} style={{ width: 100 }} />
          <span style={{ fontWeight: 500 }}>Phân xưởng:</span>
          <Select
            value={selectedWorkshopId}
            onChange={setSelectedWorkshopId}
            options={workshops.map((workshop) => ({ value: workshop.id, label: workshop.name }))}
            style={{ width: 220 }}
            placeholder="Chọn phân xưởng"
          />
        </Space>
      </Card>

      {loadingKpis ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : selectedWorkshopId && kpis.length > 0 ? (
        <EmployeeKpiView
          kpis={kpis}
          bscCategoryMap={bscCategoryMap}
          penaltyLogics={penaltyLogics}
          year={selectedYear}
          allEntries={entriesByKpi}
        />
      ) : (
        <Card>
          <span style={{ color: '#6b7280' }}>
            {selectedWorkshopId ? `Không có KPI nào trong năm ${selectedYear}.` : 'Chọn phân xưởng để xem KPI.'}
          </span>
        </Card>
      )}
    </div>
  );
};

export default AdminKpiOverview;
