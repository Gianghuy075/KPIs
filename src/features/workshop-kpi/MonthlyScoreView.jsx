import { useEffect, useMemo, useState } from 'react';
import { Select, Spin, Table, Tag, message } from 'antd';
import { Award, Info, TrendingUp, User, Users } from 'lucide-react';
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
  primaryBg: 'rgba(59,95,196,0.08)',
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

const monthNames = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

const defaultConfig = {
  deptCoefficient: 1,
  individualRatio: 70,
  kpiWeightOverrides: {},
};

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getRatingStyle = (rate) =>
  rate >= 85
    ? { color: COLORS.success, background: COLORS.successBg }
    : rate >= 70
      ? { color: COLORS.warning, background: COLORS.warningBg }
      : { color: COLORS.danger, background: COLORS.dangerBg };

const getScoreStyle = (score) => {
  if (score >= 85) return { color: COLORS.success, background: COLORS.successBg };
  if (score >= 70) return { color: COLORS.warning, background: COLORS.warningBg };
  if (score >= 50) return { color: '#f97316', background: 'rgba(249,115,22,0.1)' };
  return { color: COLORS.danger, background: COLORS.dangerBg };
};

const getFinalRating = (score) => {
  if (score >= 90) return { label: 'Xuất sắc', color: COLORS.success, bg: COLORS.successBg };
  if (score >= 80) return { label: 'Tốt', color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)' };
  if (score >= 65) return { label: 'Đạt', color: COLORS.warning, bg: COLORS.warningBg };
  if (score >= 50) return { label: 'Cần cải thiện', color: '#f97316', bg: 'rgba(249,115,22,0.1)' };
  return { label: 'Không đạt', color: COLORS.danger, bg: COLORS.dangerBg };
};

