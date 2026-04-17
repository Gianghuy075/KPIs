import { useState, useEffect, useMemo } from 'react';
import { Select, Card, Space, Spin, message } from 'antd';
import workshopKpiService from '../../services/workshopKpiService';
import penaltyService from '../../services/penaltyService';
import EmployeeKpiView from './EmployeeKpiView';

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => ({ value: y, label: String(y) }));

const AdminKpiOverview = () => {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);

  const [workshops, setWorkshops] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [penaltyLogics, setPenaltyLogics] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [allEntries, setAllEntries] = useState({});
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingKpis, setLoadingKpis] = useState(false);

  useEffect(() => {
    Promise.all([
      workshopKpiService.listWorkshops(),
      workshopKpiService.listBscCategories(),
      penaltyService.list(),
    ]).then(([ws, bsc, pl]) => {
      setWorkshops(ws);
      setBscCategories(bsc);
      setPenaltyLogics(pl);
      if (ws.length) setSelectedWorkshopId(ws[0].id);
    }).catch(() => message.error('Không thể tải dữ liệu'))
      .finally(() => setLoadingMeta(false));
  }, []);

  useEffect(() => {
    if (!selectedWorkshopId) return;
    setLoadingKpis(true);
    workshopKpiService.list({ year: selectedYear, phanXuongId: selectedWorkshopId })
      .then(async (kpiList) => {
        setKpis(kpiList);
        const entriesMap = {};
        await Promise.all(kpiList.map(async (kpi) => {
          try {
            const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
            const map = {};
            (entries || []).forEach(e => {
              const idx = (e.month ?? e.monthIndex ?? 1) - 1;
              map[idx] = e;
            });
            entriesMap[kpi.id] = map;
          } catch {
            entriesMap[kpi.id] = {};
          }
        }));
        setAllEntries(entriesMap);
      })
      .catch(() => message.error('Không tải được KPI'))
      .finally(() => setLoadingKpis(false));
  }, [selectedWorkshopId, selectedYear]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach(c => { map[c.id] = c.name; });
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
            options={workshops.map(w => ({ value: w.id, label: w.name }))}
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
          allEntries={allEntries}
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
