import React, { useState, useEffect, useMemo } from 'react';
import { Select, Space, Card, Spin, message } from 'antd';
import MonthlyScoreView from '../../features/workshop-kpi/MonthlyScoreView';
import workshopKpiService from '../../services/workshopKpiService';
import penaltyService from '../../services/penaltyService';
import bonusConfigService from '../../services/bonusConfigService';
import { useAuth } from '../../contexts/AuthContext';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear + 1];

const MonthlyScores = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [kpis, setKpis] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [penaltyLogics, setPenaltyLogics] = useState([]);
  const [bonusConfig, setBonusConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const phanXuongId = user?.phanXuongId;

  useEffect(() => {
    Promise.all([
      workshopKpiService.listBscCategories(),
      penaltyService.list(),
    ]).then(([bsc, pl]) => {
      setBscCategories(bsc);
      setPenaltyLogics(pl);
    }).catch(() => message.error('Không thể tải dữ liệu'));

  }, []);

  useEffect(() => {
    if (!phanXuongId) return;
    setLoading(true);
    Promise.all([
      workshopKpiService.list({ year: selectedYear, phanXuongId }),
      bonusConfigService.list({ year: selectedYear, phanXuongId }),
    ]).then(([kpiList, cfgList]) => {
      setKpis(kpiList);
      setBonusConfig(cfgList?.[0] ?? null);
    }).catch(() => message.error('Không thể tải danh sách KPI'))
      .finally(() => setLoading(false));
  }, [phanXuongId, selectedYear]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [bscCategories]);

  const yearOptions = years.map(y => ({ value: String(y), label: String(y) }));

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
      ) : kpis.length === 0 ? (
        <Card><div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>Chưa có KPI nào cho năm {selectedYear}.</div></Card>
      ) : (
        <MonthlyScoreView kpis={kpis} bscCategoryMap={bscCategoryMap} penaltyLogics={penaltyLogics} year={selectedYear} bonusConfig={bonusConfig} />
      )}
    </div>
  );
};

export default MonthlyScores;
