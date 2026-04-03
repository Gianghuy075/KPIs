import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Ban Lãnh đạo', manager: 'Nguyễn Văn A', employees: 5 },
    { id: 2, name: 'Kinh doanh', manager: 'Trần Thị B', employees: 12 },
    { id: 3, name: 'Kỹ thuật', manager: 'Lê Văn C', employees: 18 },
    { id: 4, name: 'Nhân sự', manager: 'Phạm Thị D', employees: 8 },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên phòng ban', dataIndex: 'name', key: 'name' },
    { title: 'Quản lý', dataIndex: 'manager', key: 'manager' },
    { title: 'Số nhân viên', dataIndex: 'employees', key: 'employees' },
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

  const handleEdit = (dept) => {
    setEditingDept(dept);
    form.setFieldsValue(dept);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa phòng ban này?',
      onOk() {
        setDepartments(departments.filter(d => d.id !== id));
        message.success('Xóa phòng ban thành công');
      },
    });
  };

  const handleSubmit = (values) => {
    if (editingDept) {
      setDepartments(departments.map(d => d.id === editingDept.id ? { ...d, ...values } : d));
      message.success('Cập nhật phòng ban thành công');
    } else {
      setDepartments([...departments, { id: Date.now(), ...values }]);
      message.success('Thêm phòng ban thành công');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingDept(null);
  };

  return (
    <Card title="Quản lý Phòng ban" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingDept(null);
        form.resetFields();
        setModalOpen(true);
      }}>
        Thêm phòng ban
      </Button>
    }>
      <Table columns={columns} dataSource={departments} rowKey="id" />
      <Modal
        title={editingDept ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tên phòng ban" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên phòng ban" />
          </Form.Item>
          <Form.Item name="manager" label="Quản lý" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên quản lý" />
          </Form.Item>
          <Form.Item name="employees" label="Số nhân viên" rules={[{ required: true, type: 'number' }]}>
            <Input type="number" placeholder="Nhập số nhân viên" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentManagement;
