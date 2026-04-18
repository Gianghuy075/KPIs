export const USER_ROLE_ENUM = {
  SYSTEM_ADMIN: 'system_admin',
  WORKSHOP_MANAGER: 'workshop_manager',
  EMPLOYEE: 'employee',
} as const;

export type UserRole = (typeof USER_ROLE_ENUM)[keyof typeof USER_ROLE_ENUM];

export const PERIOD_TYPE_ENUM = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  DAILY: 'daily',
} as const;

export type PeriodType = (typeof PERIOD_TYPE_ENUM)[keyof typeof PERIOD_TYPE_ENUM];

export const PENALTY_TYPE_ENUM = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
  TIERED: 'tiered',
  CAP: 'cap',
} as const;

export type PenaltyType = (typeof PENALTY_TYPE_ENUM)[keyof typeof PENALTY_TYPE_ENUM];
