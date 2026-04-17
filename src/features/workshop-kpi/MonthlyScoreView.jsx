import { useState, useEffect, useMemo } from 'react';
import { Table, Select, Tag, Card, Statistic, Row, Col, Spin, message } from 'antd';
import { Award, TrendingUp } from 'lucide-react';
import workshopKpiService from '../../services/workshopKpiService';
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

const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

const getRatingStyle = (r) =>
  r >= 85 ? { color: COLORS.success, background: COLORS.successBg }
  : r >= 70 ? { color: COLORS.warning, background: COLORS.warningBg }
  : { color: COLORS.danger, background: COLORS.dangerBg };

const MonthlyScoreView = ({ kpis, bscCategoryMap, penaltyLogics, year }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kpis?.length) { setLoading(false); return; }
    setLoading(true);
    Promise.all(kpis.map(async (k) => {
      const entries = await workshopKpiService.getMonthlyEntries(k.id);
      return [k.id, entries];
    })).then(results => {
      const map = {};
      results.forEach(([id, entries]) => { map[id] = entries; });
      setAllEntries(map);
    }).catch(() => message.error('Không thể tải dữ liệu nhập liệu'))
      .finally(() => setLoading(false));
  }, [kpis]);

  const flatRows = useMemo(() => {
    const enriched = kpis.map(k => ({ ...k, bsc: bscCategoryMap?.[k.bscCategoryId] || 'Khác' }));
    const bscOrder = ['Tài chính', 'Khách hàng', 'Quy trình nội bộ', 'Học hỏi & Phát triển'];
    return enriched.sort((a, b) => {
      const ai = bscOrder.indexOf(a.bsc);
      const bi = bscOrder.indexOf(b.bsc);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [kpis, bscCategoryMap]);

  const getEntry = (kpiId, monthIdx) => allEntries[kpiId]?.[monthIdx] ?? { actualValue: null, errorCount: 0 };

  const getCompletionRate = (kpi, monthIdx) => {
    const entry = getEntry(kpi.id, monthIdx);
    if (entry.actualValue == null || !kpi.targetValue) return 0;
    const monthTarget = Number(kpi.targetValue) / 12;
    return calcCompletionRate(Number(entry.actualValue), monthTarget);
  };

  const scoreData = useMemo(() => {
    if (!flatRows.length) return { totalScore: 0, totalWeight: 0, rows: [] };
    let weightedSum = 0;
    let totalWeight = 0;
    const rows = flatRows.map(kpi => {
      const entry = getEntry(kpi.id, selectedMonth);
      const rate = getCompletionRate(kpi, selectedMonth);
      const logic = penaltyLogics?.find(l => l.id === kpi.penaltyLogicId);
      const penalty = calculatePenalty(logic, entry.errorCount || 0, rate);
      const adjustedRate = Math.max(0, rate - penalty);
      const weight = kpi.weight || 0;
      weightedSum += adjustedRate * weight;
      totalWeight += weight;
      return { ...kpi, rate, penalty, adjustedRate, entry };
    });
    const totalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight * 100) / 100 : 0;
    return { totalScore, totalWeight, rows };
  }, [flatRows, selectedMonth, allEntries, penaltyLogics]);

  const monthOptions = monthNames.map((m, i) => ({ value: i, label: m }));

  const bscGroups = useMemo(() => {
    const groups = {};
    scoreData.rows.forEach(r => {
      if (!groups[r.bsc]) groups[r.bsc] = [];
      groups[r.bsc].push(r);
    });
    return groups;
  }, [scoreData.rows]);

  const columns = [
    {
      title: 'Tên KPI', dataIndex: 'name', width: '25%',
      render: val => <span style={{ fontWeight: 500, color: COLORS.foreground }}>{val}</span>,
    },
    {
      title: 'Mục tiêu tháng', width: '12%', align: 'center',
      render: (_, row) => {
        const monthTarget = row.targetValue ? (Number(row.targetValue) / 12).toFixed(1) : '—';
        return <span style={{ color: COLORS.muted }}>{monthTarget} {row.targetUnit}</span>;
      },
    },
    {
      title: 'Thực tế', width: '10%', align: 'center',
      render: (_, row) => <span style={{ fontWeight: 500 }}>{row.entry.actualValue ?? '—'} {row.entry.actualValue != null ? row.targetUnit : ''}</span>,
    },
    {
      title: 'Hoàn thành (%)', width: '12%', align: 'center',
      render: (_, row) => (
        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, ...getRatingStyle(row.rate) }}>
          {row.rate.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Lỗi', width: '8%', align: 'center',
      render: (_, row) => row.entry.errorCount > 0
        ? <Tag color="red">{row.entry.errorCount}</Tag>
        : <span style={{ color: COLORS.muted }}>—</span>,
    },
    {
      title: 'Trừ điểm', width: '10%', align: 'center',
      render: (_, row) => row.penalty > 0
        ? <span style={{ color: COLORS.danger, fontWeight: 600 }}>-{row.penalty}</span>
        : <span style={{ color: COLORS.muted }}>0</span>,
    },
    {
      title: 'Điểm hiệu chỉnh (%)', width: '12%', align: 'center',
      render: (_, row) => (
        <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, ...getRatingStyle(row.adjustedRate) }}>
          {row.adjustedRate.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Trọng số', dataIndex: 'weight', width: '8%', align: 'right',
      render: val => <span style={{ fontWeight: 500 }}>{val}%</span>,
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 500 }}>Tháng:</span>
        <Select value={selectedMonth} onChange={setSelectedMonth} options={monthOptions} style={{ width: 140 }} />
      </div>

      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title={`Điểm KPI tháng ${selectedMonth + 1}/${year}`}
              value={scoreData.totalScore}
              suffix="%"
              prefix={<Award size={20} style={{ color: scoreData.totalScore >= 85 ? COLORS.success : scoreData.totalScore >= 70 ? COLORS.warning : COLORS.danger }} />}
              valueStyle={{ color: scoreData.totalScore >= 85 ? COLORS.success : scoreData.totalScore >= 70 ? COLORS.warning : COLORS.danger }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng trọng số"
              value={scoreData.totalWeight}
              suffix="%"
              prefix={<TrendingUp size={20} style={{ color: COLORS.primary }} />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Số KPI có lỗi"
              value={scoreData.rows.filter(r => r.entry.errorCount > 0).length}
              suffix={`/ ${scoreData.rows.length}`}
              valueStyle={{ color: COLORS.danger }}
            />
          </Card>
        </Col>
      </Row>

      {Object.entries(bscGroups).map(([bscName, rows]) => (
        <div key={bscName} style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
            <span style={{ display: 'inline-flex', padding: '2px 10px', borderRadius: 6, fontSize: 13, fontWeight: 600, ...(bscColorMap[bscName] || {}) }}>{bscName}</span>
          </div>
          <Table columns={columns} dataSource={rows} rowKey="id" pagination={false} size="small" />
        </div>
      ))}
    </div>
  );
};

export default MonthlyScoreView;
