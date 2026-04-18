import { useEffect, useMemo, useState } from 'react';
import { Card, Select, Space, Spin, message } from 'antd';
import MonthlyScoreView from '../../features/workshop-kpi/MonthlyScoreView';
import { useWorkshopKpiMeta } from '../../hooks/useWorkshopKpiMeta';
import { useWorkshopKpiDataset } from '../../hooks/useWorkshopKpiDataset';
import { getCurrentYear, getYearRange, toYearOptions } from '../../constants/year';
import { ROLES } from '../../constants/roles';
import { userService } from '../../services/userService';

const currentYear = getCurrentYear();
const years = getYearRange(currentYear);

const AdminMonthlyScores = () => {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

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
    bonusConfig,
    loading: loadingKpis,
    error: datasetError,
  } = useWorkshopKpiDataset({
    year: selectedYear,
    workshopId: selectedWorkshopId,
    includeBonusConfig: true,
    enabled: Boolean(selectedWorkshopId),
  });

  useEffect(() => {
    if (metaError) message.error(metaError);
  }, [metaError]);

  useEffect(() => {
    if (datasetError) message.error(datasetError);
  }, [datasetError]);

  useEffect(() => {
    if (!selectedWorkshopId) {
      setEmployees([]);
      setLoadingEmployees(false);
      return;
    }

    let mounted = true;
    setLoadingEmployees(true);

    userService
      .getUsers({ role: ROLES.EMPLOYEE, phanXuongId: selectedWorkshopId })
      .then((rows) => {
        if (!mounted) return;
        const activeEmployees = (rows || []).filter((row) => row.isActive !== false);
        setEmployees(activeEmployees);
      })
      .catch((error) => {
        if (!mounted) return;
        const apiMessage = error?.response?.data?.message;
        const msg = Array.isArray(apiMessage)
          ? apiMessage.join(', ')
          : (apiMessage || error?.message || 'Không thể tải danh sách nhân viên');
        message.error(msg);
        setEmployees([]);
      })
      .finally(() => {
        if (mounted) setLoadingEmployees(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedWorkshopId]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  }, [bscCategories]);

  const yearOptions = toYearOptions(years);
  const workshopOptions = workshops.map((workshop) => ({ value: workshop.id, label: workshop.name }));

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
            options={workshopOptions}
            style={{ width: 220 }}
            placeholder="Chọn phân xưởng"
          />
        </Space>
      </Card>

      {loadingKpis || loadingEmployees ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : kpis.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
            Chưa có KPI nào cho năm {selectedYear}.
          </div>
        </Card>
      ) : (
        <MonthlyScoreView
          kpis={kpis}
          bscCategoryMap={bscCategoryMap}
          penaltyLogics={penaltyLogics}
          year={selectedYear}
          bonusConfig={bonusConfig}
          employees={employees}
        />
      )}
    </div>
  );
};

export default AdminMonthlyScores;
