import { Input, Spin, Table, Tag } from 'antd';
import { calcCompletionRate } from '../../../utils/bonusUtils';
import { getRateStyle } from '../../../utils/scoreUtils';
import {
  EMPLOYEE_KPI_BSC_COLORS,
  EMPLOYEE_KPI_COLORS,
  EMPLOYEE_KPI_MONTHS,
  EMPLOYEE_KPI_PERIOD_ENUM,
  EMPLOYEE_KPI_QUARTERS,
} from './constants';
import { getMonthDateRange } from './utils';

export const RateBadge = ({ rate, size = 'normal' }) => {
  const style =
    size === 'small'
      ? {
          display: 'inline-flex',
          padding: '1px 4px',
          borderRadius: 4,
          fontSize: 10,
          fontWeight: 600,
          ...getRateStyle(rate),
        }
      : {
          display: 'inline-flex',
          padding: '2px 8px',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          ...getRateStyle(rate),
        };

  return <span style={style}>{rate.toFixed(size === 'small' ? 0 : 1)}%</span>;
};

const renderBscCell = (record, fontSize = 12) => ({
  children: (
    <span
      style={{
        ...(EMPLOYEE_KPI_BSC_COLORS[record._bsc] || {
          color: EMPLOYEE_KPI_COLORS.muted,
          background: EMPLOYEE_KPI_COLORS.mutedBg,
        }),
        display: 'inline-flex',
        padding: '4px 10px',
        borderRadius: 6,
        fontSize,
        fontWeight: 500,
      }}
    >
      {record._bsc}
    </span>
  ),
  props: { rowSpan: record._bscSpan },
});

