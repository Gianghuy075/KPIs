import { useState, useEffect, useMemo } from 'react';
import { Input, Button, Tabs, Table, message, Spin } from 'antd';
import { Save } from 'lucide-react';
import workshopKpiService from '../../services/workshopKpiService';

const COLORS = {
  success: '#16a34a',
  successBg: 'rgba(22,163,74,0.1)',
  warning: '#d97706',
  warningBg: 'rgba(217,119,6,0.1)',
  danger: '#dc2626',
  dangerBg: 'rgba(220,38,38,0.1)',
  muted: '#6b7280',
  mutedBg: 'rgba(107,114,128,0.1)',
  foreground: '#1a1f2e',
  card: '#ffffff',
  border: '#e2e5ef',
};

const bscColorMap = {
  'Tài chính': { color: '#1d4ed8', background: 'rgba(59,130,246,0.1)' },
  'Khách hàng': { color: '#15803d', background: 'rgba(16,185,129,0.1)' },
  'Quy trình nội bộ': { color: '#b45309', background: 'rgba(245,158,11,0.1)' },
  'Học hỏi & Phát triển': { color: '#7c3aed', background: 'rgba(168,85,247,0.1)' },
};

const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];

const emptyEntry = () => ({ actualValue: '', errorCount: 0, note: '' });

const computeRowSpans = (items) => {
  const spans = {};
  let i = 0;
  while (i < items.length) {
    let j = i;
    while (j < items.length && items[j].bsc === items[i].bsc) j++;
    spans[items[i].id] = j - i;
    for (let k = i + 1; k < j; k++) spans[items[k].id] = 0;
    i = j;
  }
  return spans;
};

