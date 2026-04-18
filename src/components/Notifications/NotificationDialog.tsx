import React from 'react';
import { Modal, List, Button, Space, Empty, Tag } from 'antd';
import {
  CloseOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useNotification } from '../../contexts/NotificationContext';
import {
  getRecipientColor,
  getRecipientLabel,
} from '../../features/notification/notification-management/helpers';

const NotificationDialog = ({ visible, onClose }) => {
  const { dialogNotifications, markAsRead, hideDialogNotification } = useNotification();

  const getDialogRecipientLabel = (recipients) => {
    const label = getRecipientLabel(recipients);
    if (label === 'Quản lý + Nhân viên') return 'Cho tất cả';
    if (label === 'Quản lý Phân xưởng') return 'Cho Quản lý phân xưởng';
    return 'Cho Nhân viên';
  };

  const handleMarkAsRead = (notificationId) => {
    markAsRead(notificationId);
  };

  const handleClose = (notificationId) => {
    hideDialogNotification(notificationId);
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
                  key="read"
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  Đã xem
                </Button>,
                <Button
                  key="hide"
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
                      {getDialogRecipientLabel(notification.recipients)}
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
