import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [dialogNotifications, setDialogNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tải thông báo khi user đăng nhập hoặc đổi role
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotificationsByRole(user.role);
      setNotifications(data);
      
      // Lấy thông báo chưa đọc để hiển thị trong dialog
      const unread = await notificationService.getUnreadNotifications(user.role);
      setDialogNotifications(unread);
    } catch (error) {
      console.error('Lỗi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Đánh dấu thông báo là đã đọc
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.updateNotification(notificationId, { status: 'read' });
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, status: 'read' } : n
      ));
      setDialogNotifications(dialogNotifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Lỗi cập nhật thông báo:', error);
    }
  };

  // Ẩn thông báo (thu gọn)
  const hideNotification = async (notificationId) => {
    setDialogNotifications(dialogNotifications.filter(n => n.id !== notificationId));
  };

  // Tạo thông báo mới (cho executive)
  const createNotification = async (notificationData) => {
    try {
      const newNotification = await notificationService.createNotification(notificationData);
      setNotifications([...notifications, newNotification]);
      return newNotification;
    } catch (error) {
      console.error('Lỗi tạo thông báo:', error);
      throw error;
    }
  };

  // Xóa thông báo
  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setDialogNotifications(dialogNotifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Lỗi xóa thông báo:', error);
      throw error;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        dialogNotifications,
        loading,
        loadNotifications,
        markAsRead,
        hideNotification,
        createNotification,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
