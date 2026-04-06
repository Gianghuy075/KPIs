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
  Tag,
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
import { branchService } from '../../services/branchService';
import { formatLog } from '../../utils/logFormatter';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const { user: currentUser } = useAuth();

  const roleOptions = useMemo(
    () => Object.values(ROLES).map((r) => ({ label: roleLabels[r], value: r })),
    [],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [userRes, branchRes, deptRes, profileRes] = await Promise.all([
        userService.getUsers(),
        branchService.getBranches(),
        departmentService.getDepartments(),
        apiClient.get('/user-profiles').then((r) => r.data).catch(() => []),
      ]);
      setUsers(userRes);
      setBranches(branchRes);
      setDepartments(deptRes);
      setProfiles(profileRes);
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

  const profilesMap = useMemo(() => {
    const map = {};
    profiles.forEach((p) => {
      const uid = p.user?._id || p.user;
      if (uid) map[uid] = p;
    });
    return map;
  }, [profiles]);

  const filteredUsers = useMemo(() => {
    // Quản lý cấp cao: không thấy/sửa/xóa senior_manager (kể cả mình), nhưng thấy các role thấp hơn.
    if (!currentUser) return users;
    const isAdmin = currentUser.role === ROLES.SENIOR_MANAGER;
    if (!isAdmin) return users;
    return users.filter((u) => u.role === ROLES.EMPLOYEE);
  }, [users, currentUser]);

  const managerOptions = useMemo(
    () =>
      users
        .filter((u) => u.role === ROLES.DEPARTMENT_MANAGER)
        .map((u) => ({ value: u._id, label: `${u.username} (${u.email})` })),
    [users],
  );

  const managersMap = useMemo(() => {
    const map = {};
    users
      .filter((u) => u.role === ROLES.DEPARTMENT_MANAGER)
      .forEach((u) => {
        map[u._id] = `${u.username}`;
      });
    return map;
  }, [users]);

  const columns = [
    { title: 'Username', dataIndex: 'username', key: 'username', width: 140 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { 
      title: 'Chi nhánh', 
      key: 'branch', 
      render: (_, record) => {
        const dept = departments.find(d => d._id === record.department?._id);
        if (!dept) return '—';
        const branch = branches.find(b => b._id === dept.branchId);
        return branch ? branch.name : '—';
      },
    },
    {
      title: 'Phòng ban',
      dataIndex: ['department', 'name'],
      key: 'department',
      render: (_, record) => record?.department?.name || record.departmentName || '—',
    },
    { title: 'Quản lý bởi', key: 'managedBy', render: (_, r) => managersMap[r.managedBy] || '—' },
    {
      title: 'Họ tên',
      key: 'fullName',
      render: (_, record) => profilesMap[record._id]?.fullName || '—',
    },
    {
      title: 'Mã NV',
      key: 'employeeCode',
      width: 100,
      render: (_, record) => profilesMap[record._id]?.employeeCode || '—',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_, record) => {
        const status = profilesMap[record._id]?.status;
        if (!status) return '—';
        const color =
          status === 'active' ? 'green' : status === 'on_leave' ? 'orange' : 'red';
        const label =
          status === 'active'
            ? 'Đang làm'
            : status === 'on_leave'
            ? 'Nghỉ phép'
            : 'Nghỉ';
        return <Tag color={color}>{label}</Tag>;
      },
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
    const dept = departments.find(d => d._id === user?.department?._id);
    const branchId = dept?.branchId;
    form.setFieldsValue({
      branchId: branchId || undefined,
      username: user.username,
      email: user.email,
      departmentId: user?.department?._id,
      managedBy: user?.managedBy || null,
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
    if (record.role === ROLES.SENIOR_MANAGER && id !== currentUser?.id) {
      message.warning('Không được xóa tài khoản quản lý cấp cao khác');
      return;
    }

    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa người dùng này?',
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
      role: ROLES.EMPLOYEE,
      password: values.password || undefined,
      departmentId: values.departmentId,
      departmentName: undefined,
      managedBy: values.managedBy || undefined,
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

      message.success(editingUser ? 'Cập nhật người dùng thành công' : 'Thêm người dùng thành công');
      setModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      loadData();
    } catch (err) {
      message.error(err.message || 'Lưu người dùng thất bại');
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
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            Thêm nhân viên
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={filteredUsers}
        rowKey={r => r._id || r.id}
        loading={loading}
      />
      <Modal
        title={editingUser ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
            <Form.Item
              name="password"
              label="Mật khẩu (để trống nếu giữ nguyên)"
              rules={[{ required: false }]}
            >
              <Input.Password placeholder="Để trống nếu không đổi" />
            </Form.Item>
          )}
          <Divider />
          <Form.Item
            name="branchId"
            label="Chi nhánh"
            rules={[{ required: true, message: 'Chọn chi nhánh' }]}
          >
            <Select
              allowClear
              placeholder="Chọn chi nhánh"
              options={branches.map(b => ({ label: b.name, value: b._id }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="departmentId"
            label="Phòng ban"
            rules={[{ required: true, message: 'Chọn phòng ban' }]}
          >
            <Select
              allowClear
              placeholder="Chọn phòng ban sẵn có"
              options={departments
                .filter(d => {
                  const branchId = form.getFieldValue('branchId');
                  return !branchId || d.branchId === branchId;
                })
                .map(d => ({ label: d.name, value: d._id }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="managedBy"
            label="Quản lý bởi (Trưởng phòng)"
            rules={[{ required: true, message: 'Chọn người quản lý' }]}
          >
            <Select
              placeholder="Chọn trưởng phòng"
              options={managerOptions}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Divider>Thông tin hồ sơ</Divider>
          <Form.Item name="fullName" label="Họ tên đầy đủ">
            <Input placeholder="VD: Nguyễn Văn A" />
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

export default UserManagement;
