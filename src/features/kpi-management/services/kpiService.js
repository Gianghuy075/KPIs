import { calculateScore, getStatus, PERSPECTIVES } from '../../../utils/kpiUtils';

const INITIAL_KPI_DATA = [
  {
    id: 1,
    perspective: PERSPECTIVES.FINANCIAL,
    name: 'Doanh thu thuần',
    weight: 20,
    target: 10000000000,
    actual: 11200000000,
    unit: 'VND',
  },
  {
    id: 2,
    perspective: PERSPECTIVES.FINANCIAL,
    name: 'Lợi nhuận gộp',
    weight: 15,
    target: 3000000000,
    actual: 2850000000,
    unit: 'VND',
  },
  {
    id: 3,
    perspective: PERSPECTIVES.FINANCIAL,
    name: 'Chi phí vận hành',
    weight: 10,
    target: 1500000000,
    actual: 1650000000,
    unit: 'VND',
    lowerIsBetter: true,
  },
  {
    id: 4,
    perspective: PERSPECTIVES.CUSTOMER,
    name: 'Chỉ số hài lòng khách hàng (CSAT)',
    weight: 15,
    target: 90,
    actual: 88,
    unit: '%',
  },
  {
    id: 5,
    perspective: PERSPECTIVES.CUSTOMER,
    name: 'Tỷ lệ giữ chân khách hàng',
    weight: 10,
    target: 85,
    actual: 87,
    unit: '%',
  },
  {
    id: 6,
    perspective: PERSPECTIVES.CUSTOMER,
    name: 'Số khách hàng mới',
    weight: 8,
    target: 200,
    actual: 185,
    unit: 'KH',
  },
  {
    id: 7,
    perspective: PERSPECTIVES.INTERNAL,
    name: 'Thời gian xử lý đơn hàng',
    weight: 7,
    target: 24,
    actual: 20,
    unit: 'giờ',
    lowerIsBetter: true,
  },
  {
    id: 8,
    perspective: PERSPECTIVES.INTERNAL,
    name: 'Tỷ lệ giao hàng đúng hạn',
    weight: 8,
    target: 95,
    actual: 93,
    unit: '%',
  },
  {
    id: 9,
    perspective: PERSPECTIVES.INTERNAL,
    name: 'Số lỗi sản phẩm / 1000 đơn vị',
    weight: 5,
    target: 2,
    actual: 3,
    unit: 'lỗi',
    lowerIsBetter: true,
  },
  {
    id: 10,
    perspective: PERSPECTIVES.LEARNING,
    name: 'Tỷ lệ nhân viên được đào tạo',
    weight: 7,
    target: 80,
    actual: 82,
    unit: '%',
  },
  {
    id: 11,
    perspective: PERSPECTIVES.LEARNING,
    name: 'Chỉ số gắn kết nhân viên',
    weight: 5,
    target: 75,
    actual: 68,
    unit: 'điểm',
  },
  {
    id: 12,
    perspective: PERSPECTIVES.LEARNING,
    name: 'Số sáng kiến cải tiến được áp dụng',
    weight: 5,
    target: 10,
    actual: 12,
    unit: 'sáng kiến',
  },
];

let kpiData = INITIAL_KPI_DATA.map((kpi) => {
  const completionRate = kpi.lowerIsBetter
    ? kpi.target > 0 ? Math.min((kpi.target / kpi.actual) * 100, 150) : 0
    : calculateScore(kpi.actual, kpi.target);
  return {
    ...kpi,
    completionRate: parseFloat(completionRate.toFixed(1)),
    status: getStatus(completionRate),
  };
});

let nextId = kpiData.length + 1;

// Helper function to calculate total weight
export const calculateTotalWeight = (kpis) => {
  return kpis.reduce((sum, k) => sum + (k.weight || 0), 0);
};

// Validator function to check if total weight equals 100
export const validateTotalWeight = (kpis) => {
  const totalWeight = calculateTotalWeight(kpis);
  if (Math.abs(totalWeight - 100) > 0.01) { // Allow small floating point error
    return {
      isValid: false,
      totalWeight: parseFloat(totalWeight.toFixed(1)),
      message: `Tổng trọng số phải bằng 100%. Hiện tại: ${totalWeight.toFixed(1)}%`,
    };
  }
  return {
    isValid: true,
    totalWeight: 100,
    message: 'Tổng trọng số hợp lệ',
  };
};

export const kpiService = {
  getAll: () => Promise.resolve([...kpiData]),

  getById: (id) => {
    const kpi = kpiData.find((k) => k.id === id);
    return kpi ? Promise.resolve({ ...kpi }) : Promise.reject(new Error('KPI not found'));
  },

  create: (kpiInput) => {
    const completionRate = kpiInput.lowerIsBetter
      ? kpiInput.target > 0 ? Math.min((kpiInput.target / kpiInput.actual) * 100, 150) : 0
      : calculateScore(kpiInput.actual, kpiInput.target);
    const newKpi = {
      ...kpiInput,
      id: nextId++,
      completionRate: parseFloat(completionRate.toFixed(1)),
      status: getStatus(completionRate),
    };
    kpiData = [...kpiData, newKpi];
    return Promise.resolve({ ...newKpi });
  },

  update: (id, updates) => {
    const index = kpiData.findIndex((k) => k.id === id);
    if (index === -1) return Promise.reject(new Error('KPI not found'));
    const updated = { ...kpiData[index], ...updates };
    const completionRate = updated.lowerIsBetter
      ? updated.target > 0 ? Math.min((updated.target / updated.actual) * 100, 150) : 0
      : calculateScore(updated.actual, updated.target);
    updated.completionRate = parseFloat(completionRate.toFixed(1));
    updated.status = getStatus(completionRate);
    kpiData = [...kpiData.slice(0, index), updated, ...kpiData.slice(index + 1)];
    return Promise.resolve({ ...updated });
  },

  delete: (id) => {
    const index = kpiData.findIndex((k) => k.id === id);
    if (index === -1) return Promise.reject(new Error('KPI not found'));
    kpiData = kpiData.filter((k) => k.id !== id);
    return Promise.resolve({ success: true });
  },
};
