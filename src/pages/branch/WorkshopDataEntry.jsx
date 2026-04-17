import React, { useState, useEffect, useMemo } from 'react';
import { Select, Space, Card, Spin, message } from 'antd';
import DataEntryView from '../../features/workshop-kpi/DataEntryView';
import workshopKpiService from '../../services/workshopKpiService';
import { useAuth } from '../../contexts/AuthContext';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear + 1];

const WorkshopDataEntry = () => {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [kpis, setKpis] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const phanXuongId = user?.phanXuongId;

  useEffect(() => {
    workshopKpiService.listBscCategories()
      .then(setBscCategories)
      .catch(() => message.error('Không thể tải danh mục BSC'));
  }, []);

  useEffect(() => {
    if (!phanXuongId) return;
    setLoading(true);
    workshopKpiService.list({ year: selectedYear, phanXuongId })
      .then(setKpis)
      .catch(() => message.error('Không thể tải danh sách KPI'))
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
        <DataEntryView kpis={kpis} bscCategoryMap={bscCategoryMap} year={selectedYear} />
      )}
    </div>
  );
};

export default WorkshopDataEntry;
