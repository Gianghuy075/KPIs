import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  Row,
  Select,
  Slider,
  Space,
  Statistic,
  Table,
} from 'antd';
import { Award, Save } from 'lucide-react';
import { BSC_COLORS } from '../../../constants/bsc';
import { KPI_COLORS } from '../../../constants/uiTokens';
import { formatWeight, isSameWeight } from './constants';

export const BonusConfigFilters = ({
  selectedYear,
  onYearChange,
  yearOptions,
  selectedWorkshopId,
  onWorkshopChange,
  workshopOptions,
}) => (
  <Card>
    <Space>
      <span style={{ fontWeight: 500 }}>Năm:</span>
      <Select value={selectedYear} onChange={onYearChange} options={yearOptions} style={{ width: 100 }} />
      <span style={{ fontWeight: 500 }}>Phân xưởng:</span>
      <Select
        value={selectedWorkshopId}
        onChange={onWorkshopChange}
        options={workshopOptions}
        style={{ width: 200 }}
        placeholder="Chọn phân xưởng"
      />
    </Space>
  </Card>
);

export const BonusConfigSettingCards = ({ localConfig, setLocalConfig }) => (
  <Row gutter={16}>
    <Col span={12}>
      <Card title="Hệ số phân xưởng">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, color: KPI_COLORS.muted }}>Hệ số (0.1 – 3.0)</span>
          <InputNumber
            min={0.1}
            max={3}
            step={0.1}
            value={localConfig.deptCoefficient}
            onChange={(value) => setLocalConfig((prev) => ({ ...prev, deptCoefficient: value ?? 1 }))}
            style={{ width: 150 }}
          />
          <Statistic
            title="Hệ số hiện tại"
            value={localConfig.deptCoefficient}
            prefix={<Award size={16} />}
          />
        </div>
      </Card>
    </Col>
    <Col span={12}>
      <Card title="Tỉ lệ cá nhân / tập thể">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, color: KPI_COLORS.muted }}>
            Cá nhân: {localConfig.individualRatio}% — Tập thể: {100 - localConfig.individualRatio}%
          </span>
          <Slider
            min={0}
            max={100}
            value={localConfig.individualRatio}
            onChange={(value) => setLocalConfig((prev) => ({ ...prev, individualRatio: value }))}
            marks={{ 0: '0%', 50: '50%', 70: '70%', 100: '100%' }}
          />
        </div>
      </Card>
    </Col>
  </Row>
);

export const BonusWeightOverrideTable = ({
  kpis,
  bscCategoryMap,
  localConfig,
  updateCustomWeight,
  totalOriginalWeight,
  totalCustomWeight,
}) => {
  const kpiWeightColumns = [
    {
      title: 'BSC',
      key: 'bsc',
      width: 140,
      render: (_, kpi) => {
        const bscName = bscCategoryMap[kpi.bscCategoryId] || 'Khác';
        const style = BSC_COLORS[bscName] || { color: KPI_COLORS.muted, background: '#f3f4f6' };
        return (
          <span
            style={{
              ...style,
              display: 'inline-flex',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {bscName}
          </span>
        );
      },
    },
    {
      title: 'Tên KPI',
      key: 'name',
      render: (_, kpi) => <span style={{ fontWeight: 500, color: KPI_COLORS.foreground }}>{kpi.name}</span>,
    },
    {
      title: 'Mục tiêu',
      key: 'target',
      align: 'center',
      render: (_, kpi) => (
        <span style={{ fontSize: 14, color: KPI_COLORS.muted }}>
          {kpi.targetValue} {kpi.targetUnit}
        </span>
      ),
    },
    {
      title: 'Trọng số gốc',
      key: 'weight',
      align: 'center',
      render: (_, kpi) => <span style={{ fontWeight: 700 }}>{formatWeight(kpi.weight)}%</span>,
    },
    {
      title: 'Trọng số PB',
      key: 'customWeight',
      align: 'center',
      render: (_, row) => {
        const baseWeight = Number(row.weight || 0);
        const customWeight = localConfig.kpiWeightOverrides[row.id];
        const isCustom = customWeight !== undefined && !isSameWeight(customWeight, baseWeight);

        return (
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder={formatWeight(baseWeight)}
            value={isCustom ? String(customWeight) : ''}
            onChange={(event) => updateCustomWeight(row.id, event.target.value)}
            style={{
              width: 80,
              textAlign: 'center',
              fontWeight: 700,
              borderColor: isCustom ? KPI_COLORS.primary : undefined,
              background: isCustom ? KPI_COLORS.primaryBg : undefined,
            }}
          />
        );
      },
    },
  ];

  const kpiWeightData = [
    ...kpis,
    {
      id: '__total__',
      _isTotal: true,
    },
  ];

  const columns = kpiWeightColumns.map((col, index) => ({
    ...col,
    render: (value, record) => {
      if (record._isTotal) {
        if (index === 0) {
          return {
            children: (
              <span style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase' }}>
                Tổng trọng số:
              </span>
            ),
            props: { colSpan: 3, style: { textAlign: 'right' } },
          };
        }
        if (index === 1 || index === 2) return { props: { colSpan: 0 } };

        if (index === 3) {
          return (
            <span style={{ fontWeight: 700, textAlign: 'center', display: 'block' }}>
              {formatWeight(totalOriginalWeight)}%
            </span>
          );
        }

        if (index === 4) {
          return (
            <span
              style={{
                fontWeight: 900,
                fontSize: 18,
                color: isSameWeight(totalCustomWeight, 100) ? KPI_COLORS.success : KPI_COLORS.danger,
                display: 'block',
                textAlign: 'center',
              }}
            >
              {formatWeight(totalCustomWeight)}%
            </span>
          );
        }
      }

      if (typeof col.render === 'function') return col.render(value, record);
      return value;
    },
  }));

  return (
    <Card
      title="Trọng số KPI tùy chỉnh"
      extra={
        <span style={{ fontSize: 12, color: KPI_COLORS.muted }}>
          Để trống hoặc bằng trọng số gốc = dùng mặc định
        </span>
      }
    >
      <Table
        columns={columns}
        dataSource={kpiWeightData}
        rowKey="id"
        pagination={false}
        size="small"
        rowClassName={(record) => (record._isTotal ? 'ant-table-summary' : '')}
      />
    </Card>
  );
};

export const BonusSaveAction = ({ saving, disabled, onSave }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
    <Button type="primary" icon={<Save size={16} />} loading={saving} onClick={onSave} disabled={disabled}>
      Lưu cấu hình
    </Button>
  </div>
);
