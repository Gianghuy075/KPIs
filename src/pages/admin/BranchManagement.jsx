import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message, Divider, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { branchService } from '../../services/branchService';
import { formatLog } from '../../utils/logFormatter';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [form] = Form.useForm();

  const generateBranchCode = () =>
    `BR${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await branchService.getBranches();
      setBranches(data);
    } catch (err) {
      console.error(formatLog('Load branches failed', err.message));
      message.error('Tải chi nhánh thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    {
      title: 'Mã chi nhánh',
      dataIndex: 'code',
      key: 'code',
      width: 100,
    },
    {
      title: 'Tên chi nhánh',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <HomeOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      render: (t) => t || '—',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (t) => t || '—',
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      ),
    },
  ];

  const handleEdit = (branch) => {
    setEditingBranch(branch);
    form.setFieldsValue({
      name: branch.name,
      address: branch.address,
      description: branch.description,
    });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa chi nhánh này? Các phòng ban liên kết sẽ bị ảnh hưởng.',
      onOk() {
        branchService
          .deleteBranch(id)
          .then(() => {
            setBranches(branches.filter((b) => b._id !== id && b.id !== id));
            message.success('Xóa chi nhánh thành công');
          })
          .catch(() => message.error('Xóa chi nhánh thất bại'));
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      const payload = editingBranch
        ? values
        : { ...values, code: generateBranchCode() };

      if (editingBranch) {
        const updated = await branchService.updateBranch(editingBranch._id || editingBranch.id, payload);
        setBranches(branches.map((b) => (b._id === updated._id ? updated : b)));
        message.success('Cập nhật chi nhánh thành công');
      } else {
        const created = await branchService.createBranch(payload);
        setBranches([...branches, created]);
        message.success('Thêm chi nhánh thành công');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingBranch(null);
    } catch (err) {
      message.error(err.message || 'Lưu chi nhánh thất bại');
    }
  };

  return (
    <Card
      title="Quản lý Chi nhánh (Phân xưởng)"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadData} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingBranch(null);
              form.resetFields();
              setModalOpen(true);
            }}
          >
            Thêm chi nhánh
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={branches}
        rowKey={(r) => r._id || r.id}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Tên chi nhánh"
            rules={[{ required: true, message: 'Vui lòng nhập tên chi nhánh' }]}
          >
            <Input placeholder="VD: Phân xưởng A, Phân xưởng B" />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea placeholder="Nhập địa chỉ chi nhánh" rows={2} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Mô tả ngắn về chi nhánh" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default BranchManagement;
