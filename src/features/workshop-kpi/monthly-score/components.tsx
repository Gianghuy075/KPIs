import { Select, Table, Tag } from 'antd';
import { Award, Info, TrendingUp, User, Users } from 'lucide-react';
import { BSC_COLORS } from '../../../constants/bsc';
import { KPI_COLORS } from '../../../constants/uiTokens';
import { getFinalRating, getRateStyle, getScoreStyle } from '../../../utils/scoreUtils';
import { MONTHLY_SCORE_MONTHS } from './constants';

export const MonthlyInfoBanner = ({ config }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: 16,
      borderRadius: 12,
      background: KPI_COLORS.primaryBg,
      border: '1px solid rgba(59,95,196,0.2)',
    }}
  >
    <Info size={20} color={KPI_COLORS.primary} style={{ marginTop: 2, flexShrink: 0 }} />
    <div style={{ fontSize: 14 }}>
      <p style={{ fontWeight: 600, color: KPI_COLORS.foreground, margin: '0 0 4px' }}>
        Điểm KPI cuối tháng
      </p>
      <p style={{ color: KPI_COLORS.muted, margin: '0 0 2px' }}>
        Điểm cuối cùng = Điểm cá nhân × {config.individualRatio}% + Điểm phòng ban × {100 - config.individualRatio}%
      </p>
      <p style={{ color: KPI_COLORS.muted, margin: 0 }}>
        Hệ số phòng ban: <strong>{config.deptCoefficient}</strong>
      </p>
    </div>
  </div>
);

