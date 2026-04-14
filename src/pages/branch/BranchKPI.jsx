import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Space, InputNumber, Button, Typography, App as AntApp } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { branchKpiService } from '../../services/branchKpiService';
import { categoryWeightService } from '../../services/categoryWeightService';
import { useAuth } from '../../contexts/AuthContext';

const { Text } = Typography;

const BSC_CATEGORIES = [
  { key: 'business', label: 'Tài chính' },
  { key: 'customer', label: 'Khách hàng' },
  { key: 'internal', label: 'Quy trình nội bộ' },
  { key: 'learning', label: 'Học hỏi & Phát triển' },
];

const BranchKPI = () => {
  const { message } = AntApp.useApp();
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // weight state
  const [weights, setWeights] = useState(
    BSC_CATEGORIES.map((c) => ({ category: c.key, weight: 25 })),
  );
  const [isDefault, setIsDefault] = useState(true);
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightSaving, setWeightSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const branchId = user?.branch?._id || user?.branch;

  const load = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await branchKpiService.listByBranch(branchId);
      setData(res);
    } catch {
      message.error('Không tải được KPI phân xưởng');
    } finally {
      setLoading(false);
    }
  };

  const loadWeights = async () => {
    if (!branchId) return;
    setWeightLoading(true);
    try {
      const data = await categoryWeightService.getBranchWeights(branchId);
      const merged = BSC_CATEGORIES.map((c) => {
        const found = data.find((d) => d.category === c.key);
        return { category: c.key, weight: found?.weight ?? 25 };
      });
      setWeights(merged);
      setIsDefault(data.every((d) => d.isDefault));
    } catch {
      message.error('Không tải được trọng số');
    } finally {
      setWeightLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!branchId) return;
    setHistoryLoading(true);
    try {
      const data = await categoryWeightService.getBranchHistory(branchId);
      setHistory(data);
    } catch {
      message.error('Không tải được lịch sử');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadWeights();
    loadHistory();
  }, [branchId]);

  const updateWeight = (category, value) => {
    setWeights((prev) =>
      prev.map((w) => (w.category === category ? { ...w, weight: value ?? 0 } : w)),
    );
  };

  const total = weights.reduce((s, w) => s + (w.weight || 0), 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const handleSaveWeights = async () => {
    if (!isValid) {
      message.error('Tổng trọng số phải bằng 100%');
      return;
    }
    setWeightSaving(true);
    try {
      await categoryWeightService.setBranchWeights(branchId, weights);
      message.success('Đã lưu trọng số phân xưởng');
      setIsDefault(false);
    } catch (err) {
      message.error(err?.response?.data?.message || 'Lưu thất bại');
    } finally {
      setWeightSaving(false);
    }
  };

  const CATEGORY_LABEL = {
    business: 'Tài chính',
    customer: 'Khách hàng',
    internal: 'Quy trình nội bộ',
    learning: 'Học hỏi & Phát triển',
  };

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

  const weightColumns = [
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

  const formatValue = (value, unit) => {
    if (typeof value !== 'number') return `${value} ${unit}`;
    return `${value.toLocaleString('vi-VN')} ${unit}`;
  };

  const kpiColumns = [
    { title: 'Tên KPI', dataIndex: ['companyKpi', 'title'], key: 'title' },
    { title: 'Category', dataIndex: ['companyKpi', 'category'], key: 'category' },
    { title: 'Phân bổ', key: 'alloc', render: (_, r) => formatValue(r.allocatedValue, r.unit) },
    { title: 'Thực tế', dataIndex: 'actualValue', key: 'actualValue', render: (v, r) => formatValue(v, r.unit) },
    { title: 'Hạn', dataIndex: 'targetDate', key: 'targetDate', render: (d) => dayjs(d).format('YYYY-MM-DD') },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (s) => (
        <Tag>
          {s === 'assigned' ? 'Đã phân bổ' : s === 'in_progress' ? 'Đang thực hiện' : s === 'completed' ? 'Hoàn thành' : s}
        </Tag>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Card
        title={
          <Space>
            <span>Trọng số Góc độ BSC</span>
            {isDefault && <Tag color="blue">Mặc định từ Admin</Tag>}
          </Space>
        }
        extra={
          <Space>
            <Text>
              Tổng:{' '}
              <Text strong style={{ color: isValid ? '#52c41a' : '#ff4d4f' }}>
                {total}%
              </Text>
            </Text>
            <Button icon={<ReloadOutlined />} onClick={loadWeights} loading={weightLoading} />
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={weightSaving}
              disabled={!isValid}
              onClick={handleSaveWeights}
            >
              Lưu trọng số
            </Button>
          </Space>
        }
      >
        <Table
          columns={weightColumns}
          dataSource={weights}
          rowKey="category"
          loading={weightLoading}
          pagination={false}
          size="small"
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

      <Card title="KPI Phân xưởng">
        <Table columns={kpiColumns} dataSource={data} loading={loading} rowKey="_id" />
      </Card>
    </Space>
  );
};

export default BranchKPI;
