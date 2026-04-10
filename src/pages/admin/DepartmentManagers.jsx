import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Card,
  message,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { roleLabels, ROLES } from '../../constants/roles';
import { userService } from '../../services/userService';
import { apiClient } from '../../services/apiClient';
import { formatLog } from '../../utils/logFormatter';

const DepartmentManagers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, profileRes] = await Promise.all([
        userService.getUsers(),
        apiClient.get('/user-profiles').then((r) => r.data).catch(() => []),
      ]);
      setAllUsers(userRes);
      setUsers(userRes.filter((u) => u.role === ROLES.BRANCH_MANAGER));
      setProfiles(profileRes);
    } catch (err) {
      console.error(formatLog('Load managers failed', err.message));
      message.error('Tải dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const profilesMap = useMemo(() => {
    const map = {};
    profiles.forEach((p) => {
      const uid = p.user?._id || p.user;
      if (uid) map[uid] = p;
    });
    return map;
  }, [profiles]);

  const managedCounts = useMemo(() => {
    const counts = {};
    allUsers.forEach((u) => {
      if (u.role !== ROLES.EMPLOYEE || !u.managedBy) return;
      const mId =
        typeof u.managedBy === 'object'
          ? u.managedBy._id || u.managedBy.id || u.managedBy
          : u.managedBy;
      counts[mId] = (counts[mId] || 0) + 1;
    });
    return counts;
  }, [allUsers]);

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username', width: 140 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Họ tên', key: 'fullName', render:(_,r)=> profilesMap[r._id]?.fullName || '—' },
    { title: 'Điện thoại', key: 'phone', render:(_,r)=> profilesMap[r._id]?.phone || '—' },
    {
      title: 'Số nhân viên quản lý',
      key: 'managedCount',
      render: (_, record) => managedCounts[record._id] ?? 0,
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const handleEdit = (user) => {
    setEditingUser(user);
    const profile = profilesMap[user._id] || {};
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      fullName: profile.fullName,
      title: profile.title,
      phone: profile.phone,
      address: profile.address,
      gender: profile.gender,
      status: profile.status,
      avatarUrl: profile.avatarUrl,
      dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
      startDate: profile.startDate ? dayjs(profile.startDate) : null,
    });
    setModalOpen(true);
  };

  const handleDelete = (record) => {
    const id = record._id || record.id;
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa quản lý phân xưởng này?',
      onOk() {
        userService
          .deleteUser(id)
          .then(async () => {
            const profile = profilesMap[id];
            if (profile?._id) {
              await apiClient.delete(`/user-profiles/${profile._id}`).catch(() => {});
            }
            setUsers(users.filter((u) => u._id !== id && u.id !== id));
            setProfiles(profiles.filter((p) => p.user !== id));
            message.success('Xóa thành công');
          })
          .catch(() => message.error('Xóa thất bại'));
      },
    });
  };

  const handleSubmit = async (values) => {
    const payload = {
      username: values.username,
      email: values.email,
      role: ROLES.BRANCH_MANAGER,
      password: values.password || undefined,
      managedBy: undefined, // set server side to current admin
    };

    try {
      let userResult;
      if (editingUser) {
        userResult = await userService.updateUser(editingUser._id || editingUser.id, payload);
        setUsers(users.map((u) => (u._id === userResult._id ? userResult : u)));
      } else {
        if (!payload.password) {
          message.warning('Vui lòng nhập mật khẩu cho người dùng mới');
          return;
        }
        userResult = await userService.createUser(payload);
        setUsers([...users, userResult]);
      }

      message.success(editingUser ? 'Cập nhật thành công' : 'Thêm quản lý phân xưởng thành công');
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      loadData();
    } catch (err) {
      message.error(err.message || 'Lưu thất bại');
    }
  };

  return (
    <Card
      title="Quản lý Trưởng phân xưởng"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            Thêm trưởng phân xưởng
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={users}
        rowKey={(r) => r._id || r.id}
        loading={loading}
      />

      <Modal
        title={editingUser ? 'Chỉnh sửa trưởng phân xưởng' : 'Thêm trưởng phân xưởng'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={720}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Nhập username" disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Nhập email" />
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
          {/* Không cần phòng ban cho tài khoản Phân xưởng */}
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentManagers;
