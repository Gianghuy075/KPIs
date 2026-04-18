import { Button, Input, Spin, Table, Tabs } from 'antd';
import { Save } from 'lucide-react';
import { BSC_COLORS } from '../../../constants/bsc';
import { MONTH_NAMES_SHORT, QUARTER_NAMES } from '../../../constants/period';
import { KPI_COLORS } from '../../../constants/uiTokens';

const bscCell = (bsc) => (
  <span
    style={{
      display: 'inline-flex',
      padding: '4px 8px',
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
      ...(BSC_COLORS[bsc] || {}),
    }}
  >
    {bsc}
  </span>
);

const cardStyle = {
  background: KPI_COLORS.card,
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: `1px solid ${KPI_COLORS.border}`,
  overflow: 'hidden',
};

const cardHeaderStyle = {
  padding: '10px 24px',
  borderBottom: `1px solid ${KPI_COLORS.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const DataEntryTabs = ({
  year,
  flatRows,
  bscSpans,
  activeMonth,
  setActiveMonth,
  activeDate,
  setActiveDate,
  loadingDaily,
  savingDay,
  savingMonth,
  handleSaveDay,
  handleSaveMonth,
  getDailyEntry,
  getMonthEntry,
  updateDailyEntry,
  updateMonthEntry,
  getQuarterAgg,
  getYearAgg,
}) => {
  const dailyColumns = [
    {
      title: 'BSC',
      dataIndex: 'bsc',
      width: '14%',
      onCell: (row) => ({ rowSpan: bscSpans[row.id] }),
      render: (value) => bscCell(value),
    },
    {
      title: 'Tên KPI',
      dataIndex: 'name',
      width: '24%',
      render: (value) => (
        <span style={{ fontWeight: 500, color: KPI_COLORS.foreground, fontSize: 13 }}>{value}</span>
      ),
    },
    {
      title: 'Mục tiêu',
      width: '10%',
      align: 'center',
      render: (_, row) => (
        <span style={{ color: KPI_COLORS.muted, fontSize: 13 }}>
          {row.targetValue} {row.targetUnit}
        </span>
      ),
    },
    {
      title: 'Giá trị thực tế',
      width: '16%',
      render: (_, row) => (
        <Input
          value={getDailyEntry(row.id).actualValue}
          size="small"
          placeholder="Nhập giá trị..."
          onChange={(event) => updateDailyEntry(row.id, 'actualValue', event.target.value)}
        />
      ),
    },
    {
      title: 'Số lỗi',
      width: '14%',
      align: 'center',
      render: (_, row) => (
        <Input
          type="number"
          min={0}
          value={getDailyEntry(row.id).errorCount || ''}
          size="small"
          placeholder="0"
          style={{ textAlign: 'center' }}
          onChange={(event) =>
            updateDailyEntry(row.id, 'errorCount', Math.max(0, Number(event.target.value)))
          }
        />
      ),
    },
    {
      title: 'Ghi chú',
      width: '22%',
      render: (_, row) => (
        <Input
          value={getDailyEntry(row.id).note}
          size="small"
          placeholder="Ghi chú..."
          onChange={(event) => updateDailyEntry(row.id, 'note', event.target.value)}
        />
      ),
    },
  ];

  const monthlyColumns = [
    {
      title: 'BSC',
      dataIndex: 'bsc',
      width: '14%',
      onCell: (row) => ({ rowSpan: bscSpans[row.id] }),
      render: (value) => bscCell(value),
    },
    {
      title: 'Tên KPI',
      dataIndex: 'name',
      width: '24%',
      render: (value) => (
        <span style={{ fontWeight: 500, color: KPI_COLORS.foreground, fontSize: 13 }}>{value}</span>
      ),
    },
    {
      title: 'Mục tiêu',
      width: '10%',
      align: 'center',
      render: (_, row) => (
        <span style={{ color: KPI_COLORS.muted, fontSize: 13 }}>
          {row.targetValue} {row.targetUnit}
        </span>
      ),
    },
    {
      title: 'Giá trị thực tế',
      width: '16%',
      render: (_, row) => (
        <Input
          value={getMonthEntry(row.id, activeMonth).actualValue}
          size="small"
          placeholder="Nhập giá trị..."
          onChange={(event) => updateMonthEntry(row.id, activeMonth, 'actualValue', event.target.value)}
        />
      ),
    },
    {
      title: 'Số lỗi',
      width: '14%',
      align: 'center',
      render: (_, row) => (
        <Input
          type="number"
          min={0}
          value={getMonthEntry(row.id, activeMonth).errorCount || ''}
          size="small"
          placeholder="0"
          style={{ textAlign: 'center' }}
          onChange={(event) =>
            updateMonthEntry(
              row.id,
              activeMonth,
              'errorCount',
              Math.max(0, Number(event.target.value)),
            )
          }
        />
      ),
    },
    {
      title: 'Ghi chú',
      width: '22%',
      render: (_, row) => (
        <Input
          value={getMonthEntry(row.id, activeMonth).note}
          size="small"
          placeholder="Ghi chú..."
          onChange={(event) => updateMonthEntry(row.id, activeMonth, 'note', event.target.value)}
        />
      ),
    },
  ];

  const quarterlyColumns = [
    {
      title: 'BSC',
      dataIndex: 'bsc',
      width: '14%',
      onCell: (row) => ({ rowSpan: bscSpans[row.id] }),
      render: (value) => bscCell(value),
    },
    {
      title: 'Tên KPI',
      dataIndex: 'name',
      width: '26%',
      render: (value) => (
        <span style={{ fontWeight: 500, color: KPI_COLORS.foreground, fontSize: 13 }}>{value}</span>
      ),
    },
    ...QUARTER_NAMES.map((quarter, quarterIndex) => ({
      title: quarter,
      key: `q${quarterIndex}`,
      align: 'center',
      render: (_, row) => {
        const agg = getQuarterAgg(row.id, quarterIndex);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 12, color: KPI_COLORS.muted }}>{agg.value}</span>
            <span
              style={{
                display: 'inline-flex',
                padding: '1px 8px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                ...(agg.totalErrors > 0
                  ? { color: KPI_COLORS.danger, background: KPI_COLORS.dangerBg }
                  : { color: KPI_COLORS.muted, background: KPI_COLORS.mutedBg }),
              }}
            >
              {agg.totalErrors > 0 ? `${agg.totalErrors} lỗi` : '—'}
            </span>
          </div>
        );
      },
    })),
  ];

  const yearlyColumns = [
    {
      title: 'BSC',
      dataIndex: 'bsc',
      width: '14%',
      onCell: (row) => ({ rowSpan: bscSpans[row.id] }),
      render: (value) => bscCell(value),
    },
    {
      title: 'Tên KPI',
      dataIndex: 'name',
      width: '30%',
      render: (value) => (
        <span style={{ fontWeight: 500, color: KPI_COLORS.foreground, fontSize: 13 }}>{value}</span>
      ),
    },
    {
      title: 'Mục tiêu',
      width: '14%',
      align: 'center',
      render: (_, row) => (
        <span style={{ color: KPI_COLORS.muted, fontSize: 13 }}>
          {row.targetValue} {row.targetUnit}
        </span>
      ),
    },
    {
      title: 'Giá trị thực tế',
      width: '14%',
      align: 'center',
      render: (_, row) => (
        <span style={{ fontSize: 14, fontWeight: 500 }}>{getYearAgg(row.id).value}</span>
      ),
    },
    {
      title: 'Tổng lỗi',
      width: '14%',
      align: 'center',
      render: (_, row) => {
        const yr = getYearAgg(row.id);
        return (
          <span
            style={{
              display: 'inline-flex',
              padding: '1px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              ...(yr.totalErrors > 0
                ? { color: KPI_COLORS.danger, background: KPI_COLORS.dangerBg }
                : { color: KPI_COLORS.muted, background: KPI_COLORS.mutedBg }),
            }}
          >
            {yr.totalErrors}
          </span>
        );
      },
    },
    {
      title: 'Trạng thái',
      width: '14%',
      align: 'center',
      render: (_, row) => {
        const yr = getYearAgg(row.id);
        const status =
          yr.totalErrors === 0 ? 'Tốt' : yr.totalErrors <= 3 ? 'Chấp nhận' : 'Cần cải thiện';
        const style =
          yr.totalErrors === 0
            ? { color: KPI_COLORS.success, background: KPI_COLORS.successBg }
            : yr.totalErrors <= 3
              ? { color: KPI_COLORS.warning, background: KPI_COLORS.warningBg }
              : { color: KPI_COLORS.danger, background: KPI_COLORS.dangerBg };

        return (
          <span
            style={{
              display: 'inline-flex',
              padding: '2px 8px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              ...style,
            }}
          >
            {status}
          </span>
        );
      },
    },
  ];

  const tabItems = [
    {
      key: 'daily',
      label: 'Nhập theo Ngày',
      children: (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 14, color: KPI_COLORS.muted }}>Ngày:</span>
            <Input
              type="date"
              value={activeDate}
              onChange={(event) => setActiveDate(event.target.value)}
              style={{ width: 180 }}
              size="small"
            />
          </div>
          {loadingDaily ? (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <Spin />
            </div>
          ) : (
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: KPI_COLORS.foreground, margin: 0 }}>
                  Nhập liệu ngày {activeDate.split('-').reverse().join('/')}
                </h3>
                <Button
                  type="primary"
                  size="small"
                  icon={<Save size={14} />}
                  loading={savingDay}
                  onClick={handleSaveDay}
                >
                  Lưu
                </Button>
              </div>
              <Table columns={dailyColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'monthly',
      label: 'Nhập theo Tháng',
      children: (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {MONTH_NAMES_SHORT.map((monthLabel, monthIndex) => (
              <Button
                key={monthLabel}
                type={activeMonth === monthIndex ? 'primary' : 'default'}
                size="small"
                onClick={() => setActiveMonth(monthIndex)}
                style={{ fontSize: 12, padding: '0 12px' }}
              >
                {monthLabel}
              </Button>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: KPI_COLORS.foreground, margin: 0 }}>
                Nhập liệu tháng {activeMonth + 1}/{year}
              </h3>
              <Button
                type="primary"
                size="small"
                icon={<Save size={14} />}
                loading={savingMonth}
                onClick={handleSaveMonth}
              >
                Lưu
              </Button>
            </div>
            <Table columns={monthlyColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" />
          </div>
        </div>
      ),
    },
    {
      key: 'quarterly-view',
      label: 'Tổng hợp Quý',
      children: (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: KPI_COLORS.foreground, margin: 0 }}>
              Tổng hợp theo Quý
            </h3>
          </div>
          <Table columns={quarterlyColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" />
        </div>
      ),
    },
    {
      key: 'yearly-view',
      label: 'Tổng hợp Năm',
      children: (
        <div style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: KPI_COLORS.foreground, margin: 0 }}>
              Tổng hợp Năm
            </h3>
          </div>
          <Table columns={yearlyColumns} dataSource={flatRows} rowKey="id" pagination={false} size="small" />
        </div>
      ),
    },
  ];

  return <Tabs defaultActiveKey="daily" items={tabItems} style={{ marginBottom: 24 }} />;
};
