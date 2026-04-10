export const ROLES = {
  SENIOR_MANAGER: 'senior_manager',
  BRANCH_MANAGER: 'branch_manager',
  EMPLOYEE: 'employee',
};

export const roleLabels = {
  [ROLES.SENIOR_MANAGER]: 'Quản lý cấp cao',
  [ROLES.BRANCH_MANAGER]: 'Quản lý phân xưởng',
  [ROLES.EMPLOYEE]: 'Nhân viên',
};

// Giữ tương thích khi cần map từ giá trị cũ
export const legacyRoleMap = {
  executive: ROLES.SENIOR_MANAGER,
  branch_manager: ROLES.BRANCH_MANAGER,
  manager: ROLES.BRANCH_MANAGER,
  employee: ROLES.EMPLOYEE,
  department_manager: ROLES.BRANCH_MANAGER,
};
