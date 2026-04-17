import { useMemo } from 'react';
import { Table, Tabs, Tag } from 'antd';
import { calculatePenalty } from '../../utils/penaltyUtils';
import { calcCompletionRate } from '../../utils/bonusUtils';

const COLORS = {
  success: '#16a34a',
  successBg: 'rgba(22,163,74,0.1)',
  warning: '#d97706',
  warningBg: 'rgba(217,119,6,0.1)',
  danger: '#dc2626',
  dangerBg: 'rgba(220,38,38,0.1)',
  primary: '#3b5fc4',
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

const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const getRatingStyle = (r) =>
  r >= 85 ? { color: COLORS.success, background: COLORS.successBg }
  : r >= 70 ? { color: COLORS.warning, background: COLORS.warningBg }
  : { color: COLORS.danger, background: COLORS.dangerBg };

const ratingBadge = (rate) => (
  <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, ...getRatingStyle(rate) }}>
    {rate.toFixed(1)}%
  </span>
);

const EmployeeKpiView = ({ kpis, bscCategoryMap, penaltyLogics, year, allEntries }) => {
  const flatRows = useMemo(() => {
    const enriched = kpis.map(k => ({ ...k, bsc: bscCategoryMap?.[k.bscCategoryId] || 'Khác' }));
    const bscOrder = ['Tài chính', 'Khách hàng', 'Quy trình nội bộ', 'Học hỏi & Phát triển'];
    return enriched.sort((a, b) => {
      const ai = bscOrder.indexOf(a.bsc);
      const bi = bscOrder.indexOf(b.bsc);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [kpis, bscCategoryMap]);

  const bscGroups = useMemo(() => {
    const groups = {};
    flatRows.forEach(k => {
      if (!groups[k.bsc]) groups[k.bsc] = [];
      groups[k.bsc].push(k);
    });
    return groups;
  }, [flatRows]);

  const getMonthEntry = (kpiId, monthIdx) => allEntries[kpiId]?.[monthIdx] ?? { actualValue: null, errorCount: 0 };

  const getYearActual = (kpiId) => {
    const entries = Array.from({ length: 12 }, (_, i) => getMonthEntry(kpiId, i));
    return entries.filter(e => e.actualValue != null).pop()?.actualValue ?? null;
  };

  const getYearErrors = (kpiId) =>
    Array.from({ length: 12 }, (_, i) => getMonthEntry(kpiId, i)).reduce((s, e) => s + (e.errorCount || 0), 0);

  const getQuarterErrors = (kpiId, qi) =>
    [0, 1, 2].reduce((s, i) => s + (getMonthEntry(kpiId, qi * 3 + i).errorCount || 0), 0);

  const getYearRate = (kpi) => {
    const actual = getYearActual(kpi.id);
    if (actual == null) return 0;
    return calcCompletionRate(Number(actual), Number(kpi.targetValue));
  };

  const getMonthRate = (kpi, monthIdx) => {
    const entry = getMonthEntry(kpi.id, monthIdx);
    if (entry.actualValue == null || !kpi.targetValue) return 0;
    const monthTarget = Number(kpi.targetValue) / 12;
    return calcCompletionRate(Number(entry.actualValue), monthTarget);
  };

  const getPenalty = (kpi, errors, rate) => {
    const logic = penaltyLogics?.find(l => l.id === kpi.penaltyLogicId);
    return calculatePenalty(logic, errors, rate);
  };

  const renderBscGroups = (columns) => Object.entries(bscGroups).map(([bscName, rows]) => (
    <div key={bscName} style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden', marginBottom: 12 }}>
      <div style={{ padding: '8px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, ...(bscColorMap[bscName] || {}) }}>{bscName}</span>
      </div>
      <Table columns={columns} dataSource={rows} rowKey="id" pagination={false} size="small" />
    </div>
  ));

  const yearColumns = [
    { title: 'Tên KPI', dataIndex: 'name', render: val => <span style={{ fontWeight: 500, color: COLORS.foreground }}>{val}</span> },
    { title: 'Mục tiêu', width: 100, align: 'center', render: (_, row) => <span style={{ color: COLORS.muted }}>{row.targetValue} {row.targetUnit}</span> },
    { title: 'Thực tế', width: 100, align: 'center', render: (_, row) => <span style={{ fontWeight: 500 }}>{getYearActual(row.id) ?? '—'}</span> },
    {
      title: 'Hoàn thành', width: 110, align: 'center',
      render: (_, row) => ratingBadge(getYearRate(row)),
    },
    {
      title: 'Tổng lỗi', width: 90, align: 'center',
      render: (_, row) => {
        const errors = getYearErrors(row.id);
        return errors > 0 ? <Tag color="red">{errors}</Tag> : <span style={{ color: COLORS.muted }}>0</span>;
      },
    },
    {
      title: 'Điểm sau trừ', width: 110, align: 'center',
      render: (_, row) => {
        const rate = getYearRate(row);
        const errors = getYearErrors(row.id);
        const penalty = getPenalty(row, errors, rate);
        const adjusted = Math.max(0, rate - penalty);
        return ratingBadge(adjusted);
      },
    },
  ];

  const quarterColumns = [
    { title: 'Tên KPI', dataIndex: 'name', render: val => <span style={{ fontWeight: 500, color: COLORS.foreground }}>{val}</span> },
    ...quarterNames.map((q, qi) => ({
      title: q, key: `q${qi}`, align: 'center', width: 100,
      render: (_, row) => {
        const errors = getQuarterErrors(row.id, qi);
        const entries = [0, 1, 2].map(i => getMonthEntry(row.id, qi * 3 + i));
        const hasData = entries.some(e => e.actualValue != null);
        if (!hasData) return <span style={{ color: COLORS.muted }}>—</span>;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {errors > 0 ? <Tag color="red" style={{ margin: 0 }}>{errors} lỗi</Tag> : <span style={{ color: COLORS.muted, fontSize: 11 }}>0 lỗi</span>}
          </div>
        );
      },
    })),
  ];

  const monthColumns = [
    { title: 'Tên KPI', dataIndex: 'name', render: val => <span style={{ fontWeight: 500, color: COLORS.foreground }}>{val}</span> },
    ...monthNames.map((m, mi) => ({
      title: m, key: `m${mi}`, align: 'center', width: 75,
      render: (_, row) => {
        const entry = getMonthEntry(row.id, mi);
        if (entry.actualValue == null) return <span style={{ color: COLORS.muted, fontSize: 12 }}>—</span>;
        const rate = getMonthRate(row, mi);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 500 }}>{entry.actualValue}</span>
            {ratingBadge(rate)}
          </div>
        );
      },
    })),
  ];

  const tabItems = [
    {
      key: 'year', label: 'Theo Năm',
      children: renderBscGroups(yearColumns),
    },
    {
      key: 'quarter', label: 'Theo Quý',
      children: renderBscGroups(quarterColumns),
    },
    {
      key: 'month', label: 'Theo Tháng',
      children: (
        <div style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <Table columns={monthColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" scroll={{ x: 'max-content' }} />
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ marginBottom: 8, fontSize: 14, color: COLORS.muted }}>
        Năm: <strong style={{ color: COLORS.foreground }}>{year}</strong>
      </div>
      <Tabs defaultActiveKey="year" items={tabItems} />
    </div>
  );
};

export default EmployeeKpiView;
