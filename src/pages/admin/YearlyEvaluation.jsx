import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message, InputNumber, Select, Row, Col, Statistic } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';

const YearlyEvaluation = () => {
  const [evaluations, setEvaluations] = useState([
    { 
      id: 1, 
      year: 2024, 
      department: 'Ban Lãnh đạo',
      task: 'Chiến lược phát triển toàn công ty',
      fullScore: 100,
      deductedScore: 15,
      finalScore: 85,
      comment: 'Đạt kế hoạch'
    },
    { 
      id: 2, 
      year: 2024, 
      department: 'Kỹ thuật',
      task: 'Nâng cấp hạ tầng IT',
      fullScore: 100,
      deductedScore: 5,
      finalScore: 95,
      comment: 'Xuất sắc'
    },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEval, setEditingEval] = useState(null);
  const [form] = Form.useForm();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Năm', dataIndex: 'year', key: 'year' },
    { title: 'Phòng ban', dataIndex: 'department', key: 'department' },
    { title: 'Công việc', dataIndex: 'task', key: 'task' },
    { title: 'Điểm tối đa', dataIndex: 'fullScore', key: 'fullScore', width: 80 },
    { title: 'Trừ điểm', dataIndex: 'deductedScore', key: 'deductedScore', width: 80 },
    { 
      title: 'Điểm cuối cùng', 
      dataIndex: 'finalScore', 
      key: 'finalScore',
      width: 100,
      render: (score) => <span style={{ fontWeight: 'bold', color: score >= 90 ? '#52c41a' : score >= 70 ? '#faad14' : '#ff4d4f' }}>{score}</span>
    },
    { title: 'Nhận xét', dataIndex: 'comment', key: 'comment' },
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

  const handleEdit = (evaluation) => {
    setEditingEval(evaluation);
    form.setFieldsValue(evaluation);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      onOk() {
        setEvaluations(evaluations.filter(e => e.id !== id));
        message.success('Xóa đánh giá thành công');
      },
    });
  };

  const handleSubmit = (values) => {
    const finalScore = values.fullScore - values.deductedScore;
    const evalData = { ...values, finalScore };
    
    if (editingEval) {
      setEvaluations(evaluations.map(e => e.id === editingEval.id ? { ...e, ...evalData } : e));
      message.success('Cập nhật đánh giá thành công');
    } else {
      setEvaluations([...evaluations, { id: Date.now(), ...evalData }]);
      message.success('Thêm đánh giá thành công');
    }
    setModalOpen(false);
    form.resetFields();
    setEditingEval(null);
  };

  const avgScore = evaluations.length > 0 
    ? (evaluations.reduce((sum, e) => sum + e.finalScore, 0) / evaluations.length).toFixed(1)
    : 0;

  return (
    <div>
      <Card title="Quản lý Đánh giá Công việc Hàng năm">
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Tổng đánh giá"
              value={evaluations.length}
              prefix="📊"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Điểm trung bình"
              value={avgScore}
              suffix="/100"
              precision={1}
              valueStyle={{ color: avgScore >= 80 ? '#52c41a' : '#faad14' }}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => {
            setEditingEval(null);
            form.resetFields();
            setModalOpen(true);
          }}>
            Thêm đánh giá
          </Button>
        </div>

        <Table columns={columns} dataSource={evaluations} rowKey="id" />
      </Card>

      <Modal
        title={editingEval ? 'Chỉnh sửa đánh giá' : 'Thêm đánh giá công việc hàng năm'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="year" label="Năm" rules={[{ required: true }]}>
                <InputNumber min={2000} max={2099} style={{ width: '100%' }} placeholder="2024" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="Phòng ban" rules={[{ required: true }]}>
                <Input placeholder="Nhập phòng ban" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="task" label="Công việc chiến lược" rules={[{ required: true }]}>
            <Input placeholder="Nhập công việc năm" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fullScore" label="Điểm tối đa" rules={[{ required: true, type: 'number' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="100" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deductedScore" label="Trừ điểm" rules={[{ required: true, type: 'number' }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.fullScore !== currentValues.fullScore || prevValues.deductedScore !== currentValues.deductedScore}>
            {({ getFieldValue }) => (
              <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '16px' }}>
                <strong>Điểm cuối cùng: {(getFieldValue('fullScore') || 0) - (getFieldValue('deductedScore') || 0)}</strong>
              </div>
            )}
          </Form.Item>

          <Form.Item name="comment" label="Nhận xét" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Nhập đánh giá hàng năm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default YearlyEvaluation;
