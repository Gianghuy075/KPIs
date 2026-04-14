import React, { useEffect, useState } from 'react';
import { Card, Table, InputNumber, Button, Space, Typography, Tag, App as AntApp } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { categoryWeightService } from '../../services/categoryWeightService';

const { Text } = Typography;

const BSC_CATEGORIES = [
  { key: 'business', label: 'Tài chính' },
  { key: 'customer', label: 'Khách hàng' },
  { key: 'internal', label: 'Quy trình nội bộ' },
  { key: 'learning', label: 'Học hỏi & Phát triển' },
];

const CATEGORY_LABEL = Object.fromEntries(BSC_CATEGORIES.map((c) => [c.key, c.label]));

const BSCWeightManagement = () => {
  const { message } = AntApp.useApp();
  const [weights, setWeights] = useState(
    BSC_CATEGORIES.map((c) => ({ category: c.key, weight: 25 })),
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await categoryWeightService.getAdminHistory();
      setHistory(data);
    } catch {
      message.error('Không tải được lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadHistory();
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
      loadHistory();
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const weightColumns = [
    {
      title: 'Góc độ BSC',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => CATEGORY_LABEL[cat] || cat,
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

  const historyColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v) => dayjs(v).format('DD/MM/YYYY HH:mm:ss'),
    },
    {
      title: 'Người thay đổi',
      key: 'changedBy',
      width: 160,
      render: (_, record) => record.changedBy?.name || record.changedBy?.username || '—',
    },
    {
      title: 'Trọng số đã lưu',
      key: 'weights',
      render: (_, record) => (
        <Space size={4} wrap>
          {record.weights.map((w) => (
            <Tag key={w.category} color="blue">
              {CATEGORY_LABEL[w.category] || w.category}: {w.weight}%
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
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
          columns={weightColumns}
          dataSource={weights}
          rowKey="category"
          loading={loading}
          pagination={false}
        />
      </Card>

      <Card
        title="Lịch sử thay đổi trọng số"
        extra={
          <Button icon={<ReloadOutlined />} size="small" onClick={loadHistory} loading={historyLoading} />
        }
      >
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="_id"
          loading={historyLoading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="small"
          locale={{ emptyText: 'Chưa có lịch sử thay đổi' }}
        />
      </Card>
    </Space>
  );
};

export default BSCWeightManagement;
