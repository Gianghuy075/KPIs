import React, { useState, useEffect, useMemo } from 'react';
import {
  Select, Button, Space, Modal, Spin, message, Card,
  Form, Input, InputNumber, App as AntApp,
} from 'antd';
import { PlusOutlined, BarChartOutlined } from '@ant-design/icons';
import WorkshopKpiCreateForm from '../../features/workshop-kpi/WorkshopKpiCreateForm';
import PeriodTargetEditor from '../../features/workshop-kpi/PeriodTargetEditor';
import KpiSystemTable from '../../components/KpiSystemTable';
import workshopKpiService from '../../services/workshopKpiService';
import penaltyService from '../../services/penaltyService';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear + 1];

const WorkshopKpis = () => {
  const { modal } = AntApp.useApp();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);

  const [kpis, setKpis] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [penaltyLogics, setPenaltyLogics] = useState([]);
  const [allEntries, setAllEntries] = useState({});

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingKpis, setLoadingKpis] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

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
      .then(async (kpiList) => {
        setKpis(kpiList);
        const entriesMap = {};
        await Promise.all(kpiList.map(async (kpi) => {
          try {
            const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
            entriesMap[kpi.id] = entries;
          } catch {
            entriesMap[kpi.id] = [];
          }
        }));
        setAllEntries(entriesMap);
      })
      .catch(() => message.error('Không thể tải danh sách KPI'))
      .finally(() => setLoadingKpis(false));
  }, [selectedWorkshopId, selectedYear]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [bscCategories]);

  const openEdit = (row) => {
    setEditingKpi(row);
    editForm.setFieldsValue({
      name: row.name,
      targetValue: row.targetValue,
      targetUnit: row.targetUnit,
      weight: row.weight,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      const updated = await workshopKpiService.update(editingKpi.id, values);
      setKpis(prev => prev.map(k => k.id === updated.id ? { ...k, ...updated } : k));
      message.success('Đã cập nhật KPI');
      setEditOpen(false);
      setEditingKpi(null);
    } catch (err) {
      if (!err?.errorFields) message.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    modal.confirm({
      title: 'Xóa KPI?',
      content: `Bạn chắc chắn muốn xóa "${row.name}"?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        await workshopKpiService.remove(row.id);
        setKpis(prev => prev.filter(k => k.id !== row.id));
        message.success('Đã xóa KPI');
      },
    });
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

      <KpiSystemTable
        kpis={kpis}
        allEntries={allEntries}
        bscCategoryMap={bscCategoryMap}
        penaltyLogics={penaltyLogics}
        canManage
        onEdit={openEdit}
        onDelete={handleDelete}
        loading={loadingKpis}
      />

      {/* Edit KPI Modal */}
      <Modal
        title="Chỉnh sửa KPI"
        open={editOpen}
        onCancel={() => { setEditOpen(false); setEditingKpi(null); }}
        onOk={handleUpdate}
        okButtonProps={{ loading: saving }}
        destroyOnHide
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="Tên KPI" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="targetValue" label="Mục tiêu" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="targetUnit" label="Đơn vị" rules={[{ required: true }]}>
            <Input placeholder="VD: %, triệu đồng, lỗi" />
          </Form.Item>
          <Form.Item name="weight" label="Trọng số (%)" rules={[{ type: 'number', min: 0, max: 100 }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
        </Form>
      </Modal>

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
