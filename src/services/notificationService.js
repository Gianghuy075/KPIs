// Service quản lý thông báo
let notificationsData = [
  {
    id: 1,
    title: 'Thông báo OKR Q1',
    content: 'Vui lòng cập nhật OKR cho phòng ban theo phiếu đính kèm. Hạn chót là 15/04/2026.',
    createdBy: 'CEO',
    createdAt: '2026-04-01T10:00:00Z',
    recipients: ['manager', 'employee'], // 'manager', 'employee', hoặc cả hai
    status: 'active',
  },
];

let nextNotificationId = 2;

export const notificationService = {
  // Lấy thông báo theo role
  getNotificationsByRole: async (role) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = notificationsData.filter(notif => {
          // Thông báo cho manager
          if (role === 'manager') return notif.recipients.includes('manager');
          // Thông báo cho employee
          if (role === 'employee') return notif.recipients.includes('employee');
          // Executive xem được tất cả
          if (role === 'executive') return true;
          return false;
        });
        resolve(filtered);
      }, 100);
    });
  },

  // Lấy tất cả thông báo
  getAllNotifications: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(notificationsData);
      }, 100);
    });
  },

  // Tạo thông báo mới (chỉ cho executive)
  createNotification: async (notificationData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const newNotification = {
          ...notificationData,
          id: nextNotificationId++,
          createdAt: new Date().toISOString(),
          status: 'active',
        };
        notificationsData.push(newNotification);
        resolve(newNotification);
      }, 100);
    });
  },

  // Cập nhật thông báo
  updateNotification: async (id, updates) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = notificationsData.findIndex(n => n.id === id);
        if (index !== -1) {
          notificationsData[index] = { ...notificationsData[index], ...updates };
          resolve(notificationsData[index]);
        } else {
          reject(new Error('Notification not found'));
        }
      }, 100);
    });
  },

  // Xóa thông báo
  deleteNotification: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        notificationsData = notificationsData.filter(n => n.id !== id);
        resolve();
      }, 100);
    });
  },

  // Lấy thông báo chưa đọc
  getUnreadNotifications: async (role) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filtered = notificationsData.filter(notif => {
          const isForRole = role === 'manager' 
            ? notif.recipients.includes('manager')
            : role === 'employee'
            ? notif.recipients.includes('employee')
            : true;
          
          return isForRole && notif.status === 'active';
        });
        resolve(filtered);
      }, 100);
    });
  },
};
