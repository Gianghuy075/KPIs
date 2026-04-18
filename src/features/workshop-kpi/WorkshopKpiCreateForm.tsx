import { useState } from 'react';
import { Input, Button, Checkbox, Select, Table, message } from 'antd';
import { Plus, Trash2, Send } from 'lucide-react';
import { BSC_COLORS } from '../../constants/bsc';
import { KPI_COLORS } from '../../constants/uiTokens';
import { getCurrentYear, getYearRange } from '../../constants/year';

const WorkshopKpiCreateForm = ({ workshops, bscCategories, years, penaltyLogics, onCreateKpi }) => {
  const defaultBscId = bscCategories[0]?.id ?? '';
  const currentYear = getCurrentYear();
  const yearList = years?.length ? years : getYearRange(currentYear);

  const [formYear, setFormYear] = useState(String(yearList[0]));
  const [selectedWorkshopIds, setSelectedWorkshopIds] = useState(workshops[0] ? [workshops[0].id] : []);
  const [selectAll, setSelectAll] = useState(false);
  const [rows, setRows] = useState([{
    tempId: `tmp-${Date.now()}`,
    bscCategoryId: defaultBscId,
    name: '',
    targetValue: '',
    targetUnit: '',
    weight: 5,
    penaltyLogicId: penaltyLogics[0]?.id ?? '',
  }]);

  const toggleWorkshop = (id) => {
    setSelectedWorkshopIds(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setSelectedWorkshopIds(checked ? workshops.map(w => w.id) : []);
  };

  const updateRow = (tempId, field, value) => {
    setRows(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, {
      tempId: `tmp-${Date.now()}`,
      bscCategoryId: defaultBscId,
      name: '',
      targetValue: '',
      targetUnit: '',
      weight: 5,
      penaltyLogicId: penaltyLogics[0]?.id ?? '',
    }]);
  };

  const removeRow = (tempId) => setRows(prev => prev.filter(r => r.tempId !== tempId));

  const handleSubmitAll = () => {
    const validRows = rows.filter(r => r.name.trim() && r.targetValue.toString().trim());
    if (validRows.length === 0) { message.error('Vui lòng nhập ít nhất 1 KPI có tên và mục tiêu'); return; }
    if (selectedWorkshopIds.length === 0) { message.error('Vui lòng chọn ít nhất 1 phân xưởng'); return; }

    validRows.forEach(row => {
      onCreateKpi(
        { bscCategoryId: row.bscCategoryId, name: row.name.trim(), targetValue: row.targetValue, targetUnit: row.targetUnit.trim(), weight: row.weight, penaltyLogicId: row.penaltyLogicId },
        selectedWorkshopIds,
        formYear
      );
    });

    message.success(`Đã tạo ${validRows.length} KPI cho ${selectedWorkshopIds.length} phân xưởng`);
    setRows([{ tempId: `tmp-${Date.now()}`, bscCategoryId: defaultBscId, name: '', targetValue: '', targetUnit: '', weight: 5, penaltyLogicId: penaltyLogics[0]?.id ?? '' }]);
  };

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
  const filledCount = rows.filter(r => r.name.trim() && r.targetValue.toString().trim()).length;

  const bscOptions = bscCategories.map(c => ({
    value: c.id,
    label: (
      <span style={{ display: 'inline-flex', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 500, ...(BSC_COLORS[c.name] || {}) }}>
        {c.name}
      </span>
    ),
  }));

  const penaltyOptions = penaltyLogics.map(pl => ({ value: pl.id, label: <span style={{ fontSize: 12 }}>{pl.name}</span> }));
  const yearOptions = yearList.map(y => ({ value: String(y), label: String(y) }));

  const columns = [
    {
      title: 'Viễn cảnh BSC', dataIndex: 'bscCategoryId', width: 180,
      render: (val, row) => (
        <Select value={val} onChange={v => updateRow(row.tempId, 'bscCategoryId', v)}
          options={bscOptions} size="small" style={{ width: '100%' }} variant="borderless" />
      ),
    },
    {
      title: 'Tên KPI', dataIndex: 'name',
      render: (val, row) => (
        <Input size="small" value={val} onChange={e => updateRow(row.tempId, 'name', e.target.value)}
          placeholder="Nhập tên KPI..." variant="borderless" />
      ),
    },
    {
      title: 'Giá trị', dataIndex: 'targetValue', width: 110,
      render: (val, row) => (
        <Input size="small" value={val} onChange={e => updateRow(row.tempId, 'targetValue', e.target.value)}
          placeholder="VD: 500" variant="borderless" />
      ),
    },
    {
      title: 'Đơn vị', dataIndex: 'targetUnit', width: 110,
      render: (val, row) => (
        <Input size="small" value={val} onChange={e => updateRow(row.tempId, 'targetUnit', e.target.value)}
          placeholder="VD: tấn, %, giờ" variant="borderless" />
      ),
    },
    {
      title: 'Trọng số (%)', dataIndex: 'weight', width: 90, align: 'center',
      render: (val, row) => (
        <Input size="small" type="number" min={1} max={100} value={val}
          onChange={e => updateRow(row.tempId, 'weight', Math.max(1, Math.min(100, Number(e.target.value))))}
          style={{ textAlign: 'center' }} variant="borderless" />
      ),
    },
    {
      title: 'Logic trừ điểm', dataIndex: 'penaltyLogicId', width: 180,
      render: (val, row) => (
        <Select value={val} onChange={v => updateRow(row.tempId, 'penaltyLogicId', v)}
          options={penaltyOptions} size="small" style={{ width: '100%' }} placeholder="Chọn..." variant="borderless" />
      ),
    },
    {
      title: '', key: 'action', width: 50, align: 'center',
      render: (_, row) => rows.length > 1 ? (
        <Button type="text" size="small" icon={<Trash2 size={14} />}
          onClick={() => removeRow(row.tempId)} style={{ color: KPI_COLORS.danger }} />
      ) : null,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: KPI_COLORS.muted }}>Năm</label>
          <Select value={formYear} onChange={setFormYear} options={yearOptions} style={{ width: 110 }} size="small" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: KPI_COLORS.muted }}>Phân xưởng</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
              <Checkbox id="sel-all" checked={selectAll} onChange={e => handleSelectAll(e.target.checked)} />
              <label htmlFor="sel-all" style={{ fontSize: 12, color: KPI_COLORS.muted, cursor: 'pointer' }}>Tất cả</label>
            </div>
            {workshops.map(ws => {
              const active = selectedWorkshopIds.includes(ws.id);
              return (
                <div key={ws.id} onClick={() => toggleWorkshop(ws.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, border: `1px solid ${active ? KPI_COLORS.primary : KPI_COLORS.border}`, background: active ? KPI_COLORS.primaryBg : 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: active ? KPI_COLORS.foreground : KPI_COLORS.muted }}>
                  <Checkbox checked={active} style={{ pointerEvents: 'none' }} />
                  {ws.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ background: KPI_COLORS.card, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${KPI_COLORS.border}`, overflow: 'hidden' }}>
        <Table columns={columns} dataSource={rows} rowKey="tempId" pagination={false} size="small"
          footer={() => (
            <Button type="text" size="small" icon={<Plus size={14} />} onClick={addRow}
              style={{ width: '100%', color: KPI_COLORS.muted, fontSize: 12 }}>
              Thêm dòng KPI
            </Button>
          )} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: totalWeight === 100 ? KPI_COLORS.success : KPI_COLORS.warning }}>
          Tổng trọng số: {totalWeight}%
          {totalWeight !== 100 && <span style={{ fontSize: 12, fontWeight: 400, color: KPI_COLORS.muted, marginLeft: 4 }}>(nên = 100%)</span>}
        </span>
        <Button type="primary" icon={<Send size={16} />} onClick={handleSubmitAll} disabled={filledCount === 0}>
          Tạo {filledCount > 0 ? `${filledCount} KPI` : 'KPI'}
        </Button>
      </div>
    </div>
  );
};

export default WorkshopKpiCreateForm;
