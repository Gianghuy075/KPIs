import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const QuarterlyWorkManagement = () => {
  const [works, setWorks] = useState([
    { id: 1, quarter: 'Q1', task: 'Lập kế hoạch chiến lược', department: 'Ban Lãnh đạo', status: 'Hoàn thành' },
    { id: 2, quarter: 'Q1', task: 'Phát triển sản phẩm mới', department: 'Kỹ thuật', status: 'Đang thực hiện' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Quý', dataIndex: 'quarter', key: 'quarter' },
    { title: 'Công việc', dataIndex: 'task', key: 'task' },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
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

  const handleEdit = (work) => {
    setEditingWork(work);
    form.setFieldsValue(work);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      onOk() {
        setWorks(works.filter(w => w.id !== id));
        message.success('Xóa công việc thành công');
      },
    });
  };

  const handleSubmit = (values) => {
    if (editingWork) {
      setWorks(works.map(w => w.id === editingWork.id ? { ...w, ...values } : w));
      message.success('Cập nhật công việc thành công');
    } else {
      setWorks([...works, { id: Date.now(), ...values }]);
      message.success('Thêm công việc thành công');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingWork(null);
  };

  return (
    <Card title="Quản lý Công việc Hàng quý" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingWork(null);
        form.resetFields();
        setModalOpen(true);
      }}>
        Thêm công việc
      </Button>
    }>
      <Table columns={columns} dataSource={works} rowKey="id" />
      <Modal
        title={editingWork ? 'Chỉnh sửa công việc' : 'Thêm công việc hàng quý'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="quarter" label="Quý" rules={[{ required: true }]}>
            <Select placeholder="Chọn quý">
              <Select.Option value="Q1">Q1</Select.Option>
              <Select.Option value="Q2">Q2</Select.Option>
              <Select.Option value="Q3">Q3</Select.Option>
              <Select.Option value="Q4">Q4</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="task" label="Công việc" rules={[{ required: true }]}>
            <Input placeholder="Nhập công việc" />
          </Form.Item>
          <Form.Item name="department" label="Phòng ban" rules={[{ required: true }]}>
            <Input placeholder="Nhập phòng ban" />
          </Form.Item>
          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="Chưa bắt đầu">Chưa bắt đầu</Select.Option>
              <Select.Option value="Đang thực hiện">Đang thực hiện</Select.Option>
              <Select.Option value="Hoàn thành">Hoàn thành</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default QuarterlyWorkManagement;
