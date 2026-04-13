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
        targetDate: values.targetDate.toISOString(),
        weight: Number(values.weight ?? 0),
      };
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
    if (record.distributionStrategy === 'percent') {
      message.info('KPI này cần nhập % cho từng phân xưởng');
      const initial = branches.map(b => ({
        branchId: b._id,
        percent: +(100 / branches.length).toFixed(1),
      }));
      allocForm.setFieldsValue({ allocations: initial });
      setCurrentKpi(record);
      setAllocModalOpen(true);
      return;
    }

    setDistributingId(record._id);
    try {
      await companyKpiService.distribute(record._id);
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
      weight: record.weight || 0,
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
        distributionStrategy: values.distributionStrategy,
        weight: Number(values.weight ?? 0),
      };
      await companyKpiService.update(currentKpi._id, payload);
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
      setDistributingId(currentKpi._id);
      await companyKpiService.distribute(currentKpi._id, { strategy: 'percent', allocations });
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
      render: v => (v === 'equal' ? 'Chia đều' : v === 'percent' ? 'Chia theo %' : v),
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
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button
            icon={<SendOutlined />}
            size="small"
            disabled={record.status !== 'draft' || distributingId === record._id}
            loading={distributingId === record._id}
            onClick={() => handleDistribute(record)}
          >
            Phân bổ
          </Button>
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record._id)}
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
        onFinish={(vals) => {
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
          <Select
            allowClear
            placeholder="Góc độ"
            options={categories}
            style={{ width: 160 }}
          />
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
            <Button type="primary" htmlType="submit">Lọc</Button>
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

      <Table columns={columns} dataSource={data} loading={loading} rowKey="_id" />

      <Modal
        title="Phân bổ theo % cho phân xưởng"
        open={allocModalOpen}
        onCancel={() => {
          setAllocModalOpen(false);
          setCurrentKpi(null);
        }}
        onOk={submitPercentAlloc}
        okButtonProps={{ loading: distributingId === currentKpi?._id }}
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
                          b => b._id === allocForm.getFieldValue(['allocations', idx, 'branchId']),
                        )?.name ||
                        'Phân xưởng'}
                    </div>
                <Form.Item
                  {...field}
                  name={[field.name, 'percent']}
                  rules={[{ required: true, message: 'Nhập %' }]}
                >
                  <Space.Compact>
                    <Form.Item name={[field.name, 'percent']} noStyle>
                      <InputNumber min={0} max={100} />
                    </Form.Item>
                    <Button disabled>%</Button>
                  </Space.Compact>
                </Form.Item>
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
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="Tên KPI" rules={[{ required: true }]}>
            <Input placeholder="VD: Doanh thu tháng 6/2026" />
          </Form.Item>
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={categories} placeholder="Chọn category" />
          </Form.Item>
          <Form.Item
            name="targetValue"
            label="Giá trị mục tiêu"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => (
              <Form.Item
                name="weight"
                label="Trọng số (%)"
                rules={[
                  { required: true, message: 'Nhập trọng số' },
                  { type: 'number', min: 0, max: 100 },
                ]}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="weight" noStyle>
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                  <Button disabled>%</Button>
                </Space.Compact>
                <div style={{ color: '#999', marginTop: 4, fontSize: 12 }}>
                  Trọng số dùng để tính điểm BSC trên Dashboard.
                </div>
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
            <Input placeholder="VND, khách, đơn..." />
          </Form.Item>
          <Form.Item name="targetDate" label="Hạn hoàn thành" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="distributionStrategy" label="Cách phân bổ" initialValue="equal">
            <Select
              options={[
                { value: 'equal', label: 'Chia đều cho phân xưởng' },
                { value: 'percent', label: 'Chia theo % từng phân xưởng' },
              ]}
            />
            <div style={{ color: '#f5222d', marginTop: 4, fontSize: 12 }}>
              * Chọn Chia theo % cho từng công xưởng sẽ yêu cầu nhập tỷ lệ từng phân xưởng khi bấm
              Phân bổ
            </div>
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
          <Form.Item name="category" label="Category" rules={[{ required: true }]}>
            <Select options={categories} placeholder="Chọn category" />
          </Form.Item>
          <Form.Item
            name="targetValue"
            label="Giá trị mục tiêu"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {() => (
              <Form.Item
                name="weight"
                label="Trọng số (%)"
                rules={[{ type: 'number', min: 0, max: 100 }]}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="weight" noStyle>
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                  <Button disabled>%</Button>
                </Space.Compact>
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
            <Input placeholder="VND, khách, đơn..." />
          </Form.Item>
          <Form.Item name="targetDate" label="Hạn hoàn thành" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="distributionStrategy" label="Cách phân bổ" initialValue="equal">
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
