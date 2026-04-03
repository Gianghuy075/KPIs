import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const WeightManagement = () => {
  const [weights, setWeights] = useState([
    { id: 1, name: 'Tính kỷ luật', weight: 10, description: 'Đánh giá tính kỷ luật trong công việc' },
    { id: 2, name: 'Hiệu suất', weight: 30, description: 'Đánh giá hiệu suất công việc' },
    { id: 3, name: 'Chất lượng', weight: 25, description: 'Đánh giá chất lượng sản phẩm/dịch vụ' },
    { id: 4, name: 'Hợp tác', weight: 20, description: 'Đánh giá khả năng hợp tác với đội' },
    { id: 5, name: 'Sáng tạo', weight: 15, description: 'Đánh giá tính sáng tạo và cải tiến' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tiêu chí đánh giá', dataIndex: 'name', key: 'name' },
    { title: 'Trọng số (%)', dataIndex: 'weight', key: 'weight', render: (text) => `${text}%` },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  const handleEdit = (weight) => {
    setEditingWeight(weight);
    form.setFieldsValue(weight);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa tiêu chí này?',
      onOk() {
        setWeights(weights.filter(w => w.id !== id));
        message.success('Xóa tiêu chí thành công');
      },
    });
  };

  const handleSubmit = (values) => {
    if (editingWeight) {
      setWeights(weights.map(w => w.id === editingWeight.id ? { ...w, ...values } : w));
      message.success('Cập nhật tiêu chí thành công');
    } else {
      setWeights([...weights, { id: Date.now(), ...values }]);
      message.success('Thêm tiêu chí thành công');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingWeight(null);
  };

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

  return (
    <Card 
      title="Quản lý Trọng số Đánh giá" 
      extra={
        <Space>
          <div style={{ fontWeight: 'bold', color: totalWeight === 100 ? '#52c41a' : '#ff4d4f' }}>
            Tổng trọng số: {totalWeight}%
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setEditingWeight(null);
            form.resetFields();
            setModalOpen(true);
          }}>
            Thêm tiêu chí
          </Button>
        </Space>
      }
    >
      <Table columns={columns} dataSource={weights} rowKey="id" />
      <Modal
        title={editingWeight ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí đánh giá'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tiêu chí đánh giá" rules={[{ required: true }]}>
            <Input placeholder="VD: Hiệu suất, Chất lượng..." />
          </Form.Item>
          <Form.Item name="weight" label="Trọng số (%)" rules={[{ required: true, type: 'number' }]}>
            <InputNumber min={0} max={100} placeholder="0-100" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết tiêu chí" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default WeightManagement;
