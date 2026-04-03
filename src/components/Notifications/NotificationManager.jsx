import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import NotificationDialog from './NotificationDialog';

const NotificationManager = () => {
  const { user } = useAuth();
  const { dialogNotifications } = useNotification();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  // Chỉ hiển thị khi user đã đăng nhập
  if (!user) {
    return null;
  }

  // Hiển thị dialog khi người dùng đăng nhập và có thông báo mới
  useEffect(() => {
    if (user && dialogNotifications.length > 0 && !hasShown) {
      // Chỉ hiển thị dialog một lần khi đăng nhập
      setDialogVisible(true);
      setHasShown(true);
    }
  }, [user, dialogNotifications, hasShown]);

  // Reset khi user thay đổi
  useEffect(() => {
    if (user) {
      setHasShown(false);
    }
  }, [user?.id]);

  return (
    <NotificationDialog
      visible={dialogVisible}
      onClose={() => setDialogVisible(false)}
    />
  );
};

export default NotificationManager;
