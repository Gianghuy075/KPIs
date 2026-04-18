import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { FORM_RECIPIENT_OPTIONS, FORM_STATUS_OPTIONS } from './constants';
import { getRecipientColor, getRecipientLabel, getStatusTag } from './helpers';

export const NotificationTableCard = ({
  notifications,
  loading,
  onAdd,
  onEdit,
  onDelete,
}) => {
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
      render: (text) => <span title={text}>{text.substring(0, 50)}...</span>,
    },
    {
      title: 'Gửi cho',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (recipients) => (
        <Tag color={getRecipientColor(recipients)}>{getRecipientLabel(recipients)}</Tag>
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
          <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          <Popconfirm
            title="Xác nhận xóa"
            description="Bạn có chắc chắn muốn xóa thông báo này?"
            onConfirm={() => onDelete(record.id)}
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
    <Card
      title="Danh sách Thông báo"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
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
  );
};

export const NotificationFormModal = ({
  open,
  editingNotification,
  submitting = false,
  form,
  onCancel,
  onSubmit,
}) => (
  <Modal
    title={editingNotification ? 'Chỉnh sửa Thông báo' : 'Tạo Thông báo Mới'}
    open={open}
    onOk={() => form.submit()}
    onCancel={() => { if (!submitting) onCancel(); }}
    confirmLoading={submitting}
    okButtonProps={{ disabled: submitting }}
    cancelButtonProps={{ disabled: submitting }}
    closable={!submitting}
    maskClosable={!submitting}
    keyboard={!submitting}
    width={600}
  >
    <Form form={form} layout="vertical" onFinish={onSubmit}>
      <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
        <Input placeholder="Nhập tiêu đề thông báo" />
      </Form.Item>

      <Form.Item name="content" label="Nội dung" rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
        <Input.TextArea placeholder="Nhập nội dung thông báo" rows={4} />
      </Form.Item>

      <Form.Item
        name="recipients"
        label="Gửi cho"
        rules={[{ required: true, message: 'Vui lòng chọn đối tượng nhận thông báo' }]}
      >
        <Select mode="multiple" placeholder="Chọn đối tượng" options={FORM_RECIPIENT_OPTIONS} />
      </Form.Item>

      <Form.Item name="status" label="Trạng thái" initialValue="active" rules={[{ required: true }]}>
        <Select options={FORM_STATUS_OPTIONS} />
      </Form.Item>
    </Form>
  </Modal>
);
