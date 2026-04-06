import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { departmentService } from '../../services/departmentService';
import { branchService } from '../../services/branchService';
import { formatLog } from '../../utils/logFormatter';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptData, branchData] = await Promise.all([
        departmentService.getDepartments(),
        branchService.getBranches(),
      ]);
      setDepartments(deptData);
      setBranches(branchData);
    } catch (err) {
      console.error(formatLog('Load data failed', err.message));
      message.error('Tải dữ liệu thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const columns = [
    { 
      title: 'Chi nhánh', 
      dataIndex: 'branchId', 
      key: 'branchId',
      render: (branchId) => {
        const branch = branches.find(b => (b._id === branchId || b.id === branchId));
        return branch ? branch.name : '—';
      },
    },
    { title: 'Tên phòng ban', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', render: (t) => t || '—' },
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

  const handleEdit = (dept) => {
    setEditingDept(dept);
    form.setFieldsValue({ 
      branchId: dept.branchId,
      name: dept.name, 
      description: dept.description 
    });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa phòng ban này?',
      onOk() {
        departmentService
          .deleteDepartment(id)
          .then(() => {
            setDepartments(departments.filter((d) => d._id !== id && d.id !== id));
            message.success('Xóa phòng ban thành công');
          })
          .catch(() => message.error('Xóa phòng ban thất bại'));
      },
    });
  };

  const handleSubmit = async (values) => {
    try {
      if (editingDept) {
        const updated = await departmentService.updateDepartment(editingDept._id || editingDept.id, values);
        setDepartments(departments.map((d) => (d._id === updated._id ? updated : d)));
        message.success('Cập nhật phòng ban thành công');
      } else {
        const created = await departmentService.createDepartment(values);
        setDepartments([...departments, created]);
        message.success('Thêm phòng ban thành công');
      }
      setModalOpen(false);
      form.resetFields();
      setEditingDept(null);
    } catch (err) {
      message.error(err.message || 'Lưu phòng ban thất bại');
    }
  };

  return (
    <Card title="Quản lý Phòng ban" extra={
      <Space>
        <Button icon={<ReloadOutlined />} onClick={loadData} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditingDept(null);
        form.resetFields();
        setModalOpen(true);
      }}>
          Thêm phòng ban
        </Button>
      </Space>
    }>
      <Table columns={columns} dataSource={departments} rowKey={(r) => r._id || r.id} loading={loading} />
      <Modal
        title={editingDept ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item 
            name="branchId" 
            label="Chi nhánh" 
            rules={[{ required: true, message: 'Vui lòng chọn chi nhánh' }]}
          >
            <Select 
              placeholder="Chọn chi nhánh"
              options={branches.map(b => ({
                label: b.name,
                value: b._id || b.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="name" label="Tên phòng ban" rules={[{ required: true }]}>
            <Input placeholder="Nhập tên phòng ban" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Mô tả ngắn" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentManagement;
