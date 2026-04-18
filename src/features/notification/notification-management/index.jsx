import { useEffect } from 'react';
import { Card, Form } from 'antd';
import { useNotification } from '../../../contexts/NotificationContext';
import { NotificationFormModal, NotificationTableCard } from './components';
import { useNotificationManagement } from './useNotificationManagement';

const NotificationManagementFeature = () => {
  const [form] = Form.useForm();
  const { createNotification, deleteNotification } = useNotification();

  const {
    notifications,
    loading,
    modalOpen,
    setModalOpen,
    editingNotification,
    setEditingNotification,
    handleAddNotification,
    handleEditNotification,
    handleDeleteNotification,
    handleSubmit,
  } = useNotificationManagement({ createNotification, deleteNotification });

  useEffect(() => {
    if (editingNotification) {
      form.setFieldsValue(editingNotification);
      return;
    }
    form.resetFields();
  }, [editingNotification, form, modalOpen]);

  const onCancelModal = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingNotification(null);
  };

  const onSubmitModal = async (values) => {
    const success = await handleSubmit(values);
    if (success) {
      form.resetFields();
    }
  };

  return (
    <div className="p-4 space-y-6">
      <Card>
        <div>
          <h1 className="text-2xl font-bold mb-2">Quản lý Thông báo</h1>
          <p className="text-gray-600">Tạo và quản lý thông báo gửi đến Quản lý phòng ban và Nhân viên</p>
        </div>
      </Card>

      <NotificationTableCard
        notifications={notifications}
        loading={loading}
        onAdd={handleAddNotification}
        onEdit={handleEditNotification}
        onDelete={handleDeleteNotification}
      />

      <NotificationFormModal
        open={modalOpen}
        editingNotification={editingNotification}
        form={form}
        onCancel={onCancelModal}
        onSubmit={onSubmitModal}
      />
    </div>
  );
};

export default NotificationManagementFeature;