export const YearKpiTable = ({ rows, helpers }) => {
  const yearColumns = [
    {
      title: 'BSC',
      key: 'bsc',
      width: '14%',
      render: (_, record) => renderBscCell(record, 14),
    },
    {
      title: 'Nhiệm vụ KPI',
      key: 'name',
      width: '20%',
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: EMPLOYEE_KPI_COLORS.foreground }}>{record.name}</span>
      ),
    },
    {
      title: 'Mục tiêu',
      key: 'target',
      width: '10%',
      render: (_, record) => (
        <span style={{ color: EMPLOYEE_KPI_COLORS.muted }}>
          {record.targetValue} {record.targetUnit}
        </span>
      ),
    },
    {
      title: 'Thực tế',
      key: 'actual',
      width: '10%',
      render: (_, record) => {
        const actual = helpers.getYearActual(record.id);
        return actual != null ? (
          <span style={{ fontWeight: 500, color: EMPLOYEE_KPI_COLORS.foreground }}>{actual}</span>
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
        const totalErrors = helpers.getYearErrors(record.id);
        return totalErrors > 0 ? (
          <span
            style={{
              display: 'inline-flex',
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              color: EMPLOYEE_KPI_COLORS.danger,
              background: EMPLOYEE_KPI_COLORS.dangerBg,
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
        const yearRate = helpers.getYearRate(record);
        if (yearRate == null) return <RateBadge rate={0} />;

        const penalty = helpers.getPenaltyForItem(record, helpers.getYearErrors(record.id), yearRate);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <RateBadge rate={Math.max(0, yearRate - penalty)} />
            {penalty > 0 && (
              <span style={{ fontSize: 10, color: EMPLOYEE_KPI_COLORS.muted, marginTop: 2 }}>
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
        <span style={{ fontWeight: 500, color: EMPLOYEE_KPI_COLORS.foreground }}>{record.weight}%</span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: '12%',
      align: 'center',
      render: (_, record) => {
        const yearRate = helpers.getYearRate(record);
        const totalErrors = helpers.getYearErrors(record.id);
        const penalty = yearRate == null ? 0 : helpers.getPenaltyForItem(record, totalErrors, yearRate);
        const adjustedRate = yearRate == null ? null : Math.max(0, yearRate - penalty);

        const style =
          adjustedRate == null
            ? { background: EMPLOYEE_KPI_COLORS.mutedBg, color: EMPLOYEE_KPI_COLORS.muted }
            : adjustedRate >= 85
              ? { background: EMPLOYEE_KPI_COLORS.successBg, color: EMPLOYEE_KPI_COLORS.success }
              : adjustedRate >= 70
                ? { background: EMPLOYEE_KPI_COLORS.warningBg, color: EMPLOYEE_KPI_COLORS.warning }
                : { background: EMPLOYEE_KPI_COLORS.dangerBg, color: EMPLOYEE_KPI_COLORS.danger };

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

  return (
    <div style={{ background: EMPLOYEE_KPI_COLORS.card, borderRadius: 8, border: `1px solid ${EMPLOYEE_KPI_COLORS.border}`, overflow: 'hidden' }}>
      <Table columns={yearColumns} dataSource={rows} rowKey="id" pagination={false} size="small" />
    </div>
  );
};

export const PeriodicKpiTable = ({ rows, period, helpers }) => {
  const periodColumns =
    period === EMPLOYEE_KPI_PERIOD_ENUM.QUARTER ? EMPLOYEE_KPI_QUARTERS : EMPLOYEE_KPI_MONTHS;

  const columns = [
    {
      title: 'BSC',
      key: 'bsc',
      width: 140,
      fixed: 'left',
      render: (_, record) => renderBscCell(record),
    },
    {
      title: 'Nhiệm vụ KPI',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: EMPLOYEE_KPI_COLORS.foreground }}>{record.name}</span>
      ),
    },
    {
      title: 'Hoàn thành (Năm)',
      key: 'yearCompletion',
      width: 110,
      align: 'center',
      render: (_, record) => {
        const yearRate = helpers.getYearRate(record);
        if (yearRate == null) return <RateBadge rate={0} />;
        const penalty = helpers.getPenaltyForItem(record, helpers.getYearErrors(record.id), yearRate);
        return <RateBadge rate={Math.max(0, yearRate - penalty)} />;
      },
    },
    ...periodColumns.map((columnLabel, periodIndex) => ({
      title: columnLabel,
      key: columnLabel,
      width: 90,
      align: 'center',
      render: (_, record) => {
        const errors =
          period === EMPLOYEE_KPI_PERIOD_ENUM.QUARTER
            ? helpers.getQuarterErrors(record.id, periodIndex)
            : helpers.getMonthErrors(record.id, periodIndex);

        if (period === EMPLOYEE_KPI_PERIOD_ENUM.QUARTER) {
          const quarterEntries = [0, 1, 2].map((index) =>
            helpers.getMonthEntry(record.id, periodIndex * 3 + index),
          );
          const hasData = quarterEntries.some((entry) => entry.actualValue != null);
          if (!hasData) return <span style={{ color: EMPLOYEE_KPI_COLORS.muted }}>—</span>;

          return errors > 0 ? (
            <Tag color="red" style={{ margin: 0 }}>
              {errors} lỗi
            </Tag>
          ) : (
            <span style={{ color: EMPLOYEE_KPI_COLORS.muted, fontSize: 11 }}>0 lỗi</span>
          );
        }

        const monthEntry = helpers.getMonthEntry(record.id, periodIndex);
        if (monthEntry.actualValue == null) {
          return <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 12 }}>—</span>;
        }

        const monthRate = helpers.getMonthRate(record, periodIndex);
        const adjustedRate =
          monthRate == null
            ? null
            : Math.max(0, monthRate - helpers.getPenaltyForItem(record, errors, monthRate));

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 11, color: EMPLOYEE_KPI_COLORS.foreground }}>
              {monthEntry.actualValue}
            </span>
            {adjustedRate == null ? (
              <span style={{ color: 'rgba(107,114,128,0.4)', fontSize: 12 }}>—</span>
            ) : (
              <RateBadge rate={adjustedRate} size="small" />
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <div style={{ background: EMPLOYEE_KPI_COLORS.card, borderRadius: 8, border: `1px solid ${EMPLOYEE_KPI_COLORS.border}`, overflow: 'hidden' }}>
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export const DailyKpiTable = ({
  dayMonth,
  setDayMonth,
  rows,
  loadingDay,
  dayEntries,
  helpers,
}) => {
  const { daysInMonth } = getMonthDateRange(dayMonth);

  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return `${dayMonth}-${String(day).padStart(2, '0')}`;
  });

  const columns = [
    {
      title: 'BSC',
      key: 'bsc',
      width: 140,
      fixed: 'left',
      render: (_, record) => renderBscCell(record),
    },
    {
      title: 'Nhiệm vụ KPI',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <span style={{ fontWeight: 500, color: EMPLOYEE_KPI_COLORS.foreground, fontSize: 14 }}>
          {record.name}
        </span>
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

        const penalty = rate == null ? 0 : helpers.getPenaltyForItem(record, entry.errorCount || 0, rate);
        const adjustedRate = rate == null ? null : Math.max(0, rate - penalty);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            {entry.actualValue != null && (
              <span style={{ fontSize: 10, color: EMPLOYEE_KPI_COLORS.foreground }}>
                {entry.actualValue}
              </span>
            )}
            {adjustedRate != null ? (
              <RateBadge rate={adjustedRate} size="small" />
            ) : entry.errorCount > 0 ? (
              <span
                style={{
                  display: 'inline-flex',
                  padding: '1px 4px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  color: EMPLOYEE_KPI_COLORS.danger,
                  background: EMPLOYEE_KPI_COLORS.dangerBg,
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
        <span style={{ fontSize: 14, color: EMPLOYEE_KPI_COLORS.muted, fontWeight: 500 }}>Tháng:</span>
        <Input
          type="month"
          value={dayMonth}
          onChange={(event) => setDayMonth(event.target.value)}
          style={{ width: 180, height: 32, fontSize: 14 }}
        />
      </div>

      {loadingDay ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin />
        </div>
      ) : (
        <div style={{ background: EMPLOYEE_KPI_COLORS.card, borderRadius: 8, border: `1px solid ${EMPLOYEE_KPI_COLORS.border}`, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={rows}
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
