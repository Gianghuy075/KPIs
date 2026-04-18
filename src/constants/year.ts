export const getCurrentYear = () => new Date().getFullYear();

export const getYearRange = (centerYear = getCurrentYear()) => Object.freeze([
  centerYear - 1,
  centerYear,
  centerYear + 1,
]);

export const toYearOptions = (years) => years.map((year) => ({ value: String(year), label: String(year) }));
