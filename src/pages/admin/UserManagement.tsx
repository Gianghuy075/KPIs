import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, Card, message,
  Select, Tag, Switch,
} from 'antd';
import { PlusOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { ROLES, roleLabels } from '../../constants/roles';
import { userService } from '../../services/userService';
import workshopKpiService from '../../services/workshopKpiService';
import { useAuth } from '../../contexts/AuthContext';

const roleTagColor = {
  [ROLES.SYSTEM_ADMIN]: 'red',
  [ROLES.WORKSHOP_MANAGER]: 'blue',
  [ROLES.EMPLOYEE]: 'green',
};

const roleOptions = Object.values(ROLES).map(r => ({ label: roleLabels[r], value: r }));

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const workshopMap = useMemo(() => {
    const map = {};
    workshops.forEach(w => { map[w.id] = w.name; });
    return map;
  }, [workshops]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, wsRes] = await Promise.all([
        userService.getUsers(),
        workshopKpiService.listWorkshops(),
      ]);
      setUsers(userRes);
      setWorkshops(wsRes);
    } catch {
      message.error('Tải dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const displayedUsers = useMemo(() =>
    users.filter(u => u.id !== currentUser?.id),
  [users, currentUser]);

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username', width: 140 },
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    {
      title: 'Vai trò', dataIndex: 'role', key: 'role', width: 160,
      render: role => <Tag color={roleTagColor[role] || 'default'}>{roleLabels[role] || role}</Tag>,
    },
    {
      title: 'Phân xưởng', key: 'phanXuong', width: 160,
      render: (_, r) => workshopMap[r.phanXuongId] || '—',
    },
    {
      title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', width: 110, align: 'center',
      render: active => <Tag color={active ? 'green' : 'red'}>{active ? 'Đang làm' : 'Vô hiệu'}</Tag>,
    },
    {
      title: 'Hành động', key: 'action', width: 130,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Switch
            size="small"
            checked={record.isActive}
            checkedChildren="ON"
            unCheckedChildren="OFF"
            onChange={active => handleToggleActive(record, active)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (u) => {
    setEditingUser(u);
    form.setFieldsValue({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      phanXuongId: u.phanXuongId,
    });
    setModalOpen(true);
  };

  const handleToggleActive = async (record, active) => {
    try {
      if (active) {
        const updated = await userService.activateUser(record.id);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      } else {
        const updated = await userService.deactivateUser(record.id);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      }
      message.success(active ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
    } catch {
      message.error('Thao tác thất bại');
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = {
          fullName: values.fullName,
          role: values.role,
          phanXuongId: values.phanXuongId || null,
        };
        const updated = await userService.updateUser(editingUser.id, payload);
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
        message.success('Cập nhật thành công');
      } else {
        if (!values.password) {
          message.warning('Vui lòng nhập mật khẩu');
          return;
        }
        const created = await userService.createUser({
          username: values.username,
          password: values.password,
          fullName: values.fullName,
          role: values.role,
          phanXuongId: values.phanXuongId || undefined,
        });
        setUsers(prev => [...prev, created]);
        message.success('Thêm nhân viên thành công');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
    } catch (err) {
      message.error(err.message || 'Lưu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Quản lý Nhân viên"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingUser(null); form.resetFields(); setModalOpen(true); }}
          >
            Thêm nhân viên
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={displayedUsers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 15 }}
      />
      <Modal
        title={editingUser ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
        open={modalOpen}
        onCancel={() => {
          if (!submitting) {
            setModalOpen(false);
            form.resetFields();
            setEditingUser(null);
          }
        }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okButtonProps={{ disabled: submitting }}
        cancelButtonProps={{ disabled: submitting }}
        maskClosable={!submitting}
        keyboard={!submitting}
        destroyOnHide
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="username" label="Username" rules={[{ required: !editingUser }]}>
            <Input disabled={!!editingUser} placeholder="Nhập username" />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}
          <Form.Item name="fullName" label="Họ tên đầy đủ" rules={[{ required: true }]}>
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select options={roleOptions} placeholder="Chọn vai trò" />
          </Form.Item>
          <Form.Item name="phanXuongId" label="Phân xưởng">
            <Select
              allowClear
              placeholder="Chọn phân xưởng (nếu có)"
              options={workshops.map(w => ({ label: w.name, value: w.id }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserManagement;
