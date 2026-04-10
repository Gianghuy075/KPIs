import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Space, Tag, message } from 'antd';
import { PlusOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { companyKpiService } from '../../services/companyKpiService';

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
  const [distributingId, setDistributingId] = useState(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await companyKpiService.list();
      setData(res);
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
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (err) {
      message.error('Không tạo được KPI');
    }
  };

  const handleDistribute = async (id) => {
    setDistributingId(id);
    try {
      await companyKpiService.distribute(id);
      message.success('Đã phân bổ xuống phân xưởng');
      load();
    } catch {
      message.error('Phân bổ thất bại');
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
    { title: 'Category', dataIndex: 'category', key: 'category', render: (c) => categories.find(x=>x.value===c)?.label || c },
    { title: 'Target', key: 'target', render: (_, r) => formatValue(r.targetValue, r.unit) },
    { title: 'Hạn', dataIndex: 'targetDate', key: 'targetDate', render: (d)=> dayjs(d).format('YYYY-MM-DD') },
    { title: 'Chiến lược', dataIndex: 'distributionStrategy', key: 'distributionStrategy', render:(v)=> v === 'equal' ? 'Chia đều' : v },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render:(s)=> <Tag>{s === 'draft' ? 'Nháp' : s === 'assigned' ? 'Đã phân bổ' : s === 'in_progress' ? 'Đang thực hiện' : s === 'completed' ? 'Hoàn thành' : s}</Tag> },
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
            onClick={() => handleDistribute(record._id)}
          >
            Phân bổ
          </Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(record._id)} />
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="KPI BSC (Công ty)"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Tạo KPI</Button>}
    >
      <Table columns={columns} dataSource={data} loading={loading} rowKey="_id" />

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
          <Form.Item name="targetValue" label="Giá trị mục tiêu" rules={[{ required: true, type: 'number', min: 0 }]}>
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
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CompanyKPI;