export const MonthlyFilter = ({ selectedMonth, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span style={{ fontSize: 14, fontWeight: 500, color: KPI_COLORS.muted }}>Tháng:</span>
    <Select
      value={String(selectedMonth)}
      onChange={(value) => onChange(Number(value))}
      style={{ width: 140 }}
      options={MONTHLY_SCORE_MONTHS.map((label, index) => ({ value: String(index), label }))}
    />
  </div>
);

const scoreCardBaseStyle = {
  background: KPI_COLORS.card,
  borderRadius: 12,
  border: `1px solid ${KPI_COLORS.border}`,
  padding: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

export const MonthlySummaryCards = ({
  year,
  selectedMonth,
  config,
  individualScore,
  deptScore,
  finalScore,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 16,
    }}
  >
    <div style={scoreCardBaseStyle}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: KPI_COLORS.primaryBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <User size={24} color={KPI_COLORS.primary} />
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            color: KPI_COLORS.muted,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}
        >
          Điểm cá nhân
        </p>
        <p style={{ fontSize: 24, fontWeight: 900, color: getScoreStyle(individualScore).color, margin: '2px 0 0' }}>
          {individualScore}
        </p>
        <p style={{ fontSize: 10, color: KPI_COLORS.muted, margin: 0 }}>Tỷ lệ: {config.individualRatio}%</p>
      </div>
    </div>

    <div style={scoreCardBaseStyle}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: KPI_COLORS.mutedBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Users size={24} color={KPI_COLORS.muted} />
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            color: KPI_COLORS.muted,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}
        >
          Điểm phòng ban
        </p>
        <p style={{ fontSize: 24, fontWeight: 900, color: getScoreStyle(deptScore).color, margin: '2px 0 0' }}>
          {deptScore}
        </p>
        <p style={{ fontSize: 10, color: KPI_COLORS.muted, margin: 0 }}>Tỷ lệ: {100 - config.individualRatio}%</p>
      </div>
    </div>

    <div
      style={{
        ...scoreCardBaseStyle,
        border: '2px solid rgba(59,95,196,0.3)',
        boxShadow: '0 4px 12px rgba(59,95,196,0.1)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: KPI_COLORS.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Award size={24} color="#fff" />
      </div>
      <div>
        <p
          style={{
            fontSize: 11,
            color: KPI_COLORS.muted,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
          }}
        >
          Điểm cuối cùng
        </p>
        <p style={{ fontSize: 30, fontWeight: 900, color: getScoreStyle(finalScore).color, margin: '2px 0 0' }}>
          {finalScore}
        </p>
        <p style={{ fontSize: 10, color: KPI_COLORS.muted, margin: 0 }}>
          {MONTHLY_SCORE_MONTHS[selectedMonth]} / {year}
        </p>
      </div>
    </div>
  </div>
);

export const PeopleScoreTable = ({ selectedMonth, peopleRows, individualScore, deptScore, finalScore }) => {
  const peopleColumns = [
    {
      title: 'Nhân viên',
      key: 'name',
      render: (_, row) => (
        <span style={{ fontWeight: 600, color: KPI_COLORS.foreground }}>{row.name}</span>
      ),
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: (_, row) => (
        <span
          style={{
            display: 'inline-flex',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            background: KPI_COLORS.infoBlueBg,
            color: KPI_COLORS.infoBlue,
          }}
        >
          {row.roleLabel || 'Tổng hợp'}
        </span>
      ),
    },
    {
      title: 'Điểm CN',
      key: 'indScore',
      align: 'center',
      render: (_, row) => {
        const rowIndividualScore = row.individualScore ?? individualScore;
        const style = getScoreStyle(rowIndividualScore);
        return (
          <span
            style={{
              ...style,
              display: 'inline-flex',
              minWidth: 48,
              justifyContent: 'center',
              padding: '4px 8px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {rowIndividualScore}
          </span>
        );
      },
    },
    {
      title: 'Điểm PB',
      key: 'deptScore',
      align: 'center',
      render: (_, row) => {
        const rowDeptScore = row.deptScore ?? deptScore;
        const style = getScoreStyle(rowDeptScore);
        return (
          <span
            style={{
              ...style,
              display: 'inline-flex',
              minWidth: 48,
              justifyContent: 'center',
              padding: '4px 8px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {rowDeptScore}
          </span>
        );
      },
    },
    {
      title: 'Điểm cuối',
      key: 'finalScore',
      align: 'center',
      render: (_, row) => {
        const rowFinalScore = row.finalScore ?? finalScore;
        const style = getScoreStyle(rowFinalScore);
        return (
          <span
            style={{
              ...style,
              display: 'inline-flex',
              minWidth: 56,
              justifyContent: 'center',
              padding: '6px 12px',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 900,
            }}
          >
            {rowFinalScore}
          </span>
        );
      },
    },
    {
      title: 'Xếp loại',
      key: 'rating',
      align: 'center',
      render: (_, row) => {
        const rowFinalScore = row.finalScore ?? finalScore;
        const rating = getFinalRating(rowFinalScore);
        return (
          <Tag
            style={{
              color: rating.color,
              background: rating.bg,
              border: 'none',
              fontWeight: 600,
            }}
          >
            {rating.label}
          </Tag>
        );
      },
    },
  ];

  return (
    <div
      style={{
        background: KPI_COLORS.card,
        borderRadius: 12,
        border: `1px solid ${KPI_COLORS.border}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          borderBottom: `1px solid ${KPI_COLORS.border}`,
          background: KPI_COLORS.mutedBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontWeight: 700,
            color: KPI_COLORS.foreground,
            fontSize: 14,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <TrendingUp size={16} color={KPI_COLORS.primary} />
          Điểm từng nhân viên — {MONTHLY_SCORE_MONTHS[selectedMonth]}
        </h3>
      </div>
      <Table columns={peopleColumns} dataSource={peopleRows} rowKey="id" pagination={false} size="small" />
    </div>
  );
};

export const KpiBreakdownTable = ({ selectedMonth, config, scoreRows, individualScore }) => {
  const kpiBreakdownColumns = [
    {
      title: 'BSC',
      key: 'bsc',
      render: (_, row) => (
        <span
          style={{
            ...(BSC_COLORS[row.bsc] || { color: KPI_COLORS.muted, background: KPI_COLORS.mutedBg }),
            display: 'inline-flex',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {row.bsc}
        </span>
      ),
    },
    {
      title: 'KPI',
      key: 'name',
      render: (_, row) => <span style={{ fontWeight: 500, color: KPI_COLORS.foreground }}>{row.name}</span>,
    },
    {
      title: 'Mục tiêu tháng',
      key: 'monthTarget',
      align: 'center',
      render: (_, row) =>
        row.monthTarget > 0 ? (
          <span style={{ color: KPI_COLORS.muted }}>
            {row.monthTarget.toFixed(2)} {row.targetUnit}
          </span>
        ) : (
          <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 12 }}>—</span>
        ),
    },
    {
      title: 'Thực tế',
      key: 'actual',
      align: 'center',
      render: (_, row) =>
        row.actualValue != null ? (
          <span
            style={{
              fontWeight: 600,
              color: KPI_COLORS.foreground,
              background: KPI_COLORS.primaryBg,
              padding: '2px 8px',
              borderRadius: 4,
            }}
          >
            {row.actualValue}
          </span>
        ) : (
          <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 12, fontStyle: 'italic' }}>—</span>
        ),
    },
    {
      title: 'Số lỗi',
      key: 'errors',
      align: 'center',
      render: (_, row) =>
        row.errors > 0 ? (
          <span
            style={{
              display: 'inline-flex',
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              color: KPI_COLORS.danger,
              background: KPI_COLORS.dangerBg,
            }}
          >
            {row.errors}
          </span>
        ) : (
          <span style={{ color: 'rgba(107,114,128,0.3)' }}>—</span>
        ),
    },
    {
      title: '% Hoàn thành',
      key: 'rate',
      align: 'center',
      render: (_, row) => (
        <span
          style={{
            ...getRateStyle(row.rate),
            display: 'inline-flex',
            minWidth: 44,
            justifyContent: 'center',
            padding: '2px 8px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {row.rate.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Trọng số',
      key: 'weight',
      align: 'center',
      render: (_, row) => <span style={{ fontWeight: 700 }}>{row.weight}%</span>,
    },
    {
      title: 'Hệ số PB',
      key: 'coeff',
      align: 'center',
      render: () => <span style={{ color: KPI_COLORS.muted }}>{config.deptCoefficient}</span>,
    },
    {
      title: 'Điểm',
      key: 'points',
      align: 'center',
      render: (_, row) => {
        const style = getScoreStyle(row.points);
        return <span style={{ fontWeight: 900, color: style.color }}>{row.points}</span>;
      },
    },
  ];

  return (
    <div
      style={{
        background: KPI_COLORS.card,
        borderRadius: 12,
        border: `1px solid ${KPI_COLORS.border}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{ padding: '12px 20px', borderBottom: `1px solid ${KPI_COLORS.border}`, background: KPI_COLORS.mutedBg }}
      >
        <h3 style={{ fontWeight: 700, color: KPI_COLORS.foreground, fontSize: 14, margin: 0 }}>
          Chi tiết từng KPI — {MONTHLY_SCORE_MONTHS[selectedMonth]}
        </h3>
      </div>
      <Table
        columns={kpiBreakdownColumns}
        dataSource={scoreRows}
        rowKey="id"
        pagination={false}
        size="small"
        summary={() => (
          <Table.Summary.Row style={{ background: KPI_COLORS.primaryBg }}>
            <Table.Summary.Cell
              index={0}
              colSpan={8}
              style={{
                textAlign: 'right',
                fontWeight: 700,
                fontSize: 14,
                textTransform: 'uppercase',
              }}
            >
              Tổng điểm tháng:
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} style={{ textAlign: 'center' }}>
              <span style={{ fontWeight: 900, fontSize: 18, color: getScoreStyle(individualScore).color }}>
                {individualScore}
              </span>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </div>
  );
};
