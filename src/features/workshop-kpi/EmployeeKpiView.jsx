import { useEffect, useMemo, useState } from 'react';
import { Input, Spin, Table, Tabs, Tag } from 'antd';
import { calculatePenalty } from '../../utils/penaltyUtils';
import { calcCompletionRate } from '../../utils/bonusUtils';
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

const BSC_ORDER = ['Tài chính', 'Khách hàng', 'Quy trình nội bộ', 'Học hỏi & Phát triển'];

const bscColorMap = {
  'Tài chính': { color: '#1d4ed8', background: 'rgba(59,130,246,0.1)' },
  'Khách hàng': { color: '#15803d', background: 'rgba(16,185,129,0.1)' },
  'Quy trình nội bộ': { color: '#b45309', background: 'rgba(245,158,11,0.1)' },
  'Học hỏi & Phát triển': { color: '#7c3aed', background: 'rgba(168,85,247,0.1)' },
};

const periodLabels = {
  year: 'Theo Năm',
  quarter: 'Theo Quý',
  month: 'Theo Tháng',
  day: 'Theo Ngày',
};

const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];

const getRatingStyle = (rate) =>
  rate >= 85
    ? { color: COLORS.success, background: COLORS.successBg }
    : rate >= 70
      ? { color: COLORS.warning, background: COLORS.warningBg }
      : { color: COLORS.danger, background: COLORS.dangerBg };

const renderRateBadge = (rate, size = 'normal') => {
  const style =
    size === 'small'
      ? {
          display: 'inline-flex',
          padding: '1px 4px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          ...getRatingStyle(rate),
        }
      : {
          display: 'inline-flex',
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          ...getRatingStyle(rate),
        };

  return <span style={style}>{rate.toFixed(size === 'small' ? 0 : 1)}%</span>;
};

