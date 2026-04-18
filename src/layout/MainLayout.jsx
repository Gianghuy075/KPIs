import React, { useState, useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Breadcrumb, Space } from 'antd';
import {
  DashboardOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationManager from '../components/Notifications/NotificationManager';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const breadcrumbMap = {
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
};

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Tạo menu items dynamically dựa trên user role
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard KPI',
      },
    ];

    // Thêm menu items cho Quản lý cấp cao
    if (user?.role === 'system_admin') {
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

    if (user?.role === 'workshop_manager') {
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

    if (user?.role === 'employee') {
      baseItems.push({
        key: '/me/kpis',
        icon: <BarChartOutlined />,
        label: 'KPI của tôi',
      });
    }

    // Thêm các menu items chung khác
    baseItems.push(
      {
        key: '/reports',
        icon: <BarChartOutlined />,
        label: 'Báo cáo',
        disabled: true,
      },
    );

    return baseItems;
  };

  // Gọi useMemo TRƯỚC khi có điều kiện early return
  const menuItems = useMemo(() => getMenuItems(), [user?.role]);
  
  // Xử lý breadcrumb cho dynamic routes
  let currentBreadcrumb = breadcrumbMap[location.pathname] || 'Dashboard KPI';
  if (location.pathname.startsWith('/admin/kpi-dashboards/')) {
    currentBreadcrumb = 'Dashboard Phòng ban KPI';
  }

  // Nếu ở trang login, chỉ hiển thị children
  if (location.pathname === '/login' || !user) {
    return <>{children}</>;
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Hồ sơ cá nhân',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <>
      <NotificationManager />
      <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        breakpoint="lg"
        style={{
          boxShadow: '2px 0 8px rgba(0,0,0,0.12)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: collapsed ? '0 8px' : '0 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <TrophyOutlined style={{ color: '#faad14', fontSize: 24, flexShrink: 0 }} />
          {!collapsed && (
            <Title level={5} style={{ color: 'white', margin: '0 0 0 8px', whiteSpace: 'nowrap' }}>
              KPI Manager
            </Title>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => {
            // Chỉ navigate nếu key là một route hợp lệ (bắt đầu bằng /)
            if (key.startsWith('/')) {
              navigate(key);
            }
          }}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 9,
          }}
        >
          <Space>
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{ cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center' }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <Breadcrumb
              items={[
                { title: 'Trang chủ' },
                { title: currentBreadcrumb },
              ]}
            />
          </Space>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <span style={{ fontWeight: 500 }}>{user?.name || 'Người dùng'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px',
            minHeight: 280,
          }}
        >
          {children}
        </Content>
        <Footer style={{ textAlign: 'center', color: '#999', padding: '12px 24px' }}>
          KPI Management System ©2024 | Balanced Scorecard
        </Footer>
      </Layout>
      </Layout>
    </>
  );
};

export default MainLayout;
