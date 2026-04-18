import { useState, useEffect } from 'react';
import { Table, Input, Button, Select, message, Spin } from 'antd';
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react';
import penaltyService from '../../services/penaltyService';
import { calculatePenalty } from '../../utils/penaltyUtils';
import { PENALTY_TYPE_LABELS, PENALTY_TYPE_STYLES } from '../../constants/penalty';
import { KPI_COLORS } from '../../constants/uiTokens';

const renderParamInfo = (logic) => {
  switch (logic.type) {
    case 'fixed': return `${logic.fixedPoints ?? 1} điểm/lỗi`;
    case 'percentage': return `${logic.percentPerError ?? 1}%/lỗi`;
    case 'tiered': return logic.tiers?.map(t => `${t.minErrors}-${t.maxErrors}: ${t.deduction}đ`).join(', ') || '—';
    case 'cap': return `${logic.fixedPoints ?? 1}đ/lỗi (max ${logic.maxDeduction ?? 0}đ)`;
    default: return '—';
  }
};

const renderEditParams = (values, onChange) => {
  const type = values.type || 'fixed';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {(type === 'fixed' || type === 'cap') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: KPI_COLORS.muted }}>Điểm/lỗi:</span>
          <Input type="number" min={0} value={values.fixedPoints ?? 1}
            onChange={(e) => onChange({ ...values, fixedPoints: Number(e.target.value) })}
            style={{ height: 28, width: 64, fontSize: 12 }} />
        </div>
      )}
      {type === 'percentage' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: KPI_COLORS.muted }}>%/lỗi:</span>
          <Input type="number" min={0} max={100} value={values.percentPerError ?? 1}
            onChange={(e) => onChange({ ...values, percentPerError: Number(e.target.value) })}
            style={{ height: 28, width: 64, fontSize: 12 }} />
        </div>
      )}
      {type === 'cap' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: KPI_COLORS.muted }}>Max:</span>
          <Input type="number" min={0} value={values.maxDeduction ?? 20}
            onChange={(e) => onChange({ ...values, maxDeduction: Number(e.target.value) })}
            style={{ height: 28, width: 64, fontSize: 12 }} />
        </div>
      )}
    </div>
  );
};

const renderPreview = (logic) => {
  const testErrors = [1, 3, 5, 10];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
      {testErrors.map((e) => {
        const penalty = calculatePenalty(logic, e, 100);
        return (
          <span key={e} style={{ color: KPI_COLORS.muted }}>
            {e} lỗi → <span style={{ fontWeight: 600, color: KPI_COLORS.danger }}>-{penalty}đ</span>
          </span>
        );
      })}
    </div>
  );
};

