import { useMemo } from 'react';
import { Table, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { calcCompletionRate } from '../utils/bonusUtils';
import { calculatePenalty } from '../utils/penaltyUtils';

const BSC_ORDER = ['Tài chính', 'Khách hàng', 'Quy trình nội bộ', 'Học hỏi & Phát triển'];

const BSC_COLORS = {
  'Tài chính': { color: '#1d4ed8', background: '#dbeafe' },
  'Khách hàng': { color: '#15803d', background: '#dcfce7' },
  'Quy trình nội bộ': { color: '#b45309', background: '#fef3c7' },
  'Học hỏi & Phát triển': { color: '#7c3aed', background: '#ede9fe' },
};

const getRatingStyle = (rate) => {
  if (rate >= 85) return { color: '#16a34a', background: '#dcfce7' };
  if (rate >= 70) return { color: '#d97706', background: '#fef3c7' };
  return { color: '#dc2626', background: '#fee2e2' };
};

const thStyle = {
  fontWeight: 700,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const KpiSystemTable = ({
  kpis = [],
  allEntries = {},
  bscCategoryMap = {},
  penaltyLogics = [],
  canManage = false,
  onEdit,
  onDelete,
  loading = false,
}) => {
  const processed = useMemo(() => kpis.map(kpi => {
    const entries = allEntries[kpi.id] || [];
    const withActual = entries.filter(e => e.actualValue != null);
    const lastEntry = withActual[withActual.length - 1] ?? null;
    const actual = lastEntry?.actualValue != null ? Number(lastEntry.actualValue) : null;
    const totalErrors = entries.reduce((s, e) => s + (Number(e.errorCount) || 0), 0);
    const rawRate = actual != null && kpi.targetValue
      ? calcCompletionRate(actual, Number(kpi.targetValue))
      : null;
    const penaltyLogic = penaltyLogics.find(l => l.id === kpi.penaltyLogicId) ?? null;
    const errorPenalty = rawRate != null ? calculatePenalty(penaltyLogic, totalErrors, rawRate) : 0;
    const adjustedRate = rawRate != null ? Math.max(0, rawRate - errorPenalty) : null;

    return {
      ...kpi,
      bscName: bscCategoryMap[kpi.bscCategoryId] || 'Khác',
      actual,
      totalErrors,
      rawRate,
      errorPenalty,
      adjustedRate,
      penaltyLogicName: penaltyLogic?.name ?? '—',
      _type: 'kpi',
    };
  }), [kpis, allEntries, bscCategoryMap, penaltyLogics]);

  const { bscWeights, totalWeight, rows } = useMemo(() => {
    const groups = {};
    processed.forEach(k => {
      if (!groups[k.bscName]) groups[k.bscName] = [];
      groups[k.bscName].push(k);
    });
    const ordered = BSC_ORDER.filter(b => groups[b])
      .concat(Object.keys(groups).filter(b => !BSC_ORDER.includes(b)));

    const weights = {};
    ordered.forEach(bsc => {
      weights[bsc] = Math.round(
        groups[bsc].reduce((s, k) => s + Number(k.weight || 0), 0) * 100
      ) / 100;
    });
    const total = Math.round(Object.values(weights).reduce((s, w) => s + w, 0) * 100) / 100;

    const result = [];
    ordered.forEach(bsc => {
      groups[bsc].forEach(kpi => result.push(kpi));
      result.push({ id: `sub-${bsc}`, _type: 'subtotal', bscName: bsc });
    });
    result.push({ id: '__total__', _type: 'total' });

    return { bscWeights: weights, totalWeight: total, rows: result };
  }, [processed]);

  const totalCols = 9 + (canManage ? 1 : 0);

  const hiddenCell = (row) =>
    row._type === 'subtotal' || row._type === 'total' ? { colSpan: 0 } : {};

  const columns = [
    {
      title: <span style={thStyle}>BSC</span>,
      key: 'bsc',
      width: 130,
      onCell: (row) => {
        if (row._type === 'subtotal' || row._type === 'total') return { colSpan: totalCols };
        return {};
      },
      render: (_, row) => {
        if (row._type === 'subtotal') {
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tổng {row.bscName}
              </span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#1d4ed8' }}>
                {bscWeights[row.bscName]}%
              </span>
            </div>
          );
        }
        if (row._type === 'total') {
          const color = totalWeight === 100 ? '#16a34a' : '#dc2626';
          return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2px 0' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tổng trọng số
              </span>
              <span style={{ fontSize: 16, fontWeight: 900, color }}>{totalWeight}%</span>
            </div>
          );
        }
        const style = BSC_COLORS[row.bscName] || { color: '#6b7280', background: '#f3f4f6' };
        return (
          <span style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', ...style }}>
            {row.bscName}
          </span>
        );
      },
    },
    {
      title: <span style={thStyle}>Tên KPI</span>,
      key: 'name',
      onCell: hiddenCell,
      render: (_, row) => (
        <span style={{ fontWeight: 600, color: '#111827' }}>{row.name}</span>
      ),
    },
    {
      title: <span style={thStyle}>Giá trị</span>,
      key: 'targetValue',
      width: 90,
      align: 'center',
      onCell: hiddenCell,
      render: (_, row) => (
        <span style={{ color: '#374151', fontWeight: 500 }}>{row.targetValue}</span>
      ),
    },
    {
      title: <span style={thStyle}>Đơn vị</span>,
      key: 'targetUnit',
      width: 80,
      align: 'center',
      onCell: hiddenCell,
      render: (_, row) => (
        <span style={{ color: '#6b7280' }}>{row.targetUnit || '—'}</span>
      ),
    },
    {
      title: <span style={thStyle}>Thực tế</span>,
      key: 'actual',
      width: 90,
      align: 'center',
      onCell: hiddenCell,
      render: (_, row) => row.actual != null
        ? (
          <span style={{ color: '#1d4ed8', fontWeight: 600, background: '#eff6ff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
            {row.actual}
          </span>
        )
        : <span style={{ color: 'rgba(107,114,128,0.5)', fontSize: 11, fontStyle: 'italic' }}>Chưa nhập</span>,
    },
    {
      title: <span style={{ ...thStyle, display: 'block', textAlign: 'center' }}>Số lỗi</span>,
      key: 'errors',
      width: 70,
      align: 'center',
      onCell: hiddenCell,
      render: (_, row) => row.totalErrors > 0
        ? (
          <span style={{ display: 'inline-flex', minWidth: 26, justifyContent: 'center', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2' }}>
            {row.totalErrors}
          </span>
        )
        : <span style={{ color: 'rgba(107,114,128,0.35)', fontSize: 11 }}>—</span>,
    },
    {
      title: <span style={thStyle}>Logic trừ điểm</span>,
      key: 'penalty',
      width: 150,
      onCell: hiddenCell,
      render: (_, row) => (
        <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '3px 8px', borderRadius: 6 }}>
          {row.penaltyLogicName}
        </span>
      ),
    },
    {
      title: <span style={{ ...thStyle, display: 'block', textAlign: 'center' }}>Hoàn thành</span>,
      key: 'completion',
      width: 120,
      align: 'center',
      onCell: hiddenCell,
      render: (_, row) => {
        if (row.adjustedRate == null) return <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 11, fontStyle: 'italic' }}>—</span>;
        const rStyle = getRatingStyle(row.adjustedRate);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ display: 'inline-flex', minWidth: 52, justifyContent: 'center', padding: '3px 12px', borderRadius: 9999, fontSize: 11, fontWeight: 700, ...rStyle }}>
              {row.adjustedRate.toFixed(1)}%
            </span>
            {row.rawRate != null && row.errorPenalty > 0 && (
              <span style={{ fontSize: 10, color: '#9ca3af' }}>
                ({row.rawRate.toFixed(1)}% −{row.errorPenalty.toFixed(1)})
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: <span style={{ ...thStyle, display: 'block', textAlign: 'right' }}>Trọng số</span>,
      key: 'weight',
      width: 80,
      align: 'right',
      onCell: hiddenCell,
      render: (_, row) => (
        <span style={{ color: '#111827', fontWeight: 700, fontSize: 13 }}>{row.weight}%</span>
      ),
    },
    ...(canManage ? [{
      title: '',
      key: 'actions',
      width: 80,
      align: 'center',
      onCell: hiddenCell,
      render: (_, row) => (
        <Space size={4}>
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit?.(row)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete?.(row)} />
        </Space>
      ),
    }] : []),
  ];

  if (!loading && kpis.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
        Không có KPI nào.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="id"
        pagination={false}
        size="small"
        loading={loading}
        onRow={(row) => ({
          style: row._type === 'subtotal'
            ? { background: '#f9fafb', borderTop: '1px solid #e5e7eb' }
            : row._type === 'total'
              ? { background: '#f0f9ff', borderTop: '2px solid #bfdbfe' }
              : {},
        })}
      />
    </div>
  );
};

export default KpiSystemTable;
