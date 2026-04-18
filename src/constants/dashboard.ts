import { BSC_ENUM, BSC_ORDER } from './bsc';

export const DASHBOARD_BSC_ORDER = BSC_ORDER;

export const DASHBOARD_BSC_SHORT_NAMES = Object.freeze({
  [BSC_ENUM.FINANCIAL]: 'Tài chính',
  [BSC_ENUM.CUSTOMER]: 'Khách hàng',
  [BSC_ENUM.INTERNAL]: 'Quy trình',
  [BSC_ENUM.LEARNING]: 'Học hỏi',
});
