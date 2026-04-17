import { useState, useEffect, useCallback } from 'react';
import { Table, Input, Button, Tabs, message, Spin } from 'antd';
import { Calendar, BarChart3, Clock, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import workshopKpiService from '../../services/workshopKpiService';

const COLORS = {
  success: '#16a34a',
  successBg: 'rgba(22,163,74,0.1)',
  warning: '#d97706',
  warningBg: 'rgba(217,119,6,0.1)',
  danger: '#dc2626',
  dangerBg: 'rgba(220,38,38,0.1)',
  primary: '#3b5fc4',
  primaryBg: 'rgba(59,95,196,0.08)',
  muted: '#6b7280',
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

const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

const emptyPeriodTargets = () => ({ quarterly: {}, monthly: {}, daily: {} });

const parseNum = (v) => parseFloat(String(v).replace(/,/g, '')) || 0;
const fmtNum = (n) => n % 1 === 0 ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 2 });

const distributeEvenly = (total, n) => {
  if (total === 0 || n === 0) return Array(n).fill('');
  const base = Math.floor((total / n) * 100) / 100;
  const remainder = Math.round((total - base * n) * 100) / 100;
  return Array.from({ length: n }, (_, i) => fmtNum(i === 0 ? base + remainder : base));
};

const PeriodTargetEditor = ({ kpis, bscCategoryMap, year }) => {
  const [local, setLocal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeDate, setActiveDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!kpis?.length) { setLoading(false); return; }
    const fetchAll = async () => {
      const init = {};
      await Promise.all(kpis.map(async (item) => {
        try {
          const [quarterly, monthly] = await Promise.all([
            workshopKpiService.getPeriodTargets(item.id, 'quarterly'),
            workshopKpiService.getPeriodTargets(item.id, 'monthly'),
          ]);
          const qMap = {};
          quarterly.forEach((t, i) => { qMap[i] = t.targetValue != null ? fmtNum(t.targetValue) : ''; });
          const mMap = {};
          monthly.forEach((t, i) => { mMap[i] = t.targetValue != null ? fmtNum(t.targetValue) : ''; });
          init[item.id] = { quarterly: qMap, monthly: mMap, daily: {} };
        } catch {
          const yearVal = parseNum(item.targetValue);
          const qParts = distributeEvenly(yearVal, 4);
          const qMap = {};
          const mMap = {};
          qParts.forEach((qv, qi) => {
            qMap[qi] = qv;
            distributeEvenly(parseNum(qv), 3).forEach((mv, mi) => { mMap[qi * 3 + mi] = mv; });
          });
          init[item.id] = { quarterly: qMap, monthly: mMap, daily: {} };
        }
      }));
      setLocal(init);
      setLoading(false);
    };
    fetchAll();
  }, [kpis]);

  const getLocal = (id) => local[id] ?? emptyPeriodTargets();

  const updateLocal = useCallback((id, updater) => {
    setLocal(prev => ({ ...prev, [id]: updater(prev[id] ?? emptyPeriodTargets()) }));
  }, []);

  const handleQuarterChange = (item, qi, value) => {
    updateLocal(item.id, (pt) => {
      const newQ = { ...pt.quarterly, [qi]: value };
      const newM = { ...pt.monthly };
      distributeEvenly(parseNum(value), 3).forEach((mv, mi) => { newM[qi * 3 + mi] = mv; });
      return { ...pt, quarterly: newQ, monthly: newM };
    });
  };

  const handleMonthChange = (item, mi, value) => {
    updateLocal(item.id, pt => ({ ...pt, monthly: { ...pt.monthly, [mi]: value } }));
  };

  const yearTarget = (item) => parseNum(item.targetValue);
  const sumQuarterly = (id) => Object.values(getLocal(id).quarterly).reduce((s, v) => s + parseNum(v), 0);
  const sumMonthly = (id) => Object.values(getLocal(id).monthly).reduce((s, v) => s + parseNum(v), 0);

  const allDiffsZero = kpis.every((item) => {
    const target = yearTarget(item);
    if (target === 0) return true;
    return Math.abs(sumQuarterly(item.id) - target) < 0.01 && Math.abs(sumMonthly(item.id) - target) < 0.01;
  });

  const handleSave = async () => {
    if (!allDiffsZero) { message.error('Chưa thể lưu! Tất cả KPI phải có chênh lệch = 0.'); return; }
    setSaving(true);
    try {
      await Promise.all(kpis.map(async (item) => {
        const pt = getLocal(item.id);
        const targets = [
          ...Object.entries(pt.quarterly).map(([i, v]) => ({ periodType: 'quarterly', periodKey: String(Number(i) + 1), targetValue: parseNum(v) })),
          ...Object.entries(pt.monthly).map(([i, v]) => ({ periodType: 'monthly', periodKey: String(Number(i) + 1), targetValue: parseNum(v) })),
        ];
        await workshopKpiService.savePeriodTargets(item.id, targets);
      }));
      message.success('Đã lưu mục tiêu theo kỳ thành công!');
    } catch {
      message.error('Lưu thất bại, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  const grouped = kpis.reduce((acc, item) => {
    const bscName = bscCategoryMap?.[item.bscCategoryId] || 'Khác';
    if (!acc[bscName]) acc[bscName] = [];
    acc[bscName].push(item);
    return acc;
  }, {});

  const diffBadge = (diff) => {
    if (Math.abs(diff) < 0.01) return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: COLORS.success }}>
        <CheckCircle2 size={12} />0
      </span>
    );
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: diff > 0 ? COLORS.warning : COLORS.danger }}>
        <AlertTriangle size={12} />{diff > 0 ? '+' : ''}{fmtNum(diff)}
      </span>
    );
  };

  const quarterlyFlatRows = [];
  const monthlyFlatRows = [];
  Object.entries(grouped).forEach(([bsc, items]) => {
    items.forEach((item, idx) => {
      quarterlyFlatRows.push({ ...item, _bsc: bsc, _isFirst: idx === 0 });
      monthlyFlatRows.push({ ...item, _bsc: bsc, _isFirst: idx === 0 });
    });
  });

  const inputStyle = { textAlign: 'center', height: 32, fontSize: 14, borderColor: 'transparent', background: 'transparent' };

  const quarterlyColumns = [
    {
      title: 'KPI', key: 'kpi', minWidth: 220,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {record._isFirst && <span style={{ ...bscColorMap[record._bsc], display: 'inline-flex', padding: '1px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, width: 'fit-content' }}>{record._bsc}</span>}
          <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.foreground }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: 'Năm', key: 'year', align: 'center', minWidth: 100,
      render: (_, record) => <span><span style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary }}>{record.targetValue}</span><span style={{ fontSize: 10, color: COLORS.muted, marginLeft: 2 }}>{record.targetUnit}</span></span>,
    },
    ...quarters.map((q, qi) => ({
      title: q, key: `q${qi}`, align: 'center', minWidth: 100,
      render: (_, record) => (
        <Input value={getLocal(record.id).quarterly[qi] ?? ''} onChange={e => handleQuarterChange(record, qi, e.target.value)} placeholder="—" style={inputStyle} />
      ),
    })),
    {
      title: 'Tổng', key: 'total', align: 'center', minWidth: 100,
      render: (_, record) => { const total = sumQuarterly(record.id); return <span style={{ fontSize: 12, fontWeight: 700 }}>{total > 0 ? fmtNum(total) : '—'}</span>; },
    },
    {
      title: 'Chênh lệch', key: 'diff', align: 'center', minWidth: 100,
      render: (_, record) => { const target = yearTarget(record); if (target <= 0) return '—'; return diffBadge(sumQuarterly(record.id) - target); },
    },
  ];

  const monthlyColumns = [
    {
      title: 'KPI', key: 'kpi', width: 180, fixed: 'left',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {record._isFirst && <span style={{ ...bscColorMap[record._bsc], display: 'inline-flex', padding: '1px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, width: 'fit-content' }}>{record._bsc}</span>}
          <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.foreground }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: 'Năm', key: 'year', align: 'center', width: 80,
      render: (_, record) => <span><span style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary }}>{record.targetValue}</span><span style={{ fontSize: 10, color: COLORS.muted, marginLeft: 2 }}>{record.targetUnit}</span></span>,
    },
    ...months.map((m, mi) => ({
      title: m, key: `m${mi}`, align: 'center', width: 75,
      render: (_, record) => (
        <Input value={getLocal(record.id).monthly[mi] ?? ''} onChange={e => handleMonthChange(record, mi, e.target.value)} placeholder="—" style={{ ...inputStyle, padding: '0 4px' }} />
      ),
    })),
    {
      title: 'Tổng', key: 'total', align: 'center', width: 90,
      render: (_, record) => { const total = sumMonthly(record.id); return <span style={{ fontSize: 12, fontWeight: 700 }}>{total > 0 ? fmtNum(total) : '—'}</span>; },
    },
    {
      title: 'Chênh lệch', key: 'diff', align: 'center', width: 90,
      render: (_, record) => { const target = yearTarget(record); if (target <= 0) return '—'; return diffBadge(sumMonthly(record.id) - target); },
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  const tabItems = [
    {
      key: 'quarterly',
      label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><BarChart3 size={14} /> Theo quý</span>,
      children: (
        <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <Table columns={quarterlyColumns} dataSource={quarterlyFlatRows} rowKey="id" pagination={false} size="small" />
        </div>
      ),
    },
    {
      key: 'monthly',
      label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> Theo tháng</span>,
      children: (
        <div style={{ background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <Table columns={monthlyColumns} dataSource={monthlyFlatRows} rowKey="id" pagination={false} size="small" scroll={{ x: 'max-content' }} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: COLORS.muted }}>
          <BarChart3 size={16} />
          <span>Chia nhỏ mục tiêu KPI năm <strong style={{ color: COLORS.foreground }}>{year}</strong> về từng kỳ</span>
        </div>
        <Button type="primary" onClick={handleSave} disabled={!allDiffsZero} loading={saving} size="small" icon={<Save size={16} />}>
          Lưu mục tiêu
        </Button>
      </div>

      {!allDiffsZero && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: COLORS.dangerBg, border: `1px solid rgba(220,38,38,0.2)`, fontSize: 14, color: COLORS.danger }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>Cần điều chỉnh để tổng các kỳ bằng mục tiêu năm (chênh lệch = 0) trước khi lưu.</span>
        </div>
      )}

      <Tabs defaultActiveKey="quarterly" items={tabItems} />
    </div>
  );
};

export default PeriodTargetEditor;
