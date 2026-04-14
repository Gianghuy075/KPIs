import React, { useEffect, useState } from 'react';
import { Card, Table, InputNumber, Button, Space, Typography, Tag, App as AntApp } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { categoryWeightService } from '../../services/categoryWeightService';

const { Text } = Typography;

const BSC_CATEGORIES = [
  { key: 'business', label: 'Tài chính' },
  { key: 'customer', label: 'Khách hàng' },
  { key: 'internal', label: 'Quy trình nội bộ' },
  { key: 'learning', label: 'Học hỏi & Phát triển' },
];

const BSCWeightManagement = () => {
  const { message } = AntApp.useApp();
  const [weights, setWeights] = useState(
    BSC_CATEGORIES.map((c) => ({ category: c.key, weight: 25 })),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await categoryWeightService.getAdminWeights();
      const merged = BSC_CATEGORIES.map((c) => {
        const found = data.find((d) => d.category === c.key);
        return { category: c.key, weight: found?.weight ?? 25 };
      });
      setWeights(merged);
    } catch {
      message.error('Không tải được trọng số');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateWeight = (category, value) => {
    setWeights((prev) =>
      prev.map((w) => (w.category === category ? { ...w, weight: value ?? 0 } : w)),
    );
  };

  const total = weights.reduce((s, w) => s + (w.weight || 0), 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const handleSave = async () => {
    if (!isValid) {
      message.error('Tổng trọng số phải bằng 100%');
      return;
    }
    setSaving(true);
    try {
      await categoryWeightService.setAdminWeights(weights);
      message.success('Đã lưu trọng số');
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Góc độ BSC',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => BSC_CATEGORIES.find((c) => c.key === cat)?.label || cat,
    },
    {
      title: 'Trọng số (%)',
      dataIndex: 'weight',
      key: 'weight',
      width: 180,
      render: (_, record) => (
        <InputNumber
          min={0}
          max={100}
          value={record.weight}
          onChange={(val) => updateWeight(record.category, val)}
          style={{ width: 120 }}
        />
      ),
    },
  ];

  return (
    <Card
      title="Trọng số Góc độ BSC"
      extra={
        <Space>
          <Text>
            Tổng:{' '}
            <Text strong style={{ color: isValid ? '#52c41a' : '#ff4d4f' }}>
              {total}%
            </Text>
          </Text>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading} />
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={!isValid}
            onClick={handleSave}
          >
            Lưu
          </Button>
        </Space>
      }
    >
      {!isValid && (
        <div style={{ marginBottom: 12 }}>
          <Tag color="error">Tổng phải bằng 100% (hiện tại: {total}%)</Tag>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={weights}
        rowKey="category"
        loading={loading}
        pagination={false}
      />
    </Card>
  );
};

export default BSCWeightManagement;
