import React from 'react';
import { Alert, Button, Space, Tag, Collapse, Empty, Row, Col } from 'antd';
import {
  BellOutlined,
  CloseOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNotification } from '../../contexts/NotificationContext';

const NotificationBar = () => {
  const { notifications, hideNotification, markAsRead } = useNotification();

  // Lấy thông báo chưa đọc và chưa ẩn
  const unreadNotifications = notifications.filter(n => n.status !== 'read' && n.status !== 'hidden');

  if (unreadNotifications.length === 0) {
    return null;
  }

  const getRecipientLabel = (recipients) => {
    if (recipients.includes('manager') && recipients.includes('employee')) {
      return 'Cho tất cả';
    }
    if (recipients.includes('manager')) {
      return 'Cho Quản lý';
    }
    return 'Cho Nhân viên';
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

  const items = unreadNotifications.map((notification) => ({
    key: notification.id,
    label: (
      <Space>
        <BellOutlined style={{ color: '#1890ff' }} />
        <strong>{notification.title}</strong>
        <Tag color={getRecipientColor(notification.recipients)} style={{ marginLeft: 8 }}>
          {getRecipientLabel(notification.recipients)}
        </Tag>
      </Space>
    ),
    children: (
      <div className="space-y-3">
        <p>{notification.content}</p>
        <div className="text-gray-600 text-sm mb-3">
          Từ: <strong>{notification.createdBy}</strong> • Ngày:{' '}
          <strong>{new Date(notification.createdAt).toLocaleDateString('vi-VN')}</strong>
        </div>
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => markAsRead(notification.id)}
          >
            Đánh dấu đã xem
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => hideNotification(notification.id)}
          >
            Ẩn
          </Button>
        </Space>
      </div>
    ),
  }));

  return (
    <div className="mb-4">
      <Alert
        message={
          <Space>
            <BellOutlined style={{ fontSize: 18 }} />
            <span>
              <strong>Bạn có {unreadNotifications.length} thông báo mới</strong>
            </span>
          </Space>
        }
        type="info"
        showIcon={false}
        style={{ marginBottom: 16 }}
      />
      <Collapse items={items} accordion />
    </div>
  );
};

export default NotificationBar;
