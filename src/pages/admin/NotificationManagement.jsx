import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Empty,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { notificationService } from '../../services/notificationService';
import { useNotification } from '../../contexts/NotificationContext';

const { Option } = Select;

const NotificationManagement = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [form] = Form.useForm();
  const { createNotification, deleteNotification } = useNotification();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      message.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNotification = () => {
    setEditingNotification(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEditNotification = (notification) => {
    setEditingNotification(notification);
    form.setFieldsValue(notification);
    setModalOpen(true);
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      message.success('Xóa thông báo thành công');
      await loadNotifications();
    } catch (error) {
      message.error('Không thể xóa thông báo');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingNotification) {
        await notificationService.updateNotification(editingNotification.id, values);
        message.success('Cập nhật thông báo thành công');
      } else {
        await createNotification({
          ...values,
          createdBy: 'Quản lý cấp cao',
        });
        message.success('Tạo thông báo thành công');
      }
      setModalOpen(false);
      form.resetFields();
      await loadNotifications();
    } catch (error) {
      message.error('Không thể lưu thông báo');
    }
  };

  const getRecipientLabel = (recipients) => {
    if (recipients.includes('manager') && recipients.includes('employee')) {
      return 'Quản lý + Nhân viên';
    }
    if (recipients.includes('manager')) {
      return 'Quản lý';
    }
    return 'Nhân viên';
  };

  const getRecipientColor = (recipients) => {
    if (recipients.includes('manager') && recipients.includes('employee')) {
      return 'blue';
    }
    if (recipients.includes('manager')) {
      return 'green';
    }
    return 'orange';
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'green', label: 'Đang hoạt động' },
      inactive: { color: 'red', label: 'Không hoạt động' },
      read: { color: 'gray', label: 'Đã đọc' },
    };
    return statusMap[status] || { color: 'default', label: status };
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text) => (
        <span title={text}>{text.substring(0, 50)}...</span>
      ),
    },
    {
      title: 'Gửi cho',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (recipients) => (
        <Tag color={getRecipientColor(recipients)}>
          {getRecipientLabel(recipients)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const tagInfo = getStatusTag(status);
        return <Tag color={tagInfo.color}>{tagInfo.label}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditNotification(record)}
          />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa thông báo này?"
            onConfirm={() => handleDeleteNotification(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <Card>
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý Thông báo</h1>
          <p className="text-gray-600">
            Tạo và quản lý thông báo gửi đến Quản lý phòng ban và Nhân viên
          </p>
        </div>
      </Card>

      <Card
        title="Danh sách Thông báo"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNotification}
          >
            Thêm Thông báo
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={notifications}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal thêm/sửa thông báo */}
      <Modal
        title={editingNotification ? 'Chỉnh sửa Thông báo' : 'Tạo Thông báo Mới'}
        open={modalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setEditingNotification(null);
        }}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề thông báo" />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
          >
            <Input.TextArea
              placeholder="Nhập nội dung thông báo"
              rows={4}
            />
          </Form.Item>

          <Form.Item
            name="recipients"
            label="Gửi cho"
            rules={[{ required: true, message: 'Vui lòng chọn đối tượng nhận thông báo' }]}
          >
            <Select
              mode="multiple"
              placeholder="Chọn đối tượng"
            >
              <Option value="manager">Quản lý Phòng ban</Option>
              <Option value="employee">Nhân viên</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            initialValue="active"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="active">Đang hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationManagement;
