import React, { useEffect, useMemo, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message, Select, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { roleLabels, ROLES } from '../../constants/roles';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { formatLog } from '../../utils/logFormatter';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const roleOptions = useMemo(
    () => Object.values(ROLES).map((r) => ({ label: roleLabels[r], value: r })),
    [],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, deptRes] = await Promise.all([
        userService.getUsers(),
        departmentService.getDepartments(),
      ]);
      setUsers(userRes);
      setDepartments(deptRes);
    } catch (err) {
      console.error(formatLog('Load users/departments failed', err.message));
      message.error('Tải dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role) => roleLabels[role] || role,
    },
    {
      title: 'Phòng ban',
      dataIndex: ['department', 'name'],
      key: 'department',
      render: (_, record) => record?.department?.name || record.departmentName || '—',
    },
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
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      departmentId: user?.department?._id,
      departmentName: '',
    });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa người dùng này?',
      onOk() {
        userService
          .deleteUser(id)
          .then(() => {
            setUsers(users.filter((u) => u._id !== id && u.id !== id));
            message.success('Xóa người dùng thành công');
          })
          .catch(() => message.error('Xóa người dùng thất bại'));
      },
    });
  };

  const handleSubmit = async (values) => {
    const payload = {
      username: values.username,
      email: values.email,
      role: values.role,
      password: values.password || undefined,
      departmentId: values.departmentId || undefined,
      departmentName: values.departmentName?.trim() || undefined,
    };

    try {
      if (editingUser) {
        const updated = await userService.updateUser(editingUser._id || editingUser.id, payload);
        setUsers(users.map((u) => (u._id === updated._id ? updated : u)));
        message.success('Cập nhật người dùng thành công');
      } else {
        if (!payload.password) {
          message.warning('Vui lòng nhập mật khẩu cho người dùng mới');
          return;
        }
        const created = await userService.createUser(payload);
        setUsers([...users, created]);
        message.success('Thêm người dùng thành công');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      // reload departments list if new created
      loadData();
    } catch (err) {
      message.error(err.message || 'Lưu người dùng thất bại');
    }
  };

  return (
    <Card title="Quản lý Người dùng" extra={
      <Space>
        <Button icon={<ReloadOutlined />} onClick={loadData} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingUser(null);
        form.resetFields();
        setModalOpen(true);
      }}>
          Thêm người dùng
        </Button>
      </Space>
    }>
      <Table columns={columns} dataSource={users} rowKey={(r) => r._id || r.id} loading={loading} />
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
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Nhập username" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Nhập email" />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select options={roleOptions} placeholder="Chọn vai trò" />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}
          {editingUser && (
            <Form.Item name="password" label="Mật khẩu (để trống nếu giữ nguyên)" rules={[{ required: false }]}>
              <Input.Password placeholder="Để trống nếu không đổi" />
            </Form.Item>
          )}
          <Divider />
          <Form.Item label="Phòng ban (chọn hoặc nhập mới)">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item name="departmentId" noStyle>
                <Select
                  allowClear
                  placeholder="Chọn phòng ban sẵn có"
                  options={departments.map((d) => ({ label: d.name, value: d._id }))}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
              <Form.Item name="departmentName" noStyle>
                <Input placeholder="Hoặc nhập tên phòng ban mới" />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
