import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Space, Tag, message } from 'antd';
import { PlusOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [currentKpi, setCurrentKpi] = useState(null);
  const [branches, setBranches] = useState([]);
  const [distributingId, setDistributingId] = useState(null);
  const [form] = Form.useForm();
  const [allocForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [res, br] = await Promise.all([companyKpiService.list(), branchService.getBranches()]);
      setData(res);
      setBranches(br || []);
    } catch (err) {
      message.error('Không tải được KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (values) => {
    try {
      await companyKpiService.create({
        ...values,
        targetDate: values.targetDate.toISOString(),
      });
      message.success('Tạo KPI thành công');
      load();
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
      load();
    } catch {
      message.error('Phân bổ thất bại');
    } finally {
      setDistributingId(null);
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
      load();
    } catch (err) {
      if (!err?.errorFields) {
        message.error('Phân bổ thất bại');
      }
    } finally {
      setDistributingId(null);
    }
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Xóa KPI?',
      onOk: async () => {
        try {
          await companyKpiService.remove(id);
          message.success('Đã xóa');
          load();
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
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Tạo KPI
        </Button>
      }
    >
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
        destroyOnClose
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
                      <InputNumber min={0} max={100} addonAfter="%" />
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
    </Card>
  );
};

export default CompanyKPI;
