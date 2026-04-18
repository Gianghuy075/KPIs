import { useState, useEffect, useMemo } from 'react';
import { Card, Select, Space, Spin, message } from 'antd';
import workshopKpiService from '../../services/workshopKpiService';
import penaltyService from '../../services/penaltyService';
import bonusConfigService from '../../services/bonusConfigService';
import MonthlyScoreView from '../../features/workshop-kpi/MonthlyScoreView';

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

const AdminMonthlyScores = () => {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);

  const [workshops, setWorkshops] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [penaltyLogics, setPenaltyLogics] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [bonusConfig, setBonusConfig] = useState(null);

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
    Promise.all([
      workshopKpiService.list({ year: selectedYear, phanXuongId: selectedWorkshopId }),
      bonusConfigService.list({ year: selectedYear, phanXuongId: selectedWorkshopId }),
    ]).then(([kpiList, cfgList]) => {
      setKpis(kpiList);
      setBonusConfig(cfgList?.[0] ?? null);
    }).catch(() => message.error('Không thể tải danh sách KPI'))
      .finally(() => setLoadingKpis(false));
  }, [selectedWorkshopId, selectedYear]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [bscCategories]);

  const yearOptions = years.map(y => ({ value: String(y), label: String(y) }));
  const workshopOptions = workshops.map(w => ({ value: w.id, label: w.name }));

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

      {loadingKpis ? (
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
        />
      )}
    </div>
  );
};

export default AdminMonthlyScores;
