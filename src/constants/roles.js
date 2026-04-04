export const ROLES = {
  SENIOR_MANAGER: 'senior_manager',
  DEPARTMENT_MANAGER: 'department_manager',
  EMPLOYEE: 'employee',
};

export const roleLabels = {
  [ROLES.SENIOR_MANAGER]: 'Quản lý cấp cao',
  [ROLES.DEPARTMENT_MANAGER]: 'Quản lý phòng ban',
  [ROLES.EMPLOYEE]: 'Nhân viên',
};

// Giữ tương thích khi cần map từ giá trị cũ
export const legacyRoleMap = {
  executive: ROLES.SENIOR_MANAGER,
  manager: ROLES.DEPARTMENT_MANAGER,
  employee: ROLES.EMPLOYEE,
};
