import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { notificationService } from '../../../services/notificationService';

export const useNotificationManagement = ({ createNotification, deleteNotification }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch {
      message.error('Không thể tải danh sách thông báo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleAddNotification = () => {
    setEditingNotification(null);
    setModalOpen(true);
  };

  const handleEditNotification = (notification) => {
    setEditingNotification(notification);
    setModalOpen(true);
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
      message.success('Xóa thông báo thành công');
      await loadNotifications();
    } catch {
      message.error('Không thể xóa thông báo');
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
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
      setEditingNotification(null);
      await loadNotifications();
      return true;
    } catch {
      message.error('Không thể lưu thông báo');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    notifications,
    loading,
    submitting,
    modalOpen,
    setModalOpen,
    editingNotification,
    setEditingNotification,
    handleAddNotification,
    handleEditNotification,
    handleDeleteNotification,
    handleSubmit,
  };
};
