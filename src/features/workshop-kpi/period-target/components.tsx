import { Button, Input, Table, Tabs } from 'antd';
import { AlertTriangle, BarChart3, Calendar, CheckCircle2, Save } from 'lucide-react';
import { BSC_COLORS } from '../../../constants/bsc';
import { MONTH_NAMES_SHORT, QUARTER_NAMES } from '../../../constants/period';
import { KPI_COLORS } from '../../../constants/uiTokens';
import { fmtNum } from './utils';

const inputStyle = {
  textAlign: 'center',
  height: 32,
  fontSize: 14,
  borderColor: 'transparent',
  background: 'transparent',
};

const diffBadge = (diff) => {
  if (Math.abs(diff) < 0.01) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 12,
          fontWeight: 700,
          color: KPI_COLORS.success,
        }}
      >
        <CheckCircle2 size={12} />0
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12,
        fontWeight: 700,
        color: diff > 0 ? KPI_COLORS.warning : KPI_COLORS.danger,
      }}
    >
      <AlertTriangle size={12} />
      {diff > 0 ? '+' : ''}
      {fmtNum(diff)}
    </span>
  );
};

export const PeriodTargetHeader = ({ year, allDiffsZero, saving, onSave }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: KPI_COLORS.muted }}>
        <BarChart3 size={16} />
        <span>
          Chia nhỏ mục tiêu KPI năm <strong style={{ color: KPI_COLORS.foreground }}>{year}</strong> về từng kỳ
        </span>
      </div>
      <Button
        type="primary"
        onClick={onSave}
        disabled={!allDiffsZero}
        loading={saving}
        size="small"
        icon={<Save size={16} />}
      >
        Lưu mục tiêu
      </Button>
    </div>

    {!allDiffsZero && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 8,
          background: KPI_COLORS.dangerBg,
          border: '1px solid rgba(220,38,38,0.2)',
          fontSize: 14,
          color: KPI_COLORS.danger,
        }}
      >
        <AlertTriangle size={16} style={{ flexShrink: 0 }} />
        <span>Cần điều chỉnh để tổng các kỳ bằng mục tiêu năm (chênh lệch = 0) trước khi lưu.</span>
      </div>
    )}
  </>
);

export const PeriodTargetTabs = ({
  rows,
  getLocal,
  handleQuarterChange,
  handleMonthChange,
  yearTarget,
  sumQuarterly,
  sumMonthly,
}) => {
  const quarterlyColumns = [
    {
      title: 'KPI',
      key: 'kpi',
      minWidth: 220,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {record._isFirst && (
            <span
              style={{
                ...BSC_COLORS[record._bsc],
                display: 'inline-flex',
                padding: '1px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                width: 'fit-content',
              }}
            >
              {record._bsc}
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 500, color: KPI_COLORS.foreground }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: 'Năm',
      key: 'year',
      align: 'center',
      minWidth: 100,
      render: (_, record) => (
        <span>
          <span style={{ fontSize: 12, fontWeight: 700, color: KPI_COLORS.primary }}>{record.targetValue}</span>
          <span style={{ fontSize: 10, color: KPI_COLORS.muted, marginLeft: 2 }}>{record.targetUnit}</span>
        </span>
      ),
    },
    ...QUARTER_NAMES.map((quarter, quarterIndex) => ({
      title: quarter,
      key: `q${quarterIndex}`,
      align: 'center',
      minWidth: 100,
      render: (_, record) => (
        <Input
          value={getLocal(record.id).quarterly[quarterIndex] ?? ''}
          onChange={(event) => handleQuarterChange(record, quarterIndex, event.target.value)}
          placeholder="—"
          style={inputStyle}
        />
      ),
    })),
    {
      title: 'Tổng',
      key: 'total',
      align: 'center',
      minWidth: 100,
      render: (_, record) => {
        const total = sumQuarterly(record.id);
        return <span style={{ fontSize: 12, fontWeight: 700 }}>{total > 0 ? fmtNum(total) : '—'}</span>;
      },
    },
    {
      title: 'Chênh lệch',
      key: 'diff',
      align: 'center',
      minWidth: 100,
      render: (_, record) => {
        const target = yearTarget(record);
        if (target <= 0) return '—';
        return diffBadge(sumQuarterly(record.id) - target);
      },
    },
  ];

  const monthlyColumns = [
    {
      title: 'KPI',
      key: 'kpi',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {record._isFirst && (
            <span
              style={{
                ...BSC_COLORS[record._bsc],
                display: 'inline-flex',
                padding: '1px 8px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 700,
                width: 'fit-content',
              }}
            >
              {record._bsc}
            </span>
          )}
          <span style={{ fontSize: 14, fontWeight: 500, color: KPI_COLORS.foreground }}>{record.name}</span>
        </div>
      ),
    },
    {
      title: 'Năm',
      key: 'year',
      align: 'center',
      width: 80,
      render: (_, record) => (
        <span>
          <span style={{ fontSize: 12, fontWeight: 700, color: KPI_COLORS.primary }}>{record.targetValue}</span>
          <span style={{ fontSize: 10, color: KPI_COLORS.muted, marginLeft: 2 }}>{record.targetUnit}</span>
        </span>
      ),
    },
    ...MONTH_NAMES_SHORT.map((monthLabel, monthIndex) => ({
      title: monthLabel,
      key: `m${monthIndex}`,
      align: 'center',
      width: 75,
      render: (_, record) => (
        <Input
          value={getLocal(record.id).monthly[monthIndex] ?? ''}
          onChange={(event) => handleMonthChange(record, monthIndex, event.target.value)}
          placeholder="—"
          style={{ ...inputStyle, padding: '0 4px' }}
        />
      ),
    })),
    {
      title: 'Tổng',
      key: 'total',
      align: 'center',
      width: 90,
      render: (_, record) => {
        const total = sumMonthly(record.id);
        return <span style={{ fontSize: 12, fontWeight: 700 }}>{total > 0 ? fmtNum(total) : '—'}</span>;
      },
    },
    {
      title: 'Chênh lệch',
      key: 'diff',
      align: 'center',
      width: 90,
      render: (_, record) => {
        const target = yearTarget(record);
        if (target <= 0) return '—';
        return diffBadge(sumMonthly(record.id) - target);
      },
    },
  ];

  const tabItems = [
    {
      key: 'quarterly',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <BarChart3 size={14} /> Theo quý
        </span>
      ),
      children: (
        <div
          style={{
            background: KPI_COLORS.card,
            borderRadius: 12,
            border: `1px solid ${KPI_COLORS.border}`,
            overflow: 'hidden',
          }}
        >
          <Table columns={quarterlyColumns} dataSource={rows} rowKey="id" pagination={false} size="small" />
        </div>
      ),
    },
    {
      key: 'monthly',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={14} /> Theo tháng
        </span>
      ),
      children: (
        <div
          style={{
            background: KPI_COLORS.card,
            borderRadius: 12,
            border: `1px solid ${KPI_COLORS.border}`,
            overflow: 'hidden',
          }}
        >
          <Table
            columns={monthlyColumns}
            dataSource={rows}
            rowKey="id"
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
          />
        </div>
      ),
    },
  ];

  return <Tabs defaultActiveKey="quarterly" items={tabItems} />;
};
