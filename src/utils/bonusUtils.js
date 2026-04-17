export function calcIndividualPoints(kpiData, getCompletionRate, config) {
  let total = 0;
  kpiData.forEach((kpi) => {
    const weight = config.kpiWeightOverrides?.[kpi.id] ?? kpi.weight;
    const rate = getCompletionRate(kpi);
    total += (rate * weight * (config.deptCoefficient ?? 1)) / 100;
  });
  return Math.round(total * 100) / 100;
}

export function calcDeptPoints(kpiData, getDeptAvgRate, config) {
  let total = 0;
  kpiData.forEach((kpi) => {
    const weight = config.kpiWeightOverrides?.[kpi.id] ?? kpi.weight;
    const rate = getDeptAvgRate(kpi);
    total += (rate * weight * (config.deptCoefficient ?? 1)) / 100;
  });
  return Math.round(total * 100) / 100;
}

export function calcFinalScore(individualPoints, deptPoints, config) {
  const indRatio = (config.individualRatio ?? 70) / 100;
  const deptRatio = 1 - indRatio;
  return Math.round((individualPoints * indRatio + deptPoints * deptRatio) * 100) / 100;
}

export function calcCompletionRate(actualValue, targetValue) {
  if (!targetValue || targetValue === 0) return 0;
  return Math.round((actualValue / targetValue) * 100 * 100) / 100;
}
