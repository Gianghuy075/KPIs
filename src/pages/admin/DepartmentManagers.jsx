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
  Select,
  Divider,
  DatePicker,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { roleLabels, ROLES } from '../../constants/roles';
import { userService } from '../../services/userService';
import { departmentService } from '../../services/departmentService';
import { apiClient } from '../../services/apiClient';
import { formatLog } from '../../utils/logFormatter';

const DepartmentManagers = () => {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, deptRes, profileRes] = await Promise.all([
        userService.getUsers(),
        departmentService.getDepartments(),
        apiClient.get('/user-profiles').then((r) => r.data).catch(() => []),
      ]);
      setUsers(userRes.filter((u) => u.role === ROLES.DEPARTMENT_MANAGER));
      setDepartments(deptRes);
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

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username', width: 140 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: 'Phòng ban', dataIndex: ['department', 'name'], key: 'department', render:(_, r)=> r?.department?.name || '—' },
    { title: 'Họ tên', key: 'fullName', render:(_,r)=> profilesMap[r._id]?.fullName || '—' },
    { title: 'Điện thoại', key: 'phone', render:(_,r)=> profilesMap[r._id]?.phone || '—' },
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
      departmentId: user?.department?._id,
      departmentName: '',
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
      content: 'Bạn có chắc chắn muốn xóa quản lý phòng ban này?',
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
      role: ROLES.DEPARTMENT_MANAGER,
      password: values.password || undefined,
      departmentId: values.departmentId || undefined,
      departmentName: values.departmentName?.trim() || undefined,
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

      const profilePayload = {
        user: userResult._id,
        fullName: values.fullName || userResult.username,
        title: values.title,
        phone: values.phone,
        address: values.address,
        gender: values.gender,
        status: values.status,
        avatarUrl: values.avatarUrl,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
        startDate: values.startDate ? values.startDate.toISOString() : undefined,
      };

      const existingProfile = profilesMap[userResult._id];
      if (existingProfile?._id) {
        const updatedProfile = await apiClient
          .patch(`/user-profiles/${existingProfile._id}`, profilePayload)
          .then((r) => r.data);
        setProfiles(
          profiles.map((p) => (p._id === updatedProfile._id ? updatedProfile : p)),
        );
      } else {
        const createdProfile = await apiClient
          .post('/user-profiles', profilePayload)
          .then((r) => r.data);
        setProfiles([...profiles, createdProfile]);
      }

      message.success(editingUser ? 'Cập nhật thành công' : 'Thêm quản lý phòng ban thành công');
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
      title="Quản lý Trưởng phòng"
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
            Thêm trưởng phòng
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
        title={editingUser ? 'Chỉnh sửa trưởng phòng' : 'Thêm trưởng phòng'}
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
            <Input placeholder="Nhập username" />
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

          <Divider>Thông tin hồ sơ</Divider>
          <Form.Item name="fullName" label="Họ tên đầy đủ">
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="title" label="Chức danh">
            <Input placeholder="VD: Trưởng phòng" />
          </Form.Item>
          <Form.Item name="phone" label="Điện thoại">
            <Input placeholder="VD: 0901234567" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input placeholder="Nhập địa chỉ" />
          </Form.Item>
          <Form.Item name="avatarUrl" label="Ảnh đại diện (URL)">
            <Input placeholder="https://..." />
          </Form.Item>
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="gender" label="Giới tính" style={{ flex: 1 }}>
              <Select
                allowClear
                options={[
                  { value: 'male', label: 'Nam' },
                  { value: 'female', label: 'Nữ' },
                  { value: 'other', label: 'Khác' },
                ]}
              />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái" style={{ flex: 1 }}>
              <Select
                allowClear
                options={[
                  { value: 'active', label: 'Đang làm' },
                  { value: 'on_leave', label: 'Nghỉ phép' },
                  { value: 'inactive', label: 'Nghỉ' },
                ]}
              />
            </Form.Item>
          </Space>
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="dateOfBirth" label="Ngày sinh" style={{ flex: 1 }}>
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="startDate" label="Ngày vào làm" style={{ flex: 1 }}>
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentManagers;
