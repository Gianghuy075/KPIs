export const NOTIFICATION_RECIPIENTS = Object.freeze({
  WORKSHOP_MANAGER: 'branch_manager',
  EMPLOYEE: 'employee',
});

export const NOTIFICATION_RECIPIENT_LABELS = Object.freeze({
  ALL: 'Quản lý + Nhân viên',
  WORKSHOP_MANAGER: 'Quản lý Phân xưởng',
  EMPLOYEE: 'Nhân viên',
});

export const NOTIFICATION_RECIPIENT_COLORS = Object.freeze({
  ALL: 'blue',
  WORKSHOP_MANAGER: 'green',
  EMPLOYEE: 'orange',
});

export const NOTIFICATION_STATUS_MAP = Object.freeze({
  active: Object.freeze({ color: 'green', label: 'Đang hoạt động' }),
  inactive: Object.freeze({ color: 'red', label: 'Không hoạt động' }),
  read: Object.freeze({ color: 'gray', label: 'Đã đọc' }),
});

export const FORM_RECIPIENT_OPTIONS = Object.freeze([
  { value: NOTIFICATION_RECIPIENTS.WORKSHOP_MANAGER, label: 'Quản lý Phân xưởng' },
  { value: NOTIFICATION_RECIPIENTS.EMPLOYEE, label: 'Nhân viên' },
]);

export const FORM_STATUS_OPTIONS = Object.freeze([
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Không hoạt động' },
]);