const MonthlyScoreView = ({ kpis, bscCategoryMap, penaltyLogics, year, bonusConfig }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kpis?.length) {
      setLoading(false);
      setAllEntries({});
      return;
    }

    setLoading(true);
    Promise.all(
      kpis.map(async (kpi) => {
        const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
        return [kpi.id, entries];
      }),
    )
      .then((results) => {
        const map = {};
        results.forEach(([id, entries]) => {
          map[id] = entries;
        });
        setAllEntries(map);
      })
      .catch(() => message.error('Không thể tải dữ liệu nhập liệu'))
      .finally(() => setLoading(false));
  }, [kpis]);

  const config = useMemo(() => {
    const weightOverrides = {};
    (bonusConfig?.weightOverrides || []).forEach((override) => {
      weightOverrides[override.kpiId] = Number(override.customWeight);
    });

    return {
      deptCoefficient: Number(bonusConfig?.deptCoefficient ?? defaultConfig.deptCoefficient),
      individualRatio: Number(bonusConfig?.individualRatio ?? defaultConfig.individualRatio),
      kpiWeightOverrides: weightOverrides,
    };
  }, [bonusConfig]);

  const entriesByKpiMonth = useMemo(() => {
    const normalized = {};

    Object.entries(allEntries).forEach(([kpiId, entries]) => {
      const monthMap = {};
      (entries || []).forEach((entry) => {
        const monthIdx = (entry.month ?? entry.monthIndex ?? 1) - 1;
        monthMap[monthIdx] = entry;
      });
      normalized[kpiId] = monthMap;
    });

    return normalized;
  }, [allEntries]);

  const getEntry = (kpiId, monthIdx) =>
    entriesByKpiMonth[kpiId]?.[monthIdx] ?? { actualValue: null, errorCount: 0, note: '' };

  const scoreRows = useMemo(() => {
    const enriched = kpis.map((kpi) => {
      const bsc = bscCategoryMap?.[kpi.bscCategoryId] || 'Khác';
      const entry = getEntry(kpi.id, selectedMonth);

      const yearTarget = Number(kpi.targetValue || 0);
      const monthTarget = yearTarget > 0 ? yearTarget / 12 : 0;
      const actualValue = entry.actualValue != null ? Number(entry.actualValue) : null;
      const errors = Number(entry.errorCount || 0);

      const rawRate =
        actualValue != null && monthTarget > 0
          ? calcCompletionRate(actualValue, monthTarget)
          : 0;

      const logic = penaltyLogics?.find((item) => item.id === kpi.penaltyLogicId);
      const penalty = calculatePenalty(logic, errors, rawRate);
      const rate = Math.max(0, rawRate - penalty);

      const weight = Number(config.kpiWeightOverrides[kpi.id] ?? kpi.weight ?? 0);
      const points = round2((rate * weight * config.deptCoefficient) / 100);

      return {
        ...kpi,
        bsc,
        entry,
        monthTarget,
        actualValue,
        errors,
        rawRate,
        penalty,
        rate,
        weight,
        points,
      };
    });

    return enriched;
  }, [kpis, bscCategoryMap, selectedMonth, entriesByKpiMonth, penaltyLogics, config]);

  const individualScore = useMemo(
    () => round2(scoreRows.reduce((sum, row) => sum + row.points, 0)),
    [scoreRows],
  );

  const deptScore = individualScore;

  const finalScore = useMemo(() => {
    const indRatio = config.individualRatio / 100;
    const deptRatio = 1 - indRatio;
    return round2(individualScore * indRatio + deptScore * deptRatio);
  }, [config.individualRatio, individualScore, deptScore]);

  const peopleRows = useMemo(
    () => [
      {
        id: 'workshop-total',
        name: 'Tổng phân xưởng',
      },
    ],
    [],
  );

  const peopleColumns = [
    {
      title: 'Nhân viên',
      key: 'name',
      render: (_, row) => (
        <span style={{ fontWeight: 600, color: COLORS.foreground }}>{row.name}</span>
      ),
    },
    {
      title: 'Vai trò',
      key: 'role',
      render: () => (
        <span
          style={{
            display: 'inline-flex',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            background: 'rgba(59,130,246,0.1)',
            color: '#1d4ed8',
          }}
        >
          Tổng hợp
        </span>
      ),
    },
    {
      title: 'Điểm CN',
      key: 'indScore',
      align: 'center',
      render: () => {
        const style = getScoreStyle(individualScore);
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
            {individualScore}
          </span>
        );
      },
    },
    {
      title: 'Điểm PB',
      key: 'deptScore',
      align: 'center',
      render: () => {
        const style = getScoreStyle(deptScore);
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
            {deptScore}
          </span>
        );
      },
    },
    {
      title: 'Điểm cuối',
      key: 'finalScore',
      align: 'center',
      render: () => {
        const style = getScoreStyle(finalScore);
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
            {finalScore}
          </span>
        );
      },
    },
    {
      title: 'Xếp loại',
      key: 'rating',
      align: 'center',
      render: () => {
        const rating = getFinalRating(finalScore);
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

  const kpiBreakdownColumns = [
    {
      title: 'BSC',
      key: 'bsc',
      render: (_, row) => (
        <span
          style={{
            ...(bscColorMap[row.bsc] || { color: COLORS.muted, background: COLORS.mutedBg }),
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
      render: (_, row) => <span style={{ fontWeight: 500, color: COLORS.foreground }}>{row.name}</span>,
    },
    {
      title: 'Mục tiêu tháng',
      key: 'monthTarget',
      align: 'center',
      render: (_, row) =>
        row.monthTarget > 0 ? (
          <span style={{ color: COLORS.muted }}>
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
              color: COLORS.foreground,
              background: COLORS.primaryBg,
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
              color: COLORS.danger,
              background: COLORS.dangerBg,
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
            ...getRatingStyle(row.rate),
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
      render: () => <span style={{ color: COLORS.muted }}>{config.deptCoefficient}</span>,
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          padding: 16,
          borderRadius: 12,
          background: COLORS.primaryBg,
          border: '1px solid rgba(59,95,196,0.2)',
        }}
      >
        <Info size={20} color={COLORS.primary} style={{ marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 14 }}>
          <p style={{ fontWeight: 600, color: COLORS.foreground, margin: '0 0 4px' }}>Điểm KPI cuối tháng</p>
          <p style={{ color: COLORS.muted, margin: '0 0 2px' }}>
            Điểm cuối cùng = Điểm cá nhân × {config.individualRatio}% + Điểm phòng ban × {100 - config.individualRatio}%
          </p>
          <p style={{ color: COLORS.muted, margin: 0 }}>
            Hệ số phòng ban: <strong>{config.deptCoefficient}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: COLORS.muted }}>Tháng:</span>
        <Select
          value={String(selectedMonth)}
          onChange={(value) => setSelectedMonth(Number(value))}
          style={{ width: 140 }}
          options={monthNames.map((label, index) => ({ value: String(index), label }))}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <div
          style={{
            background: COLORS.card,
            borderRadius: 12,
            border: `1px solid ${COLORS.border}`,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: COLORS.primaryBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <User size={24} color={COLORS.primary} />
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                color: COLORS.muted,
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
            <p style={{ fontSize: 10, color: COLORS.muted, margin: 0 }}>Tỷ lệ: {config.individualRatio}%</p>
          </div>
        </div>

        <div
          style={{
            background: COLORS.card,
            borderRadius: 12,
            border: `1px solid ${COLORS.border}`,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: COLORS.mutedBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={24} color={COLORS.muted} />
          </div>
          <div>
            <p
              style={{
                fontSize: 11,
                color: COLORS.muted,
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
            <p style={{ fontSize: 10, color: COLORS.muted, margin: 0 }}>Tỷ lệ: {100 - config.individualRatio}%</p>
          </div>
        </div>

        <div
          style={{
            background: COLORS.card,
            borderRadius: 12,
            border: '2px solid rgba(59,95,196,0.3)',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 4px 12px rgba(59,95,196,0.1)',
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: COLORS.primary,
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
                color: COLORS.muted,
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
            <p style={{ fontSize: 10, color: COLORS.muted, margin: 0 }}>
              {monthNames[selectedMonth]} / {year}
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          background: COLORS.card,
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '12px 20px',
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.mutedBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3
            style={{
              fontWeight: 700,
              color: COLORS.foreground,
              fontSize: 14,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <TrendingUp size={16} color={COLORS.primary} />
            Điểm từng nhân viên — {monthNames[selectedMonth]}
          </h3>
        </div>
        <Table
          columns={peopleColumns}
          dataSource={peopleRows}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </div>

      <div
        style={{
          background: COLORS.card,
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${COLORS.border}`, background: COLORS.mutedBg }}>
          <h3 style={{ fontWeight: 700, color: COLORS.foreground, fontSize: 14, margin: 0 }}>
            Chi tiết từng KPI — {monthNames[selectedMonth]}
          </h3>
        </div>
        <Table
          columns={kpiBreakdownColumns}
          dataSource={scoreRows}
          rowKey="id"
          pagination={false}
          size="small"
          summary={() => (
            <Table.Summary.Row style={{ background: COLORS.primaryBg }}>
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
    </div>
  );
};

export default MonthlyScoreView;
