import { useEffect, useMemo, useState } from 'react';
import { Spin, message } from 'antd';
import bonusConfigService from '../../../services/bonusConfigService';
import { toYearOptions } from '../../../constants/year';
import { useWorkshopKpiDataset } from '../../../hooks/useWorkshopKpiDataset';
import { useWorkshopKpiMeta } from '../../../hooks/useWorkshopKpiMeta';
import {
  BONUS_CONFIG_CURRENT_YEAR,
  BONUS_CONFIG_YEARS,
  isSameWeight,
  normalizeWeight,
} from './constants';
import { useBonusConfigState } from './useBonusConfigState';
import {
  BonusConfigFilters,
  BonusConfigSettingCards,
  BonusSaveAction,
  BonusWeightOverrideTable,
} from './components';

const BonusConfigManager = () => {
  const [selectedYear, setSelectedYear] = useState(String(BONUS_CONFIG_CURRENT_YEAR));
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    workshops,
    bscCategories,
    loading: loadingMeta,
    error: metaError,
  } = useWorkshopKpiMeta({ includeWorkshops: true });

  useEffect(() => {
    if (workshops.length && !selectedWorkshopId) {
      setSelectedWorkshopId(workshops[0].id);
    }
  }, [selectedWorkshopId, workshops]);

  const {
    kpis,
    bonusConfig,
    loading: loadingKpis,
    error: datasetError,
    reload: reloadDataset,
  } = useWorkshopKpiDataset({
    year: selectedYear,
    workshopId: selectedWorkshopId,
    includeBonusConfig: true,
    includeMonthlyEntries: false,
    enabled: Boolean(selectedWorkshopId),
  });

  const { localConfig, setLocalConfig } = useBonusConfigState({ bonusConfig });

  useEffect(() => {
    if (metaError) message.error(metaError);
  }, [metaError]);

  useEffect(() => {
    if (datasetError) message.error(datasetError);
  }, [datasetError]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach((item) => {
      map[item.id] = item.name;
    });
    return map;
  }, [bscCategories]);

  const baseWeightMap = useMemo(
    () => Object.fromEntries(kpis.map((kpi) => [kpi.id, Number(kpi.weight || 0)])),
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
    setLocalConfig((prev) => {
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
      if (bonusConfig?.id) {
        savedConfig = await bonusConfigService.update(bonusConfig.id, payload);
      } else {
        savedConfig = await bonusConfigService.create(payload);
      }

      const overrides = Object.entries(localConfig.kpiWeightOverrides)
        .map(([kpiId, customWeight]) => ({
          kpiId,
          customWeight: normalizeWeight(customWeight),
        }))
        .filter(
          (row) =>
            row.customWeight != null &&
            !isSameWeight(row.customWeight, baseWeightMap[row.kpiId]),
        );

      await bonusConfigService.saveWeightOverrides(savedConfig.id, { overrides });
      message.success('Đã lưu cấu hình thưởng');
      reloadDataset();
    } catch {
      message.error('Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const yearOptions = toYearOptions(BONUS_CONFIG_YEARS);
  const workshopOptions = workshops.map((workshop) => ({ value: workshop.id, label: workshop.name }));

  if (loadingMeta) {
    return (
      <div style={{ textAlign: 'center', padding: 64 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BonusConfigFilters
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        yearOptions={yearOptions}
        selectedWorkshopId={selectedWorkshopId}
        onWorkshopChange={setSelectedWorkshopId}
        workshopOptions={workshopOptions}
      />

      {loadingKpis ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <>
          <BonusConfigSettingCards localConfig={localConfig} setLocalConfig={setLocalConfig} />

          {kpis.length > 0 && (
            <BonusWeightOverrideTable
              kpis={kpis}
              bscCategoryMap={bscCategoryMap}
              localConfig={localConfig}
              updateCustomWeight={updateCustomWeight}
              totalOriginalWeight={totalOriginalWeight}
              totalCustomWeight={totalCustomWeight}
            />
          )}

          <BonusSaveAction
            saving={saving}
            disabled={!selectedWorkshopId}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  );
};

export default BonusConfigManager;
