import { useState } from 'react';
import { Input, Button, Table } from 'antd';
import { Pencil, Check, X } from 'lucide-react';
import { KPI_COLORS } from '../../constants/uiTokens';

const WorkshopKpiTable = ({ title, items, onUpdate, onPeriodTarget }) => {
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValues({ targetValue: item.targetValue, targetUnit: item.targetUnit, weight: item.weight });
  };

  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const saveEdit = (id) => {
    onUpdate(id, editValues);
    setEditingId(null);
    setEditValues({});
  };

  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);

  const columns = [
    {
      title: 'Tên KPI', dataIndex: 'name', width: '28%',
      render: (val) => <span style={{ fontWeight: 500, color: KPI_COLORS.foreground }}>{val}</span>,
    },
    {
      title: 'Giá trị', dataIndex: 'targetValue', width: '12%',
      render: (val, item) => editingId === item.id ? (
        <Input value={editValues.targetValue ?? ''} size="small"
          onChange={(e) => setEditValues(v => ({ ...v, targetValue: e.target.value }))} />
      ) : (
        <span style={{ fontWeight: 500, color: KPI_COLORS.foreground }}>{val}</span>
      ),
    },
    {
      title: 'Đơn vị', dataIndex: 'targetUnit', width: '10%',
      render: (val, item) => editingId === item.id ? (
        <Input value={editValues.targetUnit ?? ''} size="small"
          onChange={(e) => setEditValues(v => ({ ...v, targetUnit: e.target.value }))} />
      ) : (
        <span style={{ color: KPI_COLORS.muted }}>{val}</span>
      ),
    },
    {
      title: 'Trọng số (%)', dataIndex: 'weight', width: '12%', align: 'right',
      render: (val, item) => editingId === item.id ? (
        <Input type="number" min={0} max={100} value={editValues.weight ?? 0} size="small"
          onChange={(e) => setEditValues(v => ({ ...v, weight: Number(e.target.value) }))}
          style={{ textAlign: 'right' }} />
      ) : (
        <span style={{ fontWeight: 500, color: KPI_COLORS.foreground }}>{val}%</span>
      ),
    },
    {
      title: 'Thao tác', key: 'action', width: '20%', align: 'center',
      render: (_, item) => editingId === item.id ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Button type="text" size="small" icon={<Check size={16} style={{ color: KPI_COLORS.success }} />} onClick={() => saveEdit(item.id)} />
          <Button type="text" size="small" icon={<X size={16} style={{ color: KPI_COLORS.danger }} />} onClick={cancelEdit} />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Button type="text" size="small" icon={<Pencil size={16} style={{ color: KPI_COLORS.muted }} />} onClick={() => startEdit(item)} />
          {onPeriodTarget && (
            <Button type="text" size="small" style={{ fontSize: 12, color: KPI_COLORS.primary }}
              onClick={() => onPeriodTarget(item)}>
              Chia mục tiêu
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ background: KPI_COLORS.card, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${KPI_COLORS.border}` }}>
      <div style={{ padding: '12px 24px', borderBottom: `1px solid ${KPI_COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: KPI_COLORS.foreground, margin: 0 }}>KPI - {title}</h3>
        <span style={{ fontSize: 14, color: KPI_COLORS.muted }}>
          Tổng trọng số:{' '}
          <span style={{ fontWeight: 600, color: totalWeight === 100 ? KPI_COLORS.success : KPI_COLORS.danger }}>{totalWeight}%</span>
        </span>
      </div>
      <Table columns={columns} dataSource={items} rowKey="id" pagination={false} size="small" />
    </div>
  );
};

export default WorkshopKpiTable;