const DataEntryView = ({ kpis, bscCategoryMap, year }) => {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [activeDate, setActiveDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const [monthlyEntries, setMonthlyEntries] = useState({});
  const [dailyEntries, setDailyEntries] = useState({});
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [savingMonth, setSavingMonth] = useState(false);
  const [savingDay, setSavingDay] = useState(false);

  const flatRows = useMemo(() => {
    const enriched = kpis.map(k => ({ ...k, bsc: bscCategoryMap?.[k.bscCategoryId] || 'Khác' }));
    const bscOrder = ['Tài chính', 'Khách hàng', 'Quy trình nội bộ', 'Học hỏi & Phát triển'];
    return enriched.sort((a, b) => {
      const ai = bscOrder.indexOf(a.bsc);
      const bi = bscOrder.indexOf(b.bsc);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [kpis, bscCategoryMap]);

  const bscSpans = useMemo(() => computeRowSpans(flatRows), [flatRows]);

  useEffect(() => {
    if (!kpis?.length) { setLoadingEntries(false); return; }
    setLoadingEntries(true);
    Promise.all(kpis.map(async (k) => {
      const entries = await workshopKpiService.getMonthlyEntries(k.id);
      const map = {};
      entries.forEach((e, i) => { map[i] = { actualValue: e.actualValue ?? '', errorCount: e.errorCount ?? 0, note: e.note ?? '' }; });
      return [k.id, map];
    })).then(results => {
      const init = {};
      results.forEach(([id, map]) => { init[id] = map; });
      setMonthlyEntries(init);
    }).catch(() => message.error('Không thể tải dữ liệu nhập liệu'))
      .finally(() => setLoadingEntries(false));
  }, [kpis]);

  useEffect(() => {
    if (!kpis?.length || !activeDate) return;
    setLoadingDaily(true);
    Promise.all(kpis.map(async (k) => {
      try {
        const entry = await workshopKpiService.getDailyEntry(k.id, activeDate);
        return [k.id, { actualValue: entry.actualValue ?? '', errorCount: entry.errorCount ?? 0, note: entry.note ?? '' }];
      } catch {
        return [k.id, emptyEntry()];
      }
    })).then(results => {
      const map = {};
      results.forEach(([id, entry]) => { map[id] = entry; });
      setDailyEntries(map);
    }).finally(() => setLoadingDaily(false));
  }, [kpis, activeDate]);

  const getMonthEntry = (kpiId, monthIdx) => monthlyEntries[kpiId]?.[monthIdx] ?? emptyEntry();
  const getDailyEntry = (kpiId) => dailyEntries[kpiId] ?? emptyEntry();

  const updateMonthEntry = (kpiId, monthIdx, field, value) => {
    setMonthlyEntries(prev => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], [monthIdx]: { ...getMonthEntry(kpiId, monthIdx), [field]: value } },
    }));
  };

  const updateDailyEntry = (kpiId, field, value) => {
    setDailyEntries(prev => ({
      ...prev,
      [kpiId]: { ...prev[kpiId], [field]: value },
    }));
  };

  const handleSaveMonth = async () => {
    setSavingMonth(true);
    try {
      await Promise.all(flatRows.map(row => {
        const entry = getMonthEntry(row.id, activeMonth);
        return workshopKpiService.updateMonthlyEntry(row.id, activeMonth + 1, {
          actualValue: entry.actualValue !== '' ? Number(entry.actualValue) : null,
          errorCount: entry.errorCount || 0,
          note: entry.note || '',
        });
      }));
      message.success(`Đã lưu dữ liệu tháng ${activeMonth + 1}/${year}`);
    } catch {
      message.error('Lưu thất bại, vui lòng thử lại');
    } finally {
      setSavingMonth(false);
    }
  };

  const handleSaveDay = async () => {
    setSavingDay(true);
    try {
      await Promise.all(flatRows.map(row => {
        const entry = getDailyEntry(row.id);
        return workshopKpiService.updateDailyEntry(row.id, activeDate, {
          actualValue: entry.actualValue !== '' ? Number(entry.actualValue) : null,
          errorCount: entry.errorCount || 0,
          note: entry.note || '',
        });
      }));
      message.success(`Đã lưu dữ liệu ngày ${activeDate}`);
    } catch {
      message.error('Lưu thất bại, vui lòng thử lại');
    } finally {
      setSavingDay(false);
    }
  };

  const getQuarterAgg = (kpiId, qIdx) => {
    const startMonth = qIdx * 3;
    const entries = [0, 1, 2].map(i => getMonthEntry(kpiId, startMonth + i));
    return {
      value: entries.filter(e => e.actualValue).pop()?.actualValue || '—',
      totalErrors: entries.reduce((s, e) => s + (e.errorCount || 0), 0),
    };
  };

  const getYearAgg = (kpiId) => {
    const entries = Array.from({ length: 12 }, (_, i) => getMonthEntry(kpiId, i));
    return {
      value: entries.filter(e => e.actualValue).pop()?.actualValue || '—',
      totalErrors: entries.reduce((s, e) => s + (e.errorCount || 0), 0),
    };
  };

  const bscCell = (bsc) => (
    <span style={{ display: 'inline-flex', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500, ...(bscColorMap[bsc] || {}) }}>{bsc}</span>
  );

  const cardStyle = { background: COLORS.card, borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: `1px solid ${COLORS.border}`, overflow: 'hidden' };
  const cardHeaderStyle = { padding: '10px 24px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' };

  const dailyColumns = [
    { title: 'BSC', dataIndex: 'bsc', width: '14%', onCell: row => ({ rowSpan: bscSpans[row.id] }), render: val => bscCell(val) },
    { title: 'Tên KPI', dataIndex: 'name', width: '24%', render: val => <span style={{ fontWeight: 500, color: COLORS.foreground, fontSize: 13 }}>{val}</span> },
    { title: 'Mục tiêu', width: '10%', align: 'center', render: (_, row) => <span style={{ color: COLORS.muted, fontSize: 13 }}>{row.targetValue} {row.targetUnit}</span> },
    {
      title: 'Giá trị thực tế', width: '16%',
      render: (_, row) => (
        <Input value={getDailyEntry(row.id).actualValue} size="small" placeholder="Nhập giá trị..."
          onChange={e => updateDailyEntry(row.id, 'actualValue', e.target.value)} />
      ),
    },
    {
      title: 'Số lỗi', width: '14%', align: 'center',
      render: (_, row) => (
        <Input type="number" min={0} value={getDailyEntry(row.id).errorCount || ''} size="small"
          placeholder="0" style={{ textAlign: 'center' }}
          onChange={e => updateDailyEntry(row.id, 'errorCount', Math.max(0, Number(e.target.value)))} />
      ),
    },
    {
      title: 'Ghi chú', width: '22%',
      render: (_, row) => (
        <Input value={getDailyEntry(row.id).note} size="small" placeholder="Ghi chú..."
          onChange={e => updateDailyEntry(row.id, 'note', e.target.value)} />
      ),
    },
  ];

  const monthlyColumns = [
    { title: 'BSC', dataIndex: 'bsc', width: '14%', onCell: row => ({ rowSpan: bscSpans[row.id] }), render: val => bscCell(val) },
    { title: 'Tên KPI', dataIndex: 'name', width: '24%', render: val => <span style={{ fontWeight: 500, color: COLORS.foreground, fontSize: 13 }}>{val}</span> },
    { title: 'Mục tiêu', width: '10%', align: 'center', render: (_, row) => <span style={{ color: COLORS.muted, fontSize: 13 }}>{row.targetValue} {row.targetUnit}</span> },
    {
      title: 'Giá trị thực tế', width: '16%',
      render: (_, row) => (
        <Input value={getMonthEntry(row.id, activeMonth).actualValue} size="small" placeholder="Nhập giá trị..."
          onChange={e => updateMonthEntry(row.id, activeMonth, 'actualValue', e.target.value)} />
      ),
    },
    {
      title: 'Số lỗi', width: '14%', align: 'center',
      render: (_, row) => (
        <Input type="number" min={0} value={getMonthEntry(row.id, activeMonth).errorCount || ''} size="small"
          placeholder="0" style={{ textAlign: 'center' }}
          onChange={e => updateMonthEntry(row.id, activeMonth, 'errorCount', Math.max(0, Number(e.target.value)))} />
      ),
    },
    {
      title: 'Ghi chú', width: '22%',
      render: (_, row) => (
        <Input value={getMonthEntry(row.id, activeMonth).note} size="small" placeholder="Ghi chú..."
          onChange={e => updateMonthEntry(row.id, activeMonth, 'note', e.target.value)} />
      ),
    },
  ];

  const quarterlyColumns = [
    { title: 'BSC', dataIndex: 'bsc', width: '14%', onCell: row => ({ rowSpan: bscSpans[row.id] }), render: val => bscCell(val) },
    { title: 'Tên KPI', dataIndex: 'name', width: '26%', render: val => <span style={{ fontWeight: 500, color: COLORS.foreground, fontSize: 13 }}>{val}</span> },
    ...quarterNames.map((q, qIdx) => ({
      title: q, key: `q${qIdx}`, align: 'center',
      render: (_, row) => {
        const agg = getQuarterAgg(row.id, qIdx);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 12, color: COLORS.muted }}>{agg.value}</span>
            <span style={{ display: 'inline-flex', padding: '1px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, ...(agg.totalErrors > 0 ? { color: COLORS.danger, background: COLORS.dangerBg } : { color: COLORS.muted, background: COLORS.mutedBg }) }}>
              {agg.totalErrors > 0 ? `${agg.totalErrors} lỗi` : '—'}
            </span>
          </div>
        );
      },
    })),
  ];

  const yearlyColumns = [
    { title: 'BSC', dataIndex: 'bsc', width: '14%', onCell: row => ({ rowSpan: bscSpans[row.id] }), render: val => bscCell(val) },
    { title: 'Tên KPI', dataIndex: 'name', width: '30%', render: val => <span style={{ fontWeight: 500, color: COLORS.foreground, fontSize: 13 }}>{val}</span> },
    { title: 'Mục tiêu', width: '14%', align: 'center', render: (_, row) => <span style={{ color: COLORS.muted, fontSize: 13 }}>{row.targetValue} {row.targetUnit}</span> },
    {
      title: 'Giá trị thực tế', width: '14%', align: 'center',
      render: (_, row) => <span style={{ fontSize: 14, fontWeight: 500 }}>{getYearAgg(row.id).value}</span>,
    },
    {
      title: 'Tổng lỗi', width: '14%', align: 'center',
      render: (_, row) => {
        const yr = getYearAgg(row.id);
        return <span style={{ display: 'inline-flex', padding: '1px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, ...(yr.totalErrors > 0 ? { color: COLORS.danger, background: COLORS.dangerBg } : { color: COLORS.muted, background: COLORS.mutedBg }) }}>{yr.totalErrors}</span>;
      },
    },
    {
      title: 'Trạng thái', width: '14%', align: 'center',
      render: (_, row) => {
        const yr = getYearAgg(row.id);
        const status = yr.totalErrors === 0 ? 'Tốt' : yr.totalErrors <= 3 ? 'Chấp nhận' : 'Cần cải thiện';
        const style = yr.totalErrors === 0 ? { color: COLORS.success, background: COLORS.successBg } : yr.totalErrors <= 3 ? { color: COLORS.warning, background: COLORS.warningBg } : { color: COLORS.danger, background: COLORS.dangerBg };
        return <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 500, ...style }}>{status}</span>;
      },
    },
  ];

  if (loadingEntries) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  const tabItems = [
    {
      key: 'daily', label: 'Nhập theo Ngày',
      children: (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: COLORS.muted }}>Ngày:</span>
            <Input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)} style={{ width: 180 }} size="small" />
          </div>
          {loadingDaily ? <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div> : (
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.foreground, margin: 0 }}>Nhập liệu ngày {activeDate.split('-').reverse().join('/')}</h3>
                <Button type="primary" size="small" icon={<Save size={14} />} loading={savingDay} onClick={handleSaveDay}>Lưu</Button>
              </div>
              <Table columns={dailyColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'monthly', label: 'Nhập theo Tháng',
      children: (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {monthNames.map((m, i) => (
              <Button key={m} type={activeMonth === i ? 'primary' : 'default'} size="small" onClick={() => setActiveMonth(i)} style={{ fontSize: 12, padding: '0 12px' }}>{m}</Button>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.foreground, margin: 0 }}>Nhập liệu tháng {activeMonth + 1}/{year}</h3>
              <Button type="primary" size="small" icon={<Save size={14} />} loading={savingMonth} onClick={handleSaveMonth}>Lưu</Button>
            </div>
            <Table columns={monthlyColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" />
          </div>
        </div>
      ),
    },
    {
      key: 'quarterly-view', label: 'Tổng hợp Quý',
      children: (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.foreground, margin: 0 }}>Tổng hợp theo Quý</h3></div>
          <Table columns={quarterlyColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" />
        </div>
      ),
    },
    {
      key: 'yearly-view', label: 'Tổng hợp Năm',
      children: (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}><h3 style={{ fontSize: 14, fontWeight: 600, color: COLORS.foreground, margin: 0 }}>Tổng hợp Năm</h3></div>
          <Table columns={yearlyColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: COLORS.muted }}>Năm: <strong style={{ color: COLORS.foreground }}>{year}</strong></span>
      </div>
      <Tabs defaultActiveKey="daily" items={tabItems} style={{ marginBottom: 24 }} />
    </div>
  );
};

export default DataEntryView;
