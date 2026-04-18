/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import {
  BarChartOutlined,
  CheckOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';

export const BREADCRUMB_MAP = Object.freeze({
  '/dashboard': 'Dashboard KPI',
  '/admin/employee': 'Quản lý Nhân viên',
  '/admin/branches': 'Quản lý Phân xưởng',
  '/admin/workshop-kpis': 'KPI Phân xưởng',
  '/admin/workshop-kpi-view': 'Xem KPI theo phân xưởng',
  '/admin/monthly-scores-view': 'Điểm KPI tháng theo phân xưởng',
  '/branch/kpi-view': 'Chi tiết KPI',
  '/admin/bonus-configs': 'Cấu hình thưởng',
  '/admin/notifications': 'Quản lý Thông báo',
  '/admin/penalty-rules': 'Quản lý Quy tắc Trừ điểm KPI',
  '/branch/data-entry': 'Nhập dữ liệu KPI',
  '/branch/monthly-scores': 'Điểm KPI tháng',
  '/me/kpis': 'KPI của tôi',
});

export const getMenuItemsByRole = (role) => {
  const baseItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard KPI',
    },
  ];

  if (role === 'system_admin') {
    baseItems.push(
      {
        key: 'management',
        icon: <SettingOutlined />,
        label: 'Quản lý Hệ thống',
        children: [
          {
            key: '/admin/workshop-kpis',
            icon: <BarChartOutlined />,
            label: 'KPI Phân xưởng',
          },
          {
            key: '/admin/workshop-kpi-view',
            icon: <BarChartOutlined />,
            label: 'Xem KPI theo phân xưởng',
          },
          {
            key: '/admin/monthly-scores-view',
            icon: <BarChartOutlined />,
            label: 'Điểm KPI tháng',
          },
          {
            key: '/admin/bonus-configs',
            icon: <TrophyOutlined />,
            label: 'Cấu hình thưởng',
          },
          {
            key: '/admin/notifications',
            icon: <CheckOutlined />,
            label: 'Quản lý Thông báo',
          },
        ],
      },
      {
        key: 'evaluation',
        icon: <CheckOutlined />,
        label: 'Quản lý Đánh giá',
        children: [
          {
            key: '/admin/penalty-rules',
            icon: <FileTextOutlined />,
            label: 'Quy tắc Trừ điểm KPI',
          },
        ],
      },
      {
        key: 'hr-management',
        icon: <TeamOutlined />,
        label: 'Quản lý Nhân sự',
        children: [
          {
            key: '/admin/branches',
            icon: <TeamOutlined />,
            label: 'Quản lý Phân xưởng',
          },
          {
            key: '/admin/employee',
            icon: <UserOutlined />,
            label: 'Quản lý Nhân viên',
          },
        ],
      },
    );
  }

  if (role === 'workshop_manager') {
    baseItems.push(
      {
        key: '/branch/data-entry',
        icon: <FileTextOutlined />,
        label: 'Nhập dữ liệu KPI',
      },
      {
        key: '/branch/kpi-view',
        icon: <BarChartOutlined />,
        label: 'Chi tiết KPI',
      },
      {
        key: '/branch/monthly-scores',
        icon: <BarChartOutlined />,
        label: 'Điểm KPI tháng',
      },
    );
  }

  if (role === 'employee') {
    baseItems.push({
      key: '/me/kpis',
      icon: <BarChartOutlined />,
      label: 'KPI của tôi',
    });
  }

  baseItems.push({
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Báo cáo',
    disabled: true,
  });

  return baseItems;
};
