import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Tooltip, Progress, Popconfirm, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatPercent, getStatusLabel, getStatusColor, PERSPECTIVE_COLORS } from '../../../utils/kpiUtils';

const { Text } = Typography;

const formatValue = (value, unit) => {
  if (value === null || value === undefined) return '-';
  if (unit === 'VND') {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
  return `${new Intl.NumberFormat('vi-VN').format(value)} ${unit}`;
};

const KPITable = ({
  kpis,
  loading,
  onEdit,
  onDelete,
  showActions = true,
  categoryWeights: _categoryWeights = {},
}) => {
  const tableData = useMemo(() => {
    if (!kpis || kpis.length === 0) return [];

    const grouped = {};
    kpis.forEach((kpi) => {
      if (!grouped[kpi.perspective]) {
        grouped[kpi.perspective] = [];
      }
      grouped[kpi.perspective].push({ ...kpi, key: kpi.id });
    });

    const rows = [];
    Object.entries(grouped).forEach(([perspective, items]) => {
      items.forEach((item, index) => {
        rows.push({
          ...item,
          perspectiveRowSpan: index === 0 ? items.length : 0,
          weightRowSpan: index === 0 ? items.length : 0,
          perspectiveLabel: perspective,
        });
      });
    });
    return rows;
  }, [kpis]);

  const columns = [
    {
      title: 'Góc độ BSC',
      dataIndex: 'perspectiveLabel',
      key: 'perspective',
      width: 160,
      onCell: (record) => ({
        rowSpan: record.perspectiveRowSpan,
        style: {
          background: record.perspectiveRowSpan > 0
            ? `${PERSPECTIVE_COLORS[record.perspectiveLabel] || '#e6f7ff'}15`
            : undefined,
          fontWeight: 600,
          color: PERSPECTIVE_COLORS[record.perspectiveLabel] || '#595959',
          verticalAlign: 'middle',
          textAlign: 'center',
        },
      }),
      render: (text, record) => (
        <Text strong style={{ color: PERSPECTIVE_COLORS[record.perspectiveLabel] || '#595959' }}>
          {text || 'Khác'}
        </Text>
      ),
    },
    {
      title: 'Trọng số',
      dataIndex: 'categoryWeight',
      key: 'weight',
      width: 90,
      align: 'center',
      onCell: (record) => ({
        rowSpan: record.weightRowSpan,
        style: { verticalAlign: 'middle', textAlign: 'center', borderRight: '2px solid #f0f0f0' },
      }),
      render: (weight) => <Tag color="blue">{weight ?? 0}%</Tag>,
    },
    {
      title: 'Tên KPI',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      ellipsis: { showTitle: false },
      render: (name) => (
        <Tooltip title={name || '—'} placement="topLeft">
          <Text>{name || '—'}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Mục tiêu',
      dataIndex: 'target',
      key: 'target',
      width: 140,
      align: 'right',
      render: (value, record) => formatValue(value, record.unit),
    },
    {
      title: 'Thực tế',
      dataIndex: 'actual',
      key: 'actual',
      width: 140,
      align: 'right',
      render: (value, record) => formatValue(value, record.unit),
    },
    {
      title: 'Tỷ lệ hoàn thành',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 180,
      render: (rate) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Progress
            percent={Math.min(rate, 100)}
            size="small"
            status={rate >= 100 ? 'success' : rate >= 70 ? 'normal' : 'exception'}
            format={() => formatPercent(rate)}
          />
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      align: 'center',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{getStatusLabel(status)}</Tag>
      ),
    },
  ];

  if (showActions) {
    columns.push({
      title: 'Hành động',
      key: 'actions',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit?.(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa KPI"
            description="Bạn có chắc chắn muốn xóa KPI này không?"
            onConfirm={() => onDelete?.(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    });
  }

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      loading={loading}
      pagination={false}
      scroll={{ x: 1200 }}
      size="middle"
      rowKey="id"
    />
  );
};

export default KPITable;
