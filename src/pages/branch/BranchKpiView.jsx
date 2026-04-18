import { useState, useEffect, useMemo } from 'react';
import { Card, Select, Space, Spin, message } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import workshopKpiService from '../../services/workshopKpiService';
import penaltyService from '../../services/penaltyService';
import EmployeeKpiView from '../../features/workshop-kpi/EmployeeKpiView';

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => ({ value: y, label: String(y) }));

const BranchKpiView = () => {
  const { user } = useAuth();
  const [year, setYear] = useState(currentYear);
  const [kpis, setKpis] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [penaltyLogics, setPenaltyLogics] = useState([]);
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(false);

  const phanXuongId = user?.phanXuongId;

  useEffect(() => {
    Promise.all([
      workshopKpiService.listBscCategories(),
      penaltyService.list(),
    ]).then(([bsc, pl]) => {
      setBscCategories(bsc);
      setPenaltyLogics(pl);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!phanXuongId) return;
    setLoading(true);
    workshopKpiService.list({ year, phanXuongId })
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
      .finally(() => setLoading(false));
  }, [year, phanXuongId]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [bscCategories]);

  if (!phanXuongId) {
    return (
      <Card title="Chi tiết KPI">
        <p style={{ color: '#6b7280' }}>Tài khoản chưa được gán phân xưởng.</p>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <span>Chi tiết KPI phân xưởng</span>
          <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 100 }} size="small" />
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : (
        <EmployeeKpiView
          kpis={kpis}
          bscCategoryMap={bscCategoryMap}
          penaltyLogics={penaltyLogics}
          year={year}
          allEntries={allEntries}
        />
      )}
    </Card>
  );
};

export default BranchKpiView;