const PenaltyLogicManager = () => {
  const [logics, setLogics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const [newLogic, setNewLogic] = useState({ name: '', description: '', type: 'fixed', fixedPoints: 1 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    penaltyService.list()
      .then(setLogics)
      .catch(() => message.error('Không thể tải danh sách logic trừ điểm'))
      .finally(() => setLoading(false));
  }, []);

  const startEdit = (logic) => { setEditingId(logic.id); setEditValues({ ...logic }); };
  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const updated = await penaltyService.update(editingId, editValues);
      setLogics(logics.map(l => l.id === editingId ? updated : l));
      message.success('Đã cập nhật logic trừ điểm');
      cancelEdit();
    } catch {
      message.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newLogic.name?.trim()) { message.error('Vui lòng nhập tên logic'); return; }
    setSaving(true);
    try {
      const created = await penaltyService.create(newLogic);
      setLogics([...logics, created]);
      message.success('Đã thêm logic trừ điểm mới');
      setIsAdding(false);
      setNewLogic({ name: '', description: '', type: 'fixed', fixedPoints: 1 });
    } catch {
      message.error('Thêm mới thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await penaltyService.remove(id);
      setLogics(logics.filter(l => l.id !== id));
      message.success('Đã xóa logic trừ điểm');
    } catch {
      message.error('Xóa thất bại');
    }
  };

  const typeOptions = Object.entries(PENALTY_TYPE_LABELS).map(([k, v]) => ({ value: k, label: v }));

  const columns = [
    {
      title: 'Tên', key: 'name', width: '20%',
      render: (_, record) => editingId === record.id ? (
        <Input value={editValues.name ?? ''}
          onChange={(e) => setEditValues(v => ({ ...v, name: e.target.value }))}
          style={{ height: 32, fontSize: 14 }} />
      ) : (
        <span style={{ fontWeight: 500, color: KPI_COLORS.foreground }}>{record.name}</span>
      ),
    },
    {
      title: 'Loại', key: 'type', width: '12%',
      render: (_, record) => editingId === record.id ? (
        <Select value={editValues.type} onChange={(v) => setEditValues(ev => ({ ...ev, type: v }))}
          options={typeOptions} style={{ width: '100%' }} size="small" />
      ) : (
        <span style={{ ...PENALTY_TYPE_STYLES[record.type], display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500 }}>
          {PENALTY_TYPE_LABELS[record.type]}
        </span>
      ),
    },
    {
      title: 'Thông số', key: 'params', width: '15%',
      render: (_, record) => editingId === record.id
        ? renderEditParams(editValues, setEditValues)
        : <span style={{ fontSize: 14, color: KPI_COLORS.muted }}>{renderParamInfo(record)}</span>,
    },
    {
      title: 'Mô tả', key: 'description', width: '25%',
      render: (_, record) => editingId === record.id ? (
        <Input value={editValues.description ?? ''}
          onChange={(e) => setEditValues(v => ({ ...v, description: e.target.value }))}
          style={{ height: 32, fontSize: 14 }} />
      ) : (
        <span style={{ fontSize: 14, color: KPI_COLORS.muted }}>{record.description}</span>
      ),
    },
    {
      title: 'Xem trước (100% hoàn thành)', key: 'preview', width: '20%',
      render: (_, record) => renderPreview(editingId === record.id ? editValues : record),
    },
    {
      title: 'Thao tác', key: 'actions', width: '8%', align: 'center',
      render: (_, record) => editingId === record.id ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Button type="text" size="small" loading={saving}
            icon={<Check style={{ color: KPI_COLORS.success }} size={16} />} onClick={saveEdit} />
          <Button type="text" size="small"
            icon={<X style={{ color: KPI_COLORS.danger }} size={16} />} onClick={cancelEdit} />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Button type="text" size="small"
            icon={<Pencil style={{ color: KPI_COLORS.muted }} size={16} />} onClick={() => startEdit(record)} />
          <Button type="text" size="small"
            icon={<Trash2 style={{ color: KPI_COLORS.danger }} size={16} />} onClick={() => handleDelete(record.id)} />
        </div>
      ),
    },
  ];

  const addingColumns = [
    {
      title: 'Tên', key: 'name', width: '20%',
      render: () => (
        <Input value={newLogic.name ?? ''} placeholder="Tên logic..."
          onChange={(e) => setNewLogic(v => ({ ...v, name: e.target.value }))}
          style={{ height: 32, fontSize: 14 }} />
      ),
    },
    {
      title: 'Loại', key: 'type', width: '12%',
      render: () => (
        <Select value={newLogic.type} onChange={(v) => setNewLogic(ev => ({ ...ev, type: v }))}
          options={typeOptions} style={{ width: '100%' }} size="small" />
      ),
    },
    { title: 'Thông số', key: 'params', width: '15%', render: () => renderEditParams(newLogic, setNewLogic) },
    {
      title: 'Mô tả', key: 'description', width: '25%',
      render: () => (
        <Input value={newLogic.description ?? ''} placeholder="Mô tả..."
          onChange={(e) => setNewLogic(v => ({ ...v, description: e.target.value }))}
          style={{ height: 32, fontSize: 14 }} />
      ),
    },
    { title: 'Xem trước', key: 'preview', width: '20%', render: () => renderPreview(newLogic) },
    {
      title: 'Thao tác', key: 'actions', width: '8%', align: 'center',
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Button type="text" size="small" loading={saving}
            icon={<Check style={{ color: KPI_COLORS.success }} size={16} />} onClick={handleAdd} />
          <Button type="text" size="small"
            icon={<X style={{ color: KPI_COLORS.danger }} size={16} />} onClick={() => setIsAdding(false)} />
        </div>
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: KPI_COLORS.foreground, margin: 0 }}>Logic trừ điểm / Tính lỗi</h3>
          <p style={{ fontSize: 14, color: KPI_COLORS.muted, margin: '4px 0 0' }}>Quản lý các quy tắc trừ điểm KPI khi có lỗi. Gán logic cho từng KPI khi tạo mới.</p>
        </div>
        <Button type="primary" size="small" icon={<Plus size={16} />}
          onClick={() => setIsAdding(true)} disabled={isAdding}>
          Thêm logic
        </Button>
      </div>

      <div style={{ background: KPI_COLORS.card, borderRadius: 8, border: `1px solid ${KPI_COLORS.border}`, overflow: 'hidden' }}>
        <Table columns={columns} dataSource={logics} rowKey="id" pagination={false} size="small" />
        {isAdding && (
          <Table columns={addingColumns} dataSource={[{ id: '__adding__' }]} rowKey="id"
            pagination={false} showHeader={false} size="small"
            style={{ background: KPI_COLORS.primaryBg }} />
        )}
      </div>
    </div>
  );
};

export default PenaltyLogicManager;
