import { useState, useEffect, useMemo } from 'react';
import {
  Select,
  Card,
  InputNumber,
  Slider,
  Button,
  Table,
  Space,
  Spin,
  message,
  Row,
  Col,
  Statistic,
  Input,
} from 'antd';
import { Save, Award } from 'lucide-react';
import workshopKpiService from '../../services/workshopKpiService';
import bonusConfigService from '../../services/bonusConfigService';

const COLORS = {
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  primary: '#3b5fc4',
  primaryBg: 'rgba(59,95,196,0.08)',
  muted: '#6b7280',
  foreground: '#1a1f2e',
  card: '#ffffff',
  border: '#e2e5ef',
};

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear + 1];

const defaultConfig = () => ({ deptCoefficient: 1.0, individualRatio: 70, kpiWeightOverrides: {} });

const bscColorMap = {
  'Tài chính': { color: '#1d4ed8', background: 'rgba(59,130,246,0.1)' },
  'Khách hàng': { color: '#15803d', background: 'rgba(16,185,129,0.1)' },
  'Quy trình nội bộ': { color: '#b45309', background: 'rgba(245,158,11,0.1)' },
  'Học hỏi & Phát triển': { color: '#7c3aed', background: 'rgba(168,85,247,0.1)' },
};

const normalizeWeight = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(100, Math.round(num * 100) / 100));
};

const isSameWeight = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 0.0001;

const formatWeight = (value) => {
  const num = Number(value || 0);
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, '');
};

