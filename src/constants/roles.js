export const ROLES = {
  SENIOR_MANAGER: 'senior_manager',
  BRANCH_MANAGER: 'branch_manager',
  DEPARTMENT_MANAGER: 'department_manager',
  EMPLOYEE: 'employee',
};

export const roleLabels = {
  [ROLES.SENIOR_MANAGER]: 'Quản lý cấp cao',
  [ROLES.BRANCH_MANAGER]: 'Quản lý chi nhánh',
  [ROLES.DEPARTMENT_MANAGER]: 'Quản lý phòng ban',
  [ROLES.EMPLOYEE]: 'Nhân viên',
};

// Giữ tương thích khi cần map từ giá trị cũ
export const legacyRoleMap = {
  executive: ROLES.SENIOR_MANAGER,
  branch_manager: ROLES.BRANCH_MANAGER,
  manager: ROLES.DEPARTMENT_MANAGER,
  employee: ROLES.EMPLOYEE,
};
