import React from 'react';
import { Modal, List, Button, Space, Empty, Tag } from 'antd';
import {
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNotification } from '../../contexts/NotificationContext';

const NotificationDialog = ({ visible, onClose }) => {
  const { dialogNotifications, markAsRead, hideNotification } = useNotification();

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

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleClose = (notificationId) => {
    hideNotification(notificationId);
  };

  return (
    <Modal
      title={`Thông báo từ Ban lãnh đạo (${dialogNotifications.length})`}
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="ok" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
    >
      {dialogNotifications.length === 0 ? (
        <Empty description="Không có thông báo nào" />
      ) : (
        <List
          dataSource={dialogNotifications}
          renderItem={(notification) => (
            <List.Item
              style={{
                padding: '16px',
                border: '1px solid #f0f0f0',
                borderRadius: '4px',
                marginBottom: '12px',
              }}
              actions={[
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  Đã xem
                </Button>,
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleClose(notification.id)}
                >
                  Ẩn
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <strong>{notification.title}</strong>
                    <Tag color={getRecipientColor(notification.recipients)}>
                      {getRecipientLabel(notification.recipients)}
                    </Tag>
                  </Space>
                }
                description={
                  <div className="space-y-2">
                    <p>{notification.content}</p>
                    <div className="text-gray-500 text-sm">
                      Từ: <strong>{notification.createdBy}</strong> • Ngày:{' '}
                      <strong>{new Date(notification.createdAt).toLocaleDateString('vi-VN')}</strong>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

export default NotificationDialog;
