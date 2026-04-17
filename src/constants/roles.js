export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  WORKSHOP_MANAGER: 'workshop_manager',
  EMPLOYEE: 'employee',
};

export const roleLabels = {
  [ROLES.SYSTEM_ADMIN]: 'Quản lý cấp cao',
  [ROLES.WORKSHOP_MANAGER]: 'Quản lý phân xưởng',
  [ROLES.EMPLOYEE]: 'Nhân viên',
};

export const legacyRoleMap = {
  senior_manager: ROLES.SYSTEM_ADMIN,
  executive: ROLES.SYSTEM_ADMIN,
  branch_manager: ROLES.WORKSHOP_MANAGER,
  manager: ROLES.WORKSHOP_MANAGER,
  department_manager: ROLES.WORKSHOP_MANAGER,
  employee: ROLES.EMPLOYEE,
};
