import {
  NOTIFICATION_RECIPIENT_COLORS,
  NOTIFICATION_RECIPIENT_LABELS,
  NOTIFICATION_RECIPIENTS,
  NOTIFICATION_STATUS_MAP,
} from './constants';

export const getRecipientLabel = (recipients = []) => {
  const hasManager = recipients.includes(NOTIFICATION_RECIPIENTS.WORKSHOP_MANAGER);
  const hasEmployee = recipients.includes(NOTIFICATION_RECIPIENTS.EMPLOYEE);

  if (hasManager && hasEmployee) return NOTIFICATION_RECIPIENT_LABELS.ALL;
  if (hasManager) return NOTIFICATION_RECIPIENT_LABELS.WORKSHOP_MANAGER;
  return NOTIFICATION_RECIPIENT_LABELS.EMPLOYEE;
};

export const getRecipientColor = (recipients = []) => {
  const hasManager = recipients.includes(NOTIFICATION_RECIPIENTS.WORKSHOP_MANAGER);
  const hasEmployee = recipients.includes(NOTIFICATION_RECIPIENTS.EMPLOYEE);

  if (hasManager && hasEmployee) return NOTIFICATION_RECIPIENT_COLORS.ALL;
  if (hasManager) return NOTIFICATION_RECIPIENT_COLORS.WORKSHOP_MANAGER;
  return NOTIFICATION_RECIPIENT_COLORS.EMPLOYEE;
};

export const getStatusTag = (status) => {
  return NOTIFICATION_STATUS_MAP[status] || { color: 'default', label: status };
};