const EmployeeKpiView = ({ kpis, bscCategoryMap, penaltyLogics, year, allEntries }) => {
  const [dayMonth, setDayMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [dayEntries, setDayEntries] = useState({});
  const [loadingDay, setLoadingDay] = useState(false);

  const flatRows = useMemo(() => {
    const enriched = kpis.map((kpi) => ({
      ...kpi,
      bsc: bscCategoryMap?.[kpi.bscCategoryId] || 'Khác',
    }));

    return enriched.sort((a, b) => {
      const ai = BSC_ORDER.indexOf(a.bsc);
      const bi = BSC_ORDER.indexOf(b.bsc);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [kpis, bscCategoryMap]);

  const bscGroups = useMemo(() => {
    const groups = {};
    flatRows.forEach((row) => {
      if (!groups[row.bsc]) groups[row.bsc] = [];
      groups[row.bsc].push(row);
    });
    return groups;
  }, [flatRows]);

  const rowsWithBscSpan = useMemo(() => {
    const rows = [];
    const orderedBsc = BSC_ORDER.filter((b) => bscGroups[b]).concat(
      Object.keys(bscGroups).filter((b) => !BSC_ORDER.includes(b)),
    );

    orderedBsc.forEach((bscName) => {
      const items = bscGroups[bscName] || [];
      items.forEach((item, idx) => {
        rows.push({ ...item, _bsc: bscName, _bscSpan: idx === 0 ? items.length : 0 });
      });
    });

    return rows;
  }, [bscGroups]);

  useEffect(() => {
    if (!flatRows.length) {
      setDayEntries({});
      return;
    }

    const [y, m] = dayMonth.split('-');
    const daysInMonth = new Date(Number(y), Number(m), 0).getDate();
    const from = `${dayMonth}-01`;
    const to = `${dayMonth}-${String(daysInMonth).padStart(2, '0')}`;

    setLoadingDay(true);
    Promise.all(
      flatRows.map(async (kpi) => {
        try {
          const entries = await workshopKpiService.listDailyEntries(kpi.id, from, to);
          const map = {};
          (entries || []).forEach((entry) => {
            const key = entry.entryDate || entry.date;
            if (key) map[key] = entry;
          });
          return [kpi.id, map];
        } catch {
          return [kpi.id, {}];
        }
      }),
    )
      .then((results) => {
        const merged = {};
        results.forEach(([id, map]) => {
          merged[id] = map;
        });
        setDayEntries(merged);
      })
      .finally(() => setLoadingDay(false));
  }, [flatRows, dayMonth]);

  const getMonthEntry = (kpiId, monthIdx) =>
    allEntries[kpiId]?.[monthIdx] ?? { actualValue: null, errorCount: 0 };

  const getPenaltyForItem = (item, errors, rate) => {
    const logic = penaltyLogics?.find((logicItem) => logicItem.id === item.penaltyLogicId);
    return calculatePenalty(logic, errors, rate);
  };

  const getYearActual = (kpiId) => {
    const entries = Array.from({ length: 12 }, (_, i) => getMonthEntry(kpiId, i));
    return entries.filter((entry) => entry.actualValue != null).pop()?.actualValue ?? null;
  };

  const getYearErrors = (kpiId) =>
    Array.from({ length: 12 }, (_, i) => getMonthEntry(kpiId, i)).reduce(
      (sum, entry) => sum + (entry.errorCount || 0),
      0,
    );

  const getMonthErrors = (kpiId, monthIdx) => getMonthEntry(kpiId, monthIdx).errorCount || 0;

  const getQuarterErrors = (kpiId, quarterIdx) => {
    const start = quarterIdx * 3;
    return [0, 1, 2].reduce((sum, i) => sum + getMonthErrors(kpiId, start + i), 0);
  };

  const getYearRate = (item) => {
    const actual = getYearActual(item.id);
    if (actual == null || !item.targetValue) return null;
    return calcCompletionRate(Number(actual), Number(item.targetValue));
  };

  const getMonthRate = (item, monthIdx) => {
    const entry = getMonthEntry(item.id, monthIdx);
    if (entry.actualValue == null || !item.targetValue) return null;
    const monthTarget = Number(item.targetValue) / 12;
    return monthTarget > 0 ? calcCompletionRate(Number(entry.actualValue), monthTarget) : null;
  };

  const yearColumns = [
    {
      title: 'BSC',
      key: 'bsc',
      width: '14%',
      render: (_, record) => ({
        children: (
          <span
            style={{
              ...(bscColorMap[record._bsc] || { color: COLORS.muted, background: COLORS.mutedBg }),
              display: 'inline-flex',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {record._bsc}
          </span>
        ),
        props: { rowSpan: record._bscSpan },
      }),
    },
    {
      title: 'Nhiệm vụ KPI',
      key: 'name',
      width: '20%',
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: COLORS.foreground }}>{record.name}</span>
      ),
    },
    {
      title: 'Mục tiêu',
      key: 'target',
      width: '10%',
      render: (_, record) => (
        <span style={{ color: COLORS.muted }}>
          {record.targetValue} {record.targetUnit}
        </span>
      ),
    },
    {
      title: 'Thực tế',
      key: 'actual',
      width: '10%',
      render: (_, record) => {
        const actual = getYearActual(record.id);
        return actual != null ? (
          <span style={{ fontWeight: 500, color: COLORS.foreground }}>{actual}</span>
        ) : (
          <span style={{ color: 'rgba(107,114,128,0.5)', fontSize: 12 }}>—</span>
        );
      },
    },
    {
      title: 'Số lỗi',
      key: 'errors',
      width: '8%',
      align: 'center',
      render: (_, record) => {
        const totalErrors = getYearErrors(record.id);
        return totalErrors > 0 ? (
          <span
            style={{
              display: 'inline-flex',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.danger,
              background: COLORS.dangerBg,
            }}
          >
            {totalErrors}
          </span>
        ) : (
          <span style={{ color: 'rgba(107,114,128,0.5)', fontSize: 12 }}>0</span>
        );
      },
    },
    {
      title: 'Hệ số hoàn thành',
      key: 'completion',
      width: '14%',
      align: 'center',
      render: (_, record) => {
        const yearRate = getYearRate(record);
        if (yearRate == null) return renderRateBadge(0);
        const penalty = getPenaltyForItem(record, getYearErrors(record.id), yearRate);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {renderRateBadge(Math.max(0, yearRate - penalty))}
            {penalty > 0 && (
              <span style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
                ({yearRate.toFixed(1)}% -{penalty.toFixed(1)})
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Trọng số',
      key: 'weight',
      width: '10%',
      align: 'right',
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: COLORS.foreground }}>{record.weight}%</span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: '12%',
      align: 'center',
      render: (_, record) => {
        const yearRate = getYearRate(record);
        const totalErrors = getYearErrors(record.id);
        const penalty = yearRate == null ? 0 : getPenaltyForItem(record, totalErrors, yearRate);
        const adjustedRate = yearRate == null ? null : Math.max(0, yearRate - penalty);

        const style =
          adjustedRate == null
            ? { background: COLORS.mutedBg, color: COLORS.muted }
            : adjustedRate >= 85
              ? { background: COLORS.successBg, color: COLORS.success }
              : adjustedRate >= 70
                ? { background: COLORS.warningBg, color: COLORS.warning }
                : { background: COLORS.dangerBg, color: COLORS.danger };

        const status =
          adjustedRate == null
            ? 'Chưa có dữ liệu'
            : adjustedRate >= 85
              ? 'Hoàn thành tốt'
              : adjustedRate >= 70
                ? 'Đạt'
                : 'Cần cải thiện';

        return (
          <span
            style={{
              ...style,
              display: 'inline-flex',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {status}
          </span>
        );
      },
    },
  ];

  const renderPeriodicView = (period) => {
    const periodColumns = period === 'quarter' ? quarterNames : monthNames;

    const columns = [
      {
        title: 'BSC',
        key: 'bsc',
        width: 140,
        fixed: 'left',
        render: (_, record) => ({
          children: (
            <span
              style={{
                ...(bscColorMap[record._bsc] || { color: COLORS.muted, background: COLORS.mutedBg }),
                display: 'inline-flex',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {record._bsc}
            </span>
          ),
          props: { rowSpan: record._bscSpan },
        }),
      },
      {
        title: 'Nhiệm vụ KPI',
        key: 'name',
        width: 200,
        fixed: 'left',
        render: (_, record) => (
          <span style={{ fontWeight: 500, color: COLORS.foreground }}>{record.name}</span>
        ),
      },
      {
        title: 'Hoàn thành (Năm)',
        key: 'yearCompletion',
        width: 110,
        align: 'center',
        render: (_, record) => {
          const yearRate = getYearRate(record);
          if (yearRate == null) return renderRateBadge(0);
          const penalty = getPenaltyForItem(record, getYearErrors(record.id), yearRate);
          return renderRateBadge(Math.max(0, yearRate - penalty));
        },
      },
      ...periodColumns.map((col, periodIndex) => ({
        title: col,
        key: col,
        width: 90,
        align: 'center',
        render: (_, record) => {
          const errors =
            period === 'quarter'
              ? getQuarterErrors(record.id, periodIndex)
              : getMonthErrors(record.id, periodIndex);

          if (period === 'quarter') {
            const quarterEntries = [0, 1, 2].map((i) =>
              getMonthEntry(record.id, periodIndex * 3 + i),
            );
            const hasData = quarterEntries.some((entry) => entry.actualValue != null);
            if (!hasData) return <span style={{ color: COLORS.muted }}>—</span>;

            return errors > 0 ? (
              <Tag color="red" style={{ margin: 0 }}>
                {errors} lỗi
              </Tag>
            ) : (
              <span style={{ color: COLORS.muted, fontSize: 11 }}>0 lỗi</span>
            );
          }

          const monthEntry = getMonthEntry(record.id, periodIndex);
          if (monthEntry.actualValue == null) {
            return <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 12 }}>—</span>;
          }

          const monthRate = getMonthRate(record, periodIndex);
          const adjustedRate =
            monthRate == null
              ? null
              : Math.max(0, monthRate - getPenaltyForItem(record, errors, monthRate));

          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ fontSize: 11, color: COLORS.foreground }}>{monthEntry.actualValue}</span>
              {adjustedRate == null ? (
                <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 12 }}>—</span>
              ) : (
                renderRateBadge(adjustedRate, 'small')
              )}
            </div>
          );
        },
      })),
    ];

    return (
      <div style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={rowsWithBscSpan}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
        />
      </div>
    );
  };

  const renderDayView = () => {
    const [y, m] = dayMonth.split('-');
    const daysInMonth = new Date(Number(y), Number(m), 0).getDate();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return `${dayMonth}-${String(day).padStart(2, '0')}`;
    });

    const columns = [
      {
        title: 'BSC',
        key: 'bsc',
        width: 140,
        fixed: 'left',
        render: (_, record) => ({
          children: (
            <span
              style={{
                ...(bscColorMap[record._bsc] || { color: COLORS.muted, background: COLORS.mutedBg }),
                display: 'inline-flex',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {record._bsc}
            </span>
          ),
          props: { rowSpan: record._bscSpan },
        }),
      },
      {
        title: 'Nhiệm vụ KPI',
        key: 'name',
        width: 200,
        fixed: 'left',
        render: (_, record) => (
          <span style={{ fontWeight: 500, color: COLORS.foreground, fontSize: 14 }}>{record.name}</span>
        ),
      },
      ...days.map((dateKey) => ({
        title: <span style={{ fontSize: 12 }}>{parseInt(dateKey.split('-')[2], 10)}</span>,
        key: dateKey,
        width: 64,
        align: 'center',
        render: (_, record) => {
          const entry = dayEntries[record.id]?.[dateKey];
          if (!entry || (entry.actualValue == null && !entry.errorCount)) {
            return <span style={{ color: 'rgba(107,114,128,0.3)', fontSize: 12 }}>—</span>;
          }

          const dailyTarget = Number(record.targetValue) / daysInMonth;
          const rate =
            entry.actualValue != null && dailyTarget > 0
              ? calcCompletionRate(Number(entry.actualValue), dailyTarget)
              : null;
          const penalty = rate == null ? 0 : getPenaltyForItem(record, entry.errorCount || 0, rate);
          const adjustedRate = rate == null ? null : Math.max(0, rate - penalty);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {entry.actualValue != null && (
                <span style={{ fontSize: 10, color: COLORS.foreground }}>{entry.actualValue}</span>
              )}
              {adjustedRate != null ? (
                renderRateBadge(adjustedRate, 'small')
              ) : entry.errorCount > 0 ? (
                <span
                  style={{
                    display: 'inline-flex',
                    padding: '1px 4px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                    color: COLORS.danger,
                    background: COLORS.dangerBg,
                  }}
                >
                  {entry.errorCount} lỗi
                </span>
              ) : null}
            </div>
          );
        },
      })),
    ];

    return (
      <div>
        <div style={{ padding: '12px 0 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: COLORS.muted, fontWeight: 500 }}>Tháng:</span>
          <Input
            type="month"
            value={dayMonth}
            onChange={(e) => setDayMonth(e.target.value)}
            style={{ width: 180, height: 32, fontSize: 14 }}
          />
        </div>

        {loadingDay ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : (
          <div style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
            <Table
              columns={columns}
              dataSource={rowsWithBscSpan}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 'max-content' }}
            />
          </div>
        )}
      </div>
    );
  };

  const tabItems = [
    {
      key: 'year',
      label: periodLabels.year,
      children: (
        <div style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: 'hidden' }}>
          <Table columns={yearColumns} dataSource={rowsWithBscSpan} rowKey="id" pagination={false} size="small" />
        </div>
      ),
    },
    {
      key: 'quarter',
      label: periodLabels.quarter,
      children: renderPeriodicView('quarter'),
    },
    {
      key: 'month',
      label: periodLabels.month,
      children: renderPeriodicView('month'),
    },
    {
      key: 'day',
      label: periodLabels.day,
      children: renderDayView(),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 14, color: COLORS.muted }}>
          Năm: <span style={{ fontWeight: 600, color: COLORS.foreground }}>{year}</span>
        </span>
      </div>
      <Tabs defaultActiveKey="year" items={tabItems} />
    </div>
  );
};

export default EmployeeKpiView;
