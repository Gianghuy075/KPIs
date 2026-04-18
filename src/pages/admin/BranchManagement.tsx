import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import workshopKpiService from '../../services/workshopKpiService';

const BranchManagement = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await workshopKpiService.listWorkshops();
      setWorkshops(data);
    } catch {
      message.error('Tải danh sách phân xưởng thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const columns = [
    { title: 'Tên phân xưởng', dataIndex: 'name', key: 'name' },
    { title: 'Địa chỉ', dataIndex: 'address', key: 'address', render: t => t || '—' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', render: t => t || '—' },
    {
      title: 'Hành động', key: 'action', width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({ name: item.name, address: item.address, description: item.description });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa phân xưởng này?',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await workshopKpiService.removeWorkshop(id);
          setWorkshops(prev => prev.filter(w => w.id !== id));
          message.success('Đã xóa phân xưởng');
        } catch {
          message.error('Xóa phân xưởng thất bại');
        }
      },
    });
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        const updated = await workshopKpiService.updateWorkshop(editingItem.id, values);
        setWorkshops(prev => prev.map(w => w.id === updated.id ? updated : w));
        message.success('Cập nhật phân xưởng thành công');
      } else {
        const created = await workshopKpiService.createWorkshop(values);
        setWorkshops(prev => [...prev, created]);
        message.success('Thêm phân xưởng thành công');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingItem(null);
    } catch (err) {
      message.error(err.message || 'Lưu phân xưởng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card
      title="Quản lý Phân xưởng"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingItem(null); form.resetFields(); setModalOpen(true); }}
          >
            Thêm phân xưởng
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={workshops}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={editingItem ? 'Chỉnh sửa phân xưởng' : 'Thêm phân xưởng'}
        open={modalOpen}
        onCancel={() => { if (!submitting) { setModalOpen(false); form.resetFields(); } }}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okButtonProps={{ disabled: submitting }}
        cancelButtonProps={{ disabled: submitting }}
        maskClosable={!submitting}
        keyboard={!submitting}
        destroyOnHide
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Tên phân xưởng" rules={[{ required: true }]}>
            <Input placeholder="VD: Phân xưởng A" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={2} placeholder="Nhập địa chỉ" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về phân xưởng" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default BranchManagement;
