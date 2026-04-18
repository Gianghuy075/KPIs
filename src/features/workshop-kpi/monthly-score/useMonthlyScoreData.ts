import { useMemo } from 'react';
import { calculatePenalty } from '../../../utils/penaltyUtils';
import { calcCompletionRate } from '../../../utils/bonusUtils';
import { round2 } from '../../../utils/scoreUtils';
import { BSC_ENUM } from '../../../constants/bsc';
import { DEFAULT_BONUS_CONFIG } from './constants';
import { roleLabels } from '../../../constants/roles';

const EMPTY_ENTRY = Object.freeze({ actualValue: null, errorCount: 0, note: '' });

export const useMonthlyScoreData = ({
  kpis,
  bscCategoryMap,
  penaltyLogics,
  selectedMonth,
  bonusConfig,
  entriesByKpi,
  employees = [],
}) => {
  const config = useMemo(() => {
    const weightOverrides = {};
    (bonusConfig?.weightOverrides || []).forEach((override) => {
      weightOverrides[override.kpiId] = Number(override.customWeight);
    });

    return {
      deptCoefficient: Number(bonusConfig?.deptCoefficient ?? DEFAULT_BONUS_CONFIG.deptCoefficient),
      individualRatio: Number(bonusConfig?.individualRatio ?? DEFAULT_BONUS_CONFIG.individualRatio),
      kpiWeightOverrides: weightOverrides,
    };
  }, [bonusConfig]);

  const scoreRows = useMemo(() => {
    return (kpis || []).map((kpi) => {
      const bsc = bscCategoryMap?.[kpi.bscCategoryId] || BSC_ENUM.OTHER;
      const entry = entriesByKpi[kpi.id]?.[selectedMonth] ?? EMPTY_ENTRY;

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
  }, [bscCategoryMap, config, entriesByKpi, kpis, penaltyLogics, selectedMonth]);

  const individualScore = useMemo(
    () => round2(scoreRows.reduce((sum, row) => sum + row.points, 0)),
    [scoreRows],
  );

  const deptScore = individualScore;

  const finalScore = useMemo(() => {
    const indRatio = config.individualRatio / 100;
    const deptRatio = 1 - indRatio;
    return round2(individualScore * indRatio + deptScore * deptRatio);
  }, [config.individualRatio, deptScore, individualScore]);

  const peopleRows = useMemo(() => {
    if ((employees || []).length > 0) {
      return employees.map((employee) => ({
        id: employee.id,
        name: employee.fullName || employee.username,
        roleLabel: roleLabels[employee.role] || 'Nhân viên',
        individualScore,
        deptScore,
        finalScore,
      }));
    }

    return [];
  }, [deptScore, employees, finalScore, individualScore]);

  return {
    config,
    scoreRows,
    individualScore,
    deptScore,
    finalScore,
    peopleRows,
  };
};
