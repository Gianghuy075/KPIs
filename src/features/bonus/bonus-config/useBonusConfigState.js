import { useEffect, useMemo, useState } from 'react';
import { createDefaultBonusConfig } from './constants';

export const useBonusConfigState = ({ bonusConfig }) => {
  const [localConfig, setLocalConfig] = useState(createDefaultBonusConfig());

  useEffect(() => {
    if (bonusConfig) {
      const overrides = {};
      (bonusConfig.weightOverrides || []).forEach((override) => {
        overrides[override.kpiId] = Number(override.customWeight);
      });

      setLocalConfig({
        deptCoefficient: Number(bonusConfig.deptCoefficient ?? 1),
        individualRatio: Number(bonusConfig.individualRatio ?? 70),
        kpiWeightOverrides: overrides,
      });
      return;
    }

    setLocalConfig(createDefaultBonusConfig());
  }, [bonusConfig]);

  const weightOverrides = useMemo(() => localConfig.kpiWeightOverrides || {}, [localConfig.kpiWeightOverrides]);

  return {
    localConfig,
    setLocalConfig,
    weightOverrides,
  };
};
