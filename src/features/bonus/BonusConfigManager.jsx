import { useState, useEffect, useMemo } from 'react';
import { Select, Card, InputNumber, Slider, Button, Table, Space, Spin, message, Row, Col, Statistic } from 'antd';
import { Save, Award } from 'lucide-react';
import workshopKpiService from '../../services/workshopKpiService';
import bonusConfigService from '../../services/bonusConfigService';

const COLORS = {
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  primary: '#3b5fc4',
  muted: '#6b7280',
  foreground: '#1a1f2e',
  card: '#ffffff',
  border: '#e2e5ef',
};

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear + 1];

const defaultConfig = () => ({ deptCoefficient: 1.0, individualRatio: 70, kpiWeightOverrides: {} });

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
        (cfg.weightOverrides || []).forEach(o => { overrides[o.kpiId] = o.customWeight; });
        setLocalConfig({ deptCoefficient: cfg.deptCoefficient ?? 1, individualRatio: cfg.individualRatio ?? 70, kpiWeightOverrides: overrides });
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
        .filter(([, w]) => w != null)
        .map(([kpiId, customWeight]) => ({ kpiId, customWeight }));
      if (overrides.length) {
        await bonusConfigService.saveWeightOverrides(savedConfig.id, overrides);
      }

      message.success('Đã lưu cấu hình thưởng');
    } catch {
      message.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const yearOptions = years.map(y => ({ value: String(y), label: String(y) }));
  const workshopOptions = workshops.map(w => ({ value: w.id, label: w.name }));

  const kpiColumns = [
    {
      title: 'Tên KPI', dataIndex: 'name',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{val}</div>
          <div style={{ fontSize: 12, color: COLORS.muted }}>{bscCategoryMap[row.bscCategoryId]}</div>
        </div>
      ),
    },
    {
      title: 'Trọng số gốc', dataIndex: 'weight', width: 120, align: 'center',
      render: val => <span style={{ fontWeight: 500 }}>{val}%</span>,
    },
    {
      title: 'Trọng số tùy chỉnh', width: 160, align: 'center',
      render: (_, row) => (
        <InputNumber
          min={0} max={100}
          value={localConfig.kpiWeightOverrides[row.id] ?? null}
          placeholder={String(row.weight)}
          onChange={v => setLocalConfig(prev => ({
            ...prev,
            kpiWeightOverrides: { ...prev.kpiWeightOverrides, [row.id]: v },
          }))}
          style={{ width: '100%' }}
          size="small"
        />
      ),
    },
  ];

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
            <Card title="Trọng số KPI tùy chỉnh" extra={<span style={{ fontSize: 12, color: COLORS.muted }}>Để trống = dùng trọng số gốc</span>}>
              <Table columns={kpiColumns} dataSource={kpis} rowKey="id" pagination={false} size="small" />
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
