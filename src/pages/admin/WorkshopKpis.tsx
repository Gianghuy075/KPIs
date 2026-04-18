import React, { useEffect, useMemo, useState } from 'react';
import {
  Select, Button, Space, Modal, Spin, message, Card,
  Form, Input, InputNumber, App as AntApp,
} from 'antd';
import { PlusOutlined, BarChartOutlined } from '@ant-design/icons';
import WorkshopKpiCreateForm from '../../features/workshop-kpi/WorkshopKpiCreateForm';
import PeriodTargetEditor from '../../features/workshop-kpi/PeriodTargetEditor';
import KpiSystemTable from '../../components/KpiSystemTable';
import workshopKpiService from '../../services/workshopKpiService';
import { getCurrentYear, getYearRange, toYearOptions } from '../../constants/year';
import { useWorkshopKpiMeta } from '../../hooks/useWorkshopKpiMeta';
import { useWorkshopKpiDataset } from '../../hooks/useWorkshopKpiDataset';
import type { UpsertKpiBulkItemRequest, UUID } from '../../types/api';

const currentYear = getCurrentYear();
const years = getYearRange(currentYear);

const extractErrorMessage = (error, fallback = 'Thao tác thất bại') => {
  const apiMessage = error?.response?.data?.message;
  if (Array.isArray(apiMessage)) return apiMessage.join(', ');
  if (apiMessage) return String(apiMessage);
  if (error?.message) return error.message;
  return fallback;
};

const WorkshopKpis = () => {
  const { modal } = AntApp.useApp();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

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
    reload,
  } = useWorkshopKpiDataset({
    year: selectedYear,
    workshopId: selectedWorkshopId,
    includeMonthlyEntries: true,
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
      await workshopKpiService.update(editingKpi.id, values);
      message.success('Đã cập nhật KPI');
      setEditOpen(false);
      setEditingKpi(null);
      reload();
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
        message.success('Đã xóa KPI');
        reload();
      },
    });
  };

  const handleUpsertKpis = async (
    payloads: UpsertKpiBulkItemRequest[],
    workshopId: UUID,
    year: string,
  ) => {
    try {
      await workshopKpiService.upsertBulk({
        year: Number(year),
        phanXuongId: workshopId,
        kpis: payloads,
      });

      if (String(workshopId) === String(selectedWorkshopId) && String(year) === String(selectedYear)) {
        reload();
      }
      message.success('Đã lưu KPI thành công');
      setCreateModalOpen(false);
    } catch (error) {
      message.error(extractErrorMessage(error, 'Lưu KPI thất bại'));
      throw error;
    }
  };

  const yearOptions = toYearOptions(years);
  const workshopOptions = workshops.map((workshop) => ({ value: workshop.id, label: workshop.name }));

  if (loadingMeta) return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <Space>
            <span style={{ fontWeight: 500 }}>Năm:</span>
            <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} style={{ width: 100 }} />
            <span style={{ fontWeight: 500 }}>Phân xưởng:</span>
            <Select
              value={selectedWorkshopId}
              onChange={setSelectedWorkshopId}
              options={workshopOptions}
              style={{ width: 200 }}
              placeholder="Chọn phân xưởng"
            />
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
        allEntries={entriesByKpi}
        bscCategoryMap={bscCategoryMap}
        penaltyLogics={penaltyLogics}
        canManage
        onEdit={openEdit}
        onDelete={handleDelete}
        loading={loadingKpis}
      />

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
        width="min(1280px, 96vw)"
        destroyOnClose
      >
        <WorkshopKpiCreateForm
          workshops={workshops}
          bscCategories={bscCategories}
          years={years}
          penaltyLogics={penaltyLogics}
          initialYear={selectedYear}
          initialWorkshopId={selectedWorkshopId}
          onUpsertKpis={handleUpsertKpis}
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