const BonusConfigManager = () => {
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);

  const [workshops, setWorkshops] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [configs, setConfigs] = useState([]);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingKpis, setLoadingKpis] = useState(false);
  const [saving, setSaving] = useState(false);

  const [localConfig, setLocalConfig] = useState(defaultConfig());

  useEffect(() => {
    Promise.all([
      workshopKpiService.listWorkshops(),
      workshopKpiService.listBscCategories(),
    ]).then(([ws, bsc]) => {
      setWorkshops(ws);
      setBscCategories(bsc);
      if (ws.length) setSelectedWorkshopId(ws[0].id);
    }).catch(() => message.error('Không thể tải dữ liệu khởi tạo'))
      .finally(() => setLoadingMeta(false));
  }, []);

  useEffect(() => {
    if (!selectedWorkshopId) return;
    setLoadingKpis(true);
    Promise.all([
      workshopKpiService.list({ year: selectedYear, phanXuongId: selectedWorkshopId }),
      bonusConfigService.list({ year: selectedYear, phanXuongId: selectedWorkshopId }),
    ]).then(([kpiList, cfgList]) => {
      setKpis(kpiList);
      setConfigs(cfgList);
      if (cfgList.length) {
        const cfg = cfgList[0];
        const overrides = {};
        (cfg.weightOverrides || []).forEach(o => { overrides[o.kpiId] = Number(o.customWeight); });
        setLocalConfig({
          deptCoefficient: Number(cfg.deptCoefficient ?? 1),
          individualRatio: Number(cfg.individualRatio ?? 70),
          kpiWeightOverrides: overrides,
        });
      } else {
        setLocalConfig(defaultConfig());
      }
    }).catch(() => message.error('Không thể tải cấu hình'))
      .finally(() => setLoadingKpis(false));
  }, [selectedWorkshopId, selectedYear]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [bscCategories]);

  const baseWeightMap = useMemo(
    () => Object.fromEntries(kpis.map(kpi => [kpi.id, Number(kpi.weight || 0)])),
    [kpis],
  );

  const totalOriginalWeight = useMemo(
    () => kpis.reduce((sum, kpi) => sum + Number(kpi.weight || 0), 0),
    [kpis],
  );

  const totalCustomWeight = useMemo(
    () =>
      kpis.reduce(
        (sum, kpi) =>
          sum +
          Number(
            localConfig.kpiWeightOverrides[kpi.id] !== undefined
              ? localConfig.kpiWeightOverrides[kpi.id]
              : kpi.weight || 0,
          ),
        0,
      ),
    [kpis, localConfig.kpiWeightOverrides],
  );

  const updateCustomWeight = (kpiId, rawValue) => {
    setLocalConfig(prev => {
      const overrides = { ...prev.kpiWeightOverrides };
      const baseWeight = baseWeightMap[kpiId] ?? 0;
      if (rawValue === '') {
        delete overrides[kpiId];
        return { ...prev, kpiWeightOverrides: overrides };
      }

      const normalized = normalizeWeight(rawValue);
      if (normalized == null || isSameWeight(normalized, baseWeight)) {
        delete overrides[kpiId];
      } else {
        overrides[kpiId] = normalized;
      }
      return { ...prev, kpiWeightOverrides: overrides };
    });
  };

  const handleSave = async () => {
    if (!selectedWorkshopId) return;
    setSaving(true);
    try {
      const payload = {
        year: Number(selectedYear),
        phanXuongId: selectedWorkshopId,
        deptCoefficient: localConfig.deptCoefficient,
        individualRatio: localConfig.individualRatio,
      };

      let savedConfig;
      if (configs.length) {
        savedConfig = await bonusConfigService.update(configs[0].id, payload);
      } else {
        savedConfig = await bonusConfigService.create(payload);
        setConfigs([savedConfig]);
      }

      const overrides = Object.entries(localConfig.kpiWeightOverrides)
        .map(([kpiId, customWeight]) => ({
          kpiId,
          customWeight: normalizeWeight(customWeight),
        }))
        .filter(
          row =>
            row.customWeight != null &&
            !isSameWeight(row.customWeight, baseWeightMap[row.kpiId]),
        );

      await bonusConfigService.saveWeightOverrides(savedConfig.id, { overrides });

      message.success('Đã lưu cấu hình thưởng');
    } catch {
      message.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const yearOptions = years.map(y => ({ value: String(y), label: String(y) }));
  const workshopOptions = workshops.map(w => ({ value: w.id, label: w.name }));

  const kpiWeightColumns = [
    {
      title: 'BSC',
      key: 'bsc',
      width: 140,
      render: (_, kpi) => {
        const bscName = bscCategoryMap[kpi.bscCategoryId] || 'Khác';
        const style = bscColorMap[bscName] || { color: COLORS.muted, background: '#f3f4f6' };
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
      render: (_, kpi) => <span style={{ fontWeight: 500, color: COLORS.foreground }}>{kpi.name}</span>,
    },
    {
      title: 'Mục tiêu',
      key: 'target',
      align: 'center',
      render: (_, kpi) => (
        <span style={{ fontSize: 14, color: COLORS.muted }}>
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
      render: (_, row) => (
        (() => {
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
              onChange={(e) => updateCustomWeight(row.id, e.target.value)}
              style={{
                width: 80,
                textAlign: 'center',
                fontWeight: 700,
                borderColor: isCustom ? COLORS.primary : undefined,
                background: isCustom ? COLORS.primaryBg : undefined,
              }}
            />
          );
        })()
      ),
    },
  ];

  const kpiWeightData = useMemo(
    () => [
      ...kpis,
      {
        id: '__total__',
        _isTotal: true,
      },
    ],
    [kpis],
  );

  const kpiWeightColumnsWithTotal = kpiWeightColumns.map((col, index) => ({
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
                color: isSameWeight(totalCustomWeight, 100) ? COLORS.success : COLORS.danger,
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

  if (loadingMeta) return <div style={{ textAlign: 'center', padding: 64 }}><Spin size="large" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Space>
          <span style={{ fontWeight: 500 }}>Năm:</span>
          <Select value={selectedYear} onChange={setSelectedYear} options={yearOptions} style={{ width: 100 }} />
          <span style={{ fontWeight: 500 }}>Phân xưởng:</span>
          <Select value={selectedWorkshopId} onChange={setSelectedWorkshopId} options={workshopOptions} style={{ width: 200 }} placeholder="Chọn phân xưởng" />
        </Space>
      </Card>

      {loadingKpis ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Card title="Hệ số phân xưởng">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, color: COLORS.muted }}>Hệ số (0.1 – 3.0)</span>
                  <InputNumber
                    min={0.1} max={3} step={0.1}
                    value={localConfig.deptCoefficient}
                    onChange={v => setLocalConfig(prev => ({ ...prev, deptCoefficient: v }))}
                    style={{ width: 150 }}
                  />
                  <Statistic title="Hệ số hiện tại" value={localConfig.deptCoefficient} prefix={<Award size={16} />} />
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Tỉ lệ cá nhân / tập thể">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 14, color: COLORS.muted }}>Cá nhân: {localConfig.individualRatio}% — Tập thể: {100 - localConfig.individualRatio}%</span>
                  <Slider
                    min={0} max={100}
                    value={localConfig.individualRatio}
                    onChange={v => setLocalConfig(prev => ({ ...prev, individualRatio: v }))}
                    marks={{ 0: '0%', 50: '50%', 70: '70%', 100: '100%' }}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {kpis.length > 0 && (
            <Card
              title="Trọng số KPI tùy chỉnh"
              extra={<span style={{ fontSize: 12, color: COLORS.muted }}>Để trống hoặc bằng trọng số gốc = dùng mặc định</span>}
            >
              <Table
                columns={kpiWeightColumnsWithTotal}
                dataSource={kpiWeightData}
                rowKey="id"
                pagination={false}
                size="small"
                rowClassName={(record) => (record._isTotal ? 'ant-table-summary' : '')}
              />
            </Card>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" icon={<Save size={16} />} loading={saving} onClick={handleSave} disabled={!selectedWorkshopId}>
              Lưu cấu hình
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default BonusConfigManager;
