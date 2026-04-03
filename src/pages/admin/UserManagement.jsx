import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyena@company.com', role: 'Quản lý cấp cao', department: 'Ban Lãnh đạo' },
    { id: 2, name: 'Trần Thị B', email: 'tranb@company.com', role: 'Quản lý phòng ban', department: 'Kinh doanh' },
    { id: 3, name: 'Lê Văn C', email: 'levan@company.com', role: 'Nhân viên', department: 'Kỹ thuật' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Vai trò', dataIndex: 'role', key: 'role' },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
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

  const handleEdit = (user) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa người dùng này?',
      onOk() {
        setUsers(users.filter(u => u.id !== id));
        message.success('Xóa người dùng thành công');
      },
    });
  };

  const handleSubmit = (values) => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
      message.success('Cập nhật người dùng thành công');
    } else {
      setUsers([...users, { id: Date.now(), ...values }]);
      message.success('Thêm người dùng thành công');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingUser(null);
  };

  return (
    <Card title="Quản lý Người dùng" extra={
      <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingUser(null);
        form.resetFields();
        setModalOpen(true);
      }}>
        Thêm người dùng
      </Button>
    }>
      <Table columns={columns} dataSource={users} rowKey="id" />
      <Modal
        title={editingUser ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Nhập email" />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Input placeholder="Nhập vai trò" />
          </Form.Item>
          <Form.Item name="department" label="Phòng ban" rules={[{ required: true }]}>
            <Input placeholder="Nhập phòng ban" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
