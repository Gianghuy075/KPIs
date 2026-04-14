import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Space, Tag, App as AntApp } from 'antd';
import { PlusOutlined, SendOutlined, DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { companyKpiService } from '../../services/companyKpiService';
import { branchService } from '../../services/branchService';

const categories = [
  { value: 'business', label: 'Kinh doanh' },
  { value: 'customer', label: 'Khách hàng' },
  { value: 'internal', label: 'Nội bộ' },
  { value: 'learning', label: 'Học tập & Phát triển' },
];

const isPercentStrategy = strategy => {
  const normalized = String(strategy || '')
    .trim()
    .toLowerCase();
  return normalized === 'percent' || normalized === 'chia theo %';
};

const buildInitialPercentAllocations = branches => {
  if (!branches?.length) return [];
  const count = branches.length;
  const base = Number((100 / count).toFixed(2));
  const allocations = branches.map(branch => ({
    branchId: branch._id || branch.id,
    percent: base,
  }));
  const total = Number((base * count).toFixed(2));
  const diff = Number((100 - total).toFixed(2));
  allocations[count - 1].percent = Number((allocations[count - 1].percent + diff).toFixed(2));
  return allocations;
};

const getEntityId = entity => entity?._id || entity?.id;
const extractDistributionStrategy = strategy => {
  if (strategy && typeof strategy === 'object') {
    const valueLike = strategy.value ?? strategy.key ?? strategy.label ?? '';
    return extractDistributionStrategy(valueLike);
  }
  return String(strategy || '')
    .trim()
    .toLowerCase();
};

const normalizeDistributionStrategy = strategy => {
  const normalized = extractDistributionStrategy(strategy);
  if (normalized === 'percent' || normalized.includes('%')) return 'percent';
  if (normalized === 'manual') return 'manual';
  if (normalized === 'equal' || normalized.includes('đều')) return 'equal';
  return 'equal';
};

const CompanyKPI = () => {
  const { modal, message } = AntApp.useApp();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [currentKpi, setCurrentKpi] = useState(null);
  const [branches, setBranches] = useState([]);
  const [distributingId, setDistributingId] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [filters, setFilters] = useState({});
  const [allocForm] = Form.useForm();

  const load = async (params = {}) => {
    setLoading(true);
    try {
      const [res, br] = await Promise.all([companyKpiService.list(params), branchService.getBranches()]);
      setData(res);
      setBranches(br || []);
    } catch (err) {
      message.error('Không tải được KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filters);
  }, [filters]);

  const handleCreate = async (values) => {
    try {
      const payload = {
        ...values,
        distributionStrategy: normalizeDistributionStrategy(values.distributionStrategy),
        targetDate: values.targetDate.toISOString(),
      };
      console.log('[CompanyKPI] Create payload:', payload);
      await companyKpiService.create(payload);
      message.success('Tạo KPI thành công');
      load(filters);
      setModalOpen(false);
      form.resetFields();
    } catch (err) {
      message.error('Không tạo được KPI');
    }
  };

  const handleDistribute = async record => {
    const kpiId = getEntityId(record);
    if (record.status !== 'draft') {
      message.warning('Chỉ phân bổ được KPI ở trạng thái Nháp');
      return;
    }

    if (!branches.length) {
      message.warning('Chưa có phân xưởng để phân bổ');
      return;
    }

    if (isPercentStrategy(record.distributionStrategy)) {
      message.info('KPI này cần nhập % cho từng phân xưởng');
      const initial = buildInitialPercentAllocations(branches);
      allocForm.setFieldsValue({ allocations: initial });
      setCurrentKpi(record);
      setAllocModalOpen(true);
      return;
    }

    setDistributingId(kpiId);
    try {
      await companyKpiService.distribute(kpiId);
      message.success('Đã phân bổ xuống phân xưởng');
      load(filters);
    } catch {
      message.error('Phân bổ thất bại');
    } finally {
      setDistributingId(null);
    }
  };

  const handleEdit = (record) => {
    setCurrentKpi(record);
    editForm.setFieldsValue({
      title: record.title,
      category: record.category,
      targetValue: record.targetValue,
      unit: record.unit,
      targetDate: dayjs(record.targetDate),
      distributionStrategy: record.distributionStrategy,
    });
    setEditOpen(true);
  };

  const submitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setSavingEdit(true);
      const payload = {
        title: values.title,
        category: values.category,
        targetValue: values.targetValue,
        unit: values.unit,
        targetDate: values.targetDate?.toISOString(),
        distributionStrategy: normalizeDistributionStrategy(values.distributionStrategy),
      };
      await companyKpiService.update(getEntityId(currentKpi), payload);
      message.success('Đã cập nhật KPI');
      setEditOpen(false);
      setCurrentKpi(null);
      load(filters);
    } catch (err) {
      if (!err?.errorFields) message.error('Cập nhật thất bại');
    } finally {
      setSavingEdit(false);
    }
  };

  const submitPercentAlloc = async () => {
    try {
      const { allocations } = await allocForm.validateFields();
      const total = (allocations || []).reduce((s, a) => s + (a.percent || 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        message.error('Tổng % phải bằng 100');
        return;
      }
      const kpiId = getEntityId(currentKpi);
      setDistributingId(kpiId);
      await companyKpiService.distribute(kpiId, { strategy: 'percent', allocations });
      message.success('Đã phân bổ theo %');
      setAllocModalOpen(false);
      setCurrentKpi(null);
      load(filters);
    } catch (err) {
      if (!err?.errorFields) {
        message.error('Phân bổ thất bại');
      }
    } finally {
      setDistributingId(null);
    }
  };

  const handleDelete = async (id) => {
    modal.confirm({
      title: 'Xóa KPI?',
      onOk: async () => {
        try {
          await companyKpiService.remove(id);
          message.success('Đã xóa');
          load(filters);
        } catch {
          message.error('Xóa thất bại');
        }
      },
    });
  };

  const formatValue = (value, unit) => {
    if (typeof value !== 'number') return `${value} ${unit}`;
    const num = unit?.toLowerCase() === 'vnd' ? value.toLocaleString('vi-VN') : value.toLocaleString('vi-VN');
    return `${num} ${unit}`;
  };

  const columns = [
    { title: 'Tên KPI', dataIndex: 'title', key: 'title' },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: c => categories.find(x => x.value === c)?.label || c,
    },
    { title: 'Target', key: 'target', render: (_, r) => formatValue(r.targetValue, r.unit) },
    {
      title: 'Hạn',
      dataIndex: 'targetDate',
      key: 'targetDate',
      render: d => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: 'Chiến lược',
      dataIndex: 'distributionStrategy',
      key: 'distributionStrategy',
      render: v => {
        const strategy = normalizeDistributionStrategy(v);
        return strategy === 'percent'
          ? 'Chia theo %'
          : strategy === 'equal'
            ? 'Chia đều'
            : strategy;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: s => (
        <Tag>
          {s === 'draft'
            ? 'Nháp'
            : s === 'assigned'
              ? 'Đã phân bổ'
              : s === 'in_progress'
                ? 'Đang thực hiện'
                : s === 'completed'
                  ? 'Hoàn thành'
                  : s}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          <Button
            icon={<SendOutlined />}
            size="small"
            disabled={record.status !== 'draft' || distributingId === getEntityId(record)}
            loading={distributingId === getEntityId(record)}
            onClick={() => handleDistribute(record)}
          >
            Phân bổ
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(getEntityId(record))}
          />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="KPI BSC (Công ty)"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => load(filters)} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Tạo KPI
          </Button>
        </Space>
      }
    >
      <Form
        form={filterForm}
        layout="inline"
        style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}
        onFinish={vals => {
          const next = {
            search: vals.search || undefined,
            category: vals.category || undefined,
            status: vals.status || undefined,
            strategy: vals.strategy || undefined,
            fromDate: vals.dateRange?.[0]?.toISOString(),
            toDate: vals.dateRange?.[1]?.toISOString(),
          };
          setFilters(next);
        }}
      >
        <Form.Item name="search">
          <Input allowClear placeholder="Tìm tên KPI" style={{ minWidth: 200 }} />
        </Form.Item>
        <Form.Item name="category">
          <Select allowClear placeholder="Góc độ" options={categories} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="status">
          <Select
            allowClear
            placeholder="Trạng thái"
            options={[
              { value: 'draft', label: 'Nháp' },
              { value: 'assigned', label: 'Đã phân bổ' },
              { value: 'in_progress', label: 'Đang thực hiện' },
              { value: 'completed', label: 'Hoàn thành' },
            ]}
            style={{ width: 160 }}
          />
        </Form.Item>
        <Form.Item name="strategy">
          <Select
            allowClear
            placeholder="Chiến lược"
            options={[
              { value: 'equal', label: 'Chia đều' },
              { value: 'percent', label: 'Chia theo %' },
            ]}
            style={{ width: 160 }}
          />
        </Form.Item>
        <Form.Item name="dateRange">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Lọc
            </Button>
            <Button
              onClick={() => {
                filterForm.resetFields();
                setFilters({});
              }}
            >
              Xóa lọc
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <Table columns={columns} dataSource={data} loading={loading} rowKey={getEntityId} />

      <Modal
        title="Phân bổ theo % cho phân xưởng"
        open={allocModalOpen}
        onCancel={() => {
          setAllocModalOpen(false);
          setCurrentKpi(null);
        }}
        onOk={submitPercentAlloc}
        okButtonProps={{ loading: distributingId === getEntityId(currentKpi) }}
        destroyOnHide
      >
        <Form form={allocForm} layout="vertical">
          <Form.List name="allocations">
            {fields => (
              <div>
                {fields.map((field, idx) => (
                  <Space
                    key={field.key}
                    align="baseline"
                    style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Form.Item {...field} name={[field.name, 'branchId']} noStyle>
                      <Input style={{ display: 'none' }} />
                    </Form.Item>
                    <div style={{ minWidth: 140 }}>
                      {branches[idx]?.name ||
                        branches.find(
                          b =>
                            getEntityId(b) ===
                            allocForm.getFieldValue(['allocations', idx, 'branchId']),
                        )?.name ||
                        'Phân xưởng'}
                    </div>
                    <Form.Item
                      {...field}
                      name={[field.name, 'percent']}
                      rules={[{ required: true, message: 'Nhập %' }]}
                    >
                      <InputNumber min={0} max={100} style={{ width: 120 }} />
                    </Form.Item>
                    <span>%</span>
                  </Space>
                ))}
              </div>
            )}
          </Form.List>
          <div style={{ color: '#999', marginTop: 8 }}>Tổng phải bằng 100%</div>
        </Form>
      </Modal>

      <Modal
        title="Tạo KPI BSC"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        destroyOnHide
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ distributionStrategy: 'equal' }}
        >
          <Form.Item name="title" label="Tên KPI" rules={[{ required: true }]}>
            <Input placeholder="VD: Doanh thu tháng 6/2026" />
          </Form.Item>
          <Form.Item name="category" label="Góc độ BSC" rules={[{ required: true }]}>
            <Select options={categories} placeholder="Chọn góc độ" />
          </Form.Item>
          <Form.Item
            name="targetValue"
            label="Giá trị mục tiêu"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
            <Input placeholder="VND, khách, đơn..." />
          </Form.Item>
          <Form.Item name="targetDate" label="Hạn hoàn thành" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="distributionStrategy"
            label="Cách phân bổ"
            rules={[{ required: true, message: 'Vui lòng chọn cách phân bổ' }]}
            extra="* Chọn Chia theo % sẽ yêu cầu nhập tỷ lệ từng phân xưởng khi bấm Phân bổ"
          >
            <Select
              options={[
                { value: 'equal', label: 'Chia đều cho phân xưởng' },
                { value: 'percent', label: 'Chia theo % từng phân xưởng' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa KPI"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setCurrentKpi(null);
        }}
        onOk={submitEdit}
        okButtonProps={{ loading: savingEdit }}
        destroyOnHide
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Tên KPI" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Góc độ BSC" rules={[{ required: true }]}>
            <Select options={categories} placeholder="Chọn góc độ" />
          </Form.Item>
          <Form.Item
            name="targetValue"
            label="Giá trị mục tiêu"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
            <Input placeholder="VND, khách, đơn..." />
          </Form.Item>
          <Form.Item name="targetDate" label="Hạn hoàn thành" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="distributionStrategy"
            label="Cách phân bổ"
            rules={[{ required: true, message: 'Vui lòng chọn cách phân bổ' }]}
          >
            <Select
              options={[
                { value: 'equal', label: 'Chia đều cho phân xưởng' },
                { value: 'percent', label: 'Chia theo % từng phân xưởng' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CompanyKPI;
