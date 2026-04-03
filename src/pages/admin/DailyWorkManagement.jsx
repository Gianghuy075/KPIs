import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const DailyWorkManagement = () => {
  const [works, setWorks] = useState([
    { id: 1, date: '2024-04-01', task: 'Kiểm tra hệ thống', department: 'Kỹ thuật', assignee: 'Nguyễn Văn A', status: 'Hoàn thành' },
    { id: 2, date: '2024-04-02', task: 'Xử lý lỗi', department: 'Kỹ thuật', assignee: 'Trần Thị B', status: 'Đang thực hiện' },
    { id: 3, date: '2024-04-02', task: 'Cập nhật tài liệu', department: 'Kinh doanh', assignee: 'Lê Văn C', status: 'Chưa bắt đầu' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Ngày', dataIndex: 'date', key: 'date' },
    { title: 'Công việc', dataIndex: 'task', key: 'task' },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Người thực hiện', dataIndex: 'assignee', key: 'assignee' },
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
    <Card title="Quản lý Công việc Hàng ngày" extra={
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
        title={editingWork ? 'Chỉnh sửa công việc' : 'Thêm công việc hàng ngày'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="date" label="Ngày" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="task" label="Công việc" rules={[{ required: true }]}>
            <Input placeholder="Nhập công việc" />
          </Form.Item>
          <Form.Item name="department" label="Phòng ban" rules={[{ required: true }]}>
            <Input placeholder="Nhập phòng ban" />
          </Form.Item>
          <Form.Item name="assignee" label="Người thực hiện" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên người thực hiện" />
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

export default DailyWorkManagement;
