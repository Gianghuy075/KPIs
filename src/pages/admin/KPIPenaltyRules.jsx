import React, { useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, Card, message, InputNumber, Select, Row, Col, Tabs, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';

const PENALTY_RULES_DATA = {
  FINANCIAL: {
    name: 'Tài chính',
    color: '#1890ff',
    general: [
      { id: 1, rule: 'Báo cáo muộn', condition: 'Trễ 1 ngày', penalty: 5, description: 'Trừ 5 điểm mỗi ngày trễ hạn báo cáo' },
      { id: 2, rule: 'Sai lệch dữ liệu', condition: 'Sai >5%', penalty: 10, description: 'Trừ 10 điểm khi dữ liệu sai >5%' },
    ],
    monthly: [
      { id: 1, rule: 'Không đạt doanh thu', condition: '<90% mục tiêu', penalty: 15, description: 'Trừ 15 điểm khi doanh thu <90% mục tiêu' },
    ],
    quarterly: [
      { id: 1, rule: 'Không đạt lợi nhuận', condition: '<85% mục tiêu', penalty: 20, description: 'Trừ 20 điểm khi lợi nhuận <85% mục tiêu' },
    ],
    yearly: [
      { id: 1, rule: 'Không đạt mục tiêu năm', condition: '<80% mục tiêu', penalty: 25, description: 'Trừ 25 điểm khi không đạt 80% mục tiêu năm' },
    ],
  },
  CUSTOMER: {
    name: 'Khách hàng',
    color: '#52c41a',
    general: [
      { id: 1, rule: 'Khách hàng phàn nàn', condition: 'Có phàn nàn', penalty: 8, description: 'Trừ 8 điểm khi có khách hàng phàn nàn' },
    ],
    monthly: [
      { id: 1, rule: 'CSAT thấp', condition: '<80%', penalty: 12, description: 'Trừ 12 điểm khi CSAT <80%' },
    ],
    quarterly: [
      { id: 1, rule: 'Giữ chân khách hàng', condition: '<85%', penalty: 18, description: 'Trừ 18 điểm khi tỷ lệ giữ chân <85%' },
    ],
    yearly: [
      { id: 1, rule: 'Tăng khách hàng', condition: '<90% mục tiêu', penalty: 20, description: 'Trừ 20 điểm khi khách hàng mới <90% mục tiêu' },
    ],
  },
  INTERNAL: {
    name: 'Quy trình nội bộ',
    color: '#faad14',
    general: [
      { id: 1, rule: 'Lỗi quy trình', condition: 'Vi phạm SOP', penalty: 10, description: 'Trừ 10 điểm khi vi phạm Standard Operating Procedure' },
    ],
    monthly: [
      { id: 1, rule: 'Thời gian xử lý', condition: '>24 giờ', penalty: 8, description: 'Trừ 8 điểm khi vượt quá 24 giờ xử lý' },
    ],
    quarterly: [
      { id: 1, rule: 'Giao hàng đúng hạn', condition: '<95%', penalty: 15, description: 'Trừ 15 điểm khi tỷ lệ giao hàng đúng hạn <95%' },
    ],
    yearly: [
      { id: 1, rule: 'Chất lượng sản phẩm', condition: '>2 lỗi/1000', penalty: 22, description: 'Trừ 22 điểm khi lỗi sản phẩm >2 trên 1000 đơn vị' },
    ],
  },
  LEARNING: {
    name: 'Học hỏi & Phát triển',
    color: '#722ed1',
    general: [
      { id: 1, rule: 'Không tham gia đào tạo', condition: 'Vắng mặt', penalty: 5, description: 'Trừ 5 điểm khi vắng mặt đào tạo' },
    ],
    monthly: [
      { id: 1, rule: 'Hoàn thành học tập', condition: '<100% khoá', penalty: 10, description: 'Trừ 10 điểm khi không hoàn thành khóa học' },
    ],
    quarterly: [
      { id: 1, rule: 'Gắn kết nhân viên', condition: '<75 điểm', penalty: 12, description: 'Trừ 12 điểm khi chỉ số gắn kết <75' },
    ],
    yearly: [
      { id: 1, rule: 'Sáng kiến cải tiến', condition: '<mục tiêu', penalty: 15, description: 'Trừ 15 điểm khi số sáng kiến <mục tiêu' },
    ],
  },
};

const KPIPenaltyRules = () => {
  const [selectedBSC, setSelectedBSC] = useState('FINANCIAL');
  const [penaltyRules, setPenaltyRules] = useState(PENALTY_RULES_DATA);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleType, setRuleType] = useState('general'); // general, monthly, quarterly, yearly
  const [form] = Form.useForm();

  const currentBSC = penaltyRules[selectedBSC];

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Quy tắc trừ điểm', dataIndex: 'rule', key: 'rule' },
    { title: 'Điều kiện', dataIndex: 'condition', key: 'condition', width: 120 },
    { title: 'Trừ điểm', dataIndex: 'penalty', key: 'penalty', width: 100, render: (v) => `-${v} điểm` },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
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

  const handleEdit = (rule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa quy tắc này?',
      onOk() {
        const newRules = penaltyRules[selectedBSC][ruleType].filter(r => r.id !== id);
        setPenaltyRules({
          ...penaltyRules,
          [selectedBSC]: {
            ...penaltyRules[selectedBSC],
            [ruleType]: newRules,
          },
        });
        message.success('Xóa quy tắc thành công');
      },
    });
  };

  const handleSubmit = (values) => {
    const newRule = editingRule ? { ...editingRule, ...values } : { id: Date.now(), ...values };
    
    let updatedRules;
    if (editingRule) {
      updatedRules = penaltyRules[selectedBSC][ruleType].map(r => r.id === editingRule.id ? newRule : r);
    } else {
      updatedRules = [...penaltyRules[selectedBSC][ruleType], newRule];
    }

    setPenaltyRules({
      ...penaltyRules,
      [selectedBSC]: {
        ...penaltyRules[selectedBSC],
        [ruleType]: updatedRules,
      },
    });

    message.success(editingRule ? 'Cập nhật quy tắc thành công' : 'Thêm quy tắc thành công');
    setModalOpen(false);
    form.resetFields();
    setEditingRule(null);
  };

  const getRuleTypeLabel = () => {
    const labels = {
      general: 'Quy tắc chung',
      monthly: 'Công việc Hàng tháng',
      quarterly: 'Công việc Hàng quý',
      yearly: 'Công việc Hàng năm',
    };
    return labels[ruleType];
  };

  const tabItems = [
    {
      key: 'general',
      label: '📋 Quy tắc Chung',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setRuleType('general');
              setEditingRule(null);
              form.resetFields();
              setModalOpen(true);
            }}>
              Thêm quy tắc chung
            </Button>
          </div>
          <Table columns={columns} dataSource={currentBSC.general} rowKey="id" />
        </div>
      ),
    },
    {
      key: 'monthly',
      label: '📅 Hàng Tháng',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setRuleType('monthly');
              setEditingRule(null);
              form.resetFields();
              setModalOpen(true);
            }}>
              Thêm quy tắc hàng tháng
            </Button>
          </div>
          <Table columns={columns} dataSource={currentBSC.monthly} rowKey="id" />
        </div>
      ),
    },
    {
      key: 'quarterly',
      label: '📊 Hàng Quý',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setRuleType('quarterly');
              setEditingRule(null);
              form.resetFields();
              setModalOpen(true);
            }}>
              Thêm quy tắc hàng quý
            </Button>
          </div>
          <Table columns={columns} dataSource={currentBSC.quarterly} rowKey="id" />
        </div>
      ),
    },
    {
      key: 'yearly',
      label: '📈 Hàng Năm',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setRuleType('yearly');
              setEditingRule(null);
              form.resetFields();
              setModalOpen(true);
            }}>
              Thêm quy tắc hàng năm
            </Button>
          </div>
          <Table columns={columns} dataSource={currentBSC.yearly} rowKey="id" />
        </div>
      ),
    },
  ];

  return (
    <Card title="Quản lý Quy tắc Trừ điểm KPI" style={{ marginBottom: 24 }}>
      <Alert
        message="Quy tắc Trừ điểm theo từng BSC"
        description="Mỗi BSC có quy tắc trừ điểm chung và quy tắc riêng cho từng nhóm công việc (hàng tháng, quý, năm)"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={6}>
          <Button
            block
            type={selectedBSC === 'FINANCIAL' ? 'primary' : 'default'}
            onClick={() => setSelectedBSC('FINANCIAL')}
            style={{ height: '50px', fontWeight: 'bold' }}
          >
            💰 Tài chính
          </Button>
        </Col>
        <Col xs={24} md={6}>
          <Button
            block
            type={selectedBSC === 'CUSTOMER' ? 'primary' : 'default'}
            onClick={() => setSelectedBSC('CUSTOMER')}
            style={{ height: '50px', fontWeight: 'bold' }}
          >
            👥 Khách hàng
          </Button>
        </Col>
        <Col xs={24} md={6}>
          <Button
            block
            type={selectedBSC === 'INTERNAL' ? 'primary' : 'default'}
            onClick={() => setSelectedBSC('INTERNAL')}
            style={{ height: '50px', fontWeight: 'bold' }}
          >
            ⚙️ Quy trình nội bộ
          </Button>
        </Col>
        <Col xs={24} md={6}>
          <Button
            block
            type={selectedBSC === 'LEARNING' ? 'primary' : 'default'}
            onClick={() => setSelectedBSC('LEARNING')}
            style={{ height: '50px', fontWeight: 'bold' }}
          >
            🎓 Học hỏi & Phát triển
          </Button>
        </Col>
      </Row>

      <Tabs items={tabItems} />

      <Modal
        title={editingRule ? 'Chỉnh sửa quy tắc' : `Thêm quy tắc (${getRuleTypeLabel()})`}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="rule" label="Quy tắc trừ điểm" rules={[{ required: true }]}>
            <Input placeholder="VD: Báo cáo muộn, Sai lệch dữ liệu..." />
          </Form.Item>
          <Form.Item name="condition" label="Điều kiện" rules={[{ required: true }]}>
            <Input placeholder="VD: Trễ 1 ngày, Sai >5%, <90% mục tiêu..." />
          </Form.Item>
          <Form.Item name="penalty" label="Số điểm trừ" rules={[{ required: true, type: 'number' }]}>
            <InputNumber min={0} max={100} placeholder="Nhập số điểm trừ" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết quy tắc trừ điểm" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default KPIPenaltyRules;
