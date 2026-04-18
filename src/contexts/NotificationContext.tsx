/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [dialogNotifications, setDialogNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await notificationService.getNotificationsByRole(user.role);
      setNotifications(data);

      const unread = await notificationService.getUnreadNotifications(user.role);
      setDialogNotifications(unread);
    } catch (error) {
      console.error('Lỗi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.updateNotification(notificationId, { status: 'read' });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, status: 'read' } : notification,
        ),
      );
      setDialogNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    } catch (error) {
      console.error('Lỗi cập nhật thông báo:', error);
    }
  };

  const hideDialogNotification = (notificationId) => {
    setDialogNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
  };

  const hideNotification = (notificationId) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, status: 'hidden' } : notification,
      ),
    );
  };

  const createNotification = async (notificationData) => {
    try {
      const newNotification = await notificationService.createNotification(notificationData);
      setNotifications((prev) => [...prev, newNotification]);
      return newNotification;
    } catch (error) {
      console.error('Lỗi tạo thông báo:', error);
      throw error;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
      setDialogNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
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
        hideDialogNotification,
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
