import React, { useState, useEffect, useMemo } from 'react';
import { Select, Button, Space, Modal, Spin, message, Card } from 'antd';
import { PlusOutlined, BarChartOutlined } from '@ant-design/icons';
import WorkshopKpiTable from '../../features/workshop-kpi/WorkshopKpiTable';
import WorkshopKpiCreateForm from '../../features/workshop-kpi/WorkshopKpiCreateForm';
import PeriodTargetEditor from '../../features/workshop-kpi/PeriodTargetEditor';
import workshopKpiService from '../../services/workshopKpiService';
import penaltyService from '../../services/penaltyService';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear + 1];

const WorkshopKpis = () => {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);

  const [kpis, setKpis] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [penaltyLogics, setPenaltyLogics] = useState([]);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingKpis, setLoadingKpis] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);

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
    }).catch(() => message.error('Không thể tải dữ liệu khởi tạo'))
      .finally(() => setLoadingMeta(false));
  }, []);

  useEffect(() => {
    if (!selectedWorkshopId || !selectedYear) return;
    setLoadingKpis(true);
    workshopKpiService.list({ year: selectedYear, phanXuongId: selectedWorkshopId })
      .then(setKpis)
      .catch(() => message.error('Không thể tải danh sách KPI'))
      .finally(() => setLoadingKpis(false));
  }, [selectedWorkshopId, selectedYear]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [bscCategories]);

  const groupedKpis = useMemo(() => {
    const groups = {};
    kpis.forEach(kpi => {
      const catName = bscCategoryMap[kpi.bscCategoryId] || 'Khác';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(kpi);
    });
    return groups;
  }, [kpis, bscCategoryMap]);

  const handleUpdate = async (id, values) => {
    try {
      const updated = await workshopKpiService.update(id, values);
      setKpis(prev => prev.map(k => k.id === id ? { ...k, ...updated } : k));
      message.success('Đã cập nhật KPI');
    } catch {
      message.error('Cập nhật thất bại');
    }
  };

  const handleCreateKpi = async (payload, workshopIds, year) => {
    try {
      await Promise.all(workshopIds.map(phanXuongId =>
        workshopKpiService.create({ ...payload, phanXuongId, year: Number(year) })
      ));
      if (workshopIds.includes(selectedWorkshopId)) {
        const updated = await workshopKpiService.list({ year: selectedYear, phanXuongId: selectedWorkshopId });
        setKpis(updated);
      }
    } catch {
      message.error('Tạo KPI thất bại');
    }
  };

  const yearOptions = years.map(y => ({ value: String(y), label: String(y) }));
  const workshopOptions = workshops.map(w => ({ value: w.id, label: w.name }));

  if (loadingMeta) return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>Năm:</span>
            <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} style={{ width: 100 }} />
            <span style={{ fontWeight: 500 }}>Phân xưởng:</span>
            <Select value={selectedWorkshopId} onChange={setSelectedWorkshopId} options={workshopOptions} style={{ width: 200 }} placeholder="Chọn phân xưởng" />
          </Space>
          <Space>
            <Button icon={<BarChartOutlined />} onClick={() => setPeriodModalOpen(true)} disabled={!kpis.length}>
              Chia mục tiêu
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
              Thêm KPI
            </Button>
          </Space>
        </div>
      </Card>

      {loadingKpis ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        Object.entries(groupedKpis).map(([catName, catKpis]) => (
          <WorkshopKpiTable key={catName} title={catName} items={catKpis} onUpdate={handleUpdate} />
        ))
      )}

      {!loadingKpis && kpis.length === 0 && selectedWorkshopId && (
        <Card>
          <div style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
            Chưa có KPI nào cho phân xưởng này. Nhấn "Thêm KPI" để bắt đầu.
          </div>
        </Card>
      )}

      <Modal
        title="Thêm KPI mới"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        footer={null}
        width={900}
        destroyOnClose
      >
        <WorkshopKpiCreateForm
          workshops={workshops}
          bscCategories={bscCategories}
          years={years}
          penaltyLogics={penaltyLogics}
          onCreateKpi={async (payload, workshopIds, year) => {
            await handleCreateKpi(payload, workshopIds, year);
            setCreateModalOpen(false);
          }}
        />
      </Modal>

      <Modal
        title={`Chia mục tiêu theo kỳ — ${selectedYear}`}
        open={periodModalOpen}
        onCancel={() => setPeriodModalOpen(false)}
        footer={null}
        width={1100}
        destroyOnClose
      >
        <PeriodTargetEditor
          kpis={kpis}
          bscCategoryMap={bscCategoryMap}
          year={selectedYear}
        />
      </Modal>
    </div>
  );
};

export default WorkshopKpis;
