import React, { useState } from 'react';
import { Tabs, Card, Table, Button, Space, Modal, Form, Input, message, InputNumber, Select, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const PenaltyRulesByBSC = () => {
  const [activeTab, setActiveTab] = useState('FINANCIAL');
  const [rules, setRules] = useState({
    FINANCIAL: {
      monthly: [
        { id: 1, rule: 'Không đạt doanh thu', condition: '<90% mục tiêu', penalty: 15, description: 'Trừ 15 điểm' },
      ],
      quarterly: [
        { id: 1, rule: 'Không đạt lợi nhuận', condition: '<85% mục tiêu', penalty: 20, description: 'Trừ 20 điểm' },
      ],
      yearly: [
        { id: 1, rule: 'Không đạt mục tiêu năm', condition: '<80% mục tiêu', penalty: 25, description: 'Trừ 25 điểm' },
      ],
    },
    CUSTOMER: {
      monthly: [
        { id: 1, rule: 'CSAT thấp', condition: '<80%', penalty: 12, description: 'Trừ 12 điểm' },
      ],
      quarterly: [
        { id: 1, rule: 'Giữ chân khách hàng', condition: '<85%', penalty: 18, description: 'Trừ 18 điểm' },
      ],
      yearly: [
        { id: 1, rule: 'Tăng khách hàng', condition: '<90% mục tiêu', penalty: 20, description: 'Trừ 20 điểm' },
      ],
    },
    INTERNAL: {
      monthly: [
        { id: 1, rule: 'Thời gian xử lý', condition: '>24 giờ', penalty: 8, description: 'Trừ 8 điểm' },
      ],
      quarterly: [
        { id: 1, rule: 'Giao hàng đúng hạn', condition: '<95%', penalty: 15, description: 'Trừ 15 điểm' },
      ],
      yearly: [
        { id: 1, rule: 'Chất lượng sản phẩm', condition: '>2 lỗi/1000', penalty: 22, description: 'Trừ 22 điểm' },
      ],
    },
    LEARNING: {
      monthly: [
        { id: 1, rule: 'Hoàn thành học tập', condition: '<100% khoá', penalty: 10, description: 'Trừ 10 điểm' },
      ],
      quarterly: [
        { id: 1, rule: 'Gắn kết nhân viên', condition: '<75 điểm', penalty: 12, description: 'Trừ 12 điểm' },
      ],
      yearly: [
        { id: 1, rule: 'Sáng kiến cải tiến', condition: '<mục tiêu', penalty: 15, description: 'Trừ 15 điểm' },
      ],
    },
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [ruleType, setRuleType] = useState('monthly');
  const [form] = Form.useForm();

  const bscOptions = {
    FINANCIAL: { name: '💰 Tài chính', color: '#1890ff' },
    CUSTOMER: { name: '👥 Khách hàng', color: '#52c41a' },
    INTERNAL: { name: '⚙️ Quy trình nội bộ', color: '#faad14' },
    LEARNING: { name: '🎓 Học hỏi & Phát triển', color: '#722ed1' },
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: 'Quy tắc trừ điểm', dataIndex: 'rule', key: 'rule' },
    { title: 'Điều kiện', dataIndex: 'condition', key: 'condition', width: 150 },
    { title: 'Trừ điểm', dataIndex: 'penalty', key: 'penalty', width: 100, render: (v) => <span style={{ fontWeight: 'bold', color: '#ff4d4f' }}>-{v} điểm</span> },
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
      onOk() {
        setRules({
          ...rules,
          [activeTab]: {
            ...rules[activeTab],
            [ruleType]: rules[activeTab][ruleType].filter(r => r.id !== id),
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
      updatedRules = rules[activeTab][ruleType].map(r => r.id === editingRule.id ? newRule : r);
    } else {
      updatedRules = [...rules[activeTab][ruleType], newRule];
    }

    setRules({
      ...rules,
      [activeTab]: {
        ...rules[activeTab],
        [ruleType]: updatedRules,
      },
    });

    message.success(editingRule ? 'Cập nhật quy tắc thành công' : 'Thêm quy tắc thành công');
    setModalOpen(false);
    form.resetFields();
    setEditingRule(null);
  };

  const ruleTypeMap = {
    monthly: '📅 Hàng Tháng',
    quarterly: '📊 Hàng Quý',
    yearly: '📈 Hàng Năm',
  };

  const currentData = rules[activeTab];
  
  const tabItems = [
    {
      key: 'monthly',
      label: ruleTypeMap.monthly,
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setRuleType('monthly');
              setEditingRule(null);
              form.resetFields();
              setModalOpen(true);
            }}>
              Thêm quy tắc
            </Button>
          </div>
          <Table columns={columns} dataSource={currentData.monthly} rowKey="id" />
        </div>
      ),
    },
    {
      key: 'quarterly',
      label: ruleTypeMap.quarterly,
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setRuleType('quarterly');
              setEditingRule(null);
              form.resetFields();
              setModalOpen(true);
            }}>
              Thêm quy tắc
            </Button>
          </div>
          <Table columns={columns} dataSource={currentData.quarterly} rowKey="id" />
        </div>
      ),
    },
    {
      key: 'yearly',
      label: ruleTypeMap.yearly,
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => {
              setRuleType('yearly');
              setEditingRule(null);
              form.resetFields();
              setModalOpen(true);
            }}>
              Thêm quy tắc
            </Button>
          </div>
          <Table columns={columns} dataSource={currentData.yearly} rowKey="id" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={Object.entries(bscOptions).map(([key, option]) => ({
          key,
          label: option.name,
        }))}
        style={{ marginBottom: 24 }}
      />

      <Card title={`Quy tắc Trừ điểm ${bscOptions[activeTab].name}`}>
        <Tabs items={tabItems} onChange={setRuleType} />
      </Card>

      <Modal
        title={editingRule ? 'Chỉnh sửa quy tắc' : `Thêm quy tắc (${ruleTypeMap[ruleType]})`}
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
            <Input placeholder="VD: Không đạt doanh thu, CSAT thấp..." />
          </Form.Item>
          <Form.Item name="condition" label="Điều kiện" rules={[{ required: true }]}>
            <Input placeholder="VD: <90% mục tiêu, <80%, >24 giờ..." />
          </Form.Item>
          <Form.Item name="penalty" label="Số điểm trừ" rules={[{ required: true, type: 'number' }]}>
            <InputNumber min={0} max={100} placeholder="Nhập số điểm trừ" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả chi tiết" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết quy tắc trừ điểm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PenaltyRulesByBSC;
