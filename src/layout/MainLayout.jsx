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
  CalendarOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationManager from '../components/Notifications/NotificationManager';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const breadcrumbMap = {
  '/dashboard': 'Dashboard KPI',
  '/admin/users': 'Quản lý Người dùng',
  '/admin/departments': 'Quản lý Phòng ban',
  '/admin/kpi-management': 'Quản lý KPI Phòng ban',
  '/admin/kpi-dashboards': 'Quản lý KPIs',
  '/admin/notifications': 'Quản lý Thông báo',
  '/admin/monthly-work': 'Quản lý Công việc Hàng tháng',
  '/admin/quarterly-work': 'Quản lý Công việc Hàng quý',
  '/admin/yearly-work': 'Quản lý Công việc Hàng năm',
  '/admin/penalty-rules': 'Quản lý Quy tắc Trừ điểm KPI',
  '/admin/penalty-rules-bsc': 'Quản lý Quy tắc Trừ điểm theo BSC',
  '/admin/daily-work': 'Quản lý Công việc Hàng ngày',
  '/admin/daily-evaluation': 'Quản lý Đánh giá Hàng ngày',
  '/admin/monthly-evaluation': 'Quản lý Đánh giá Hàng tháng',
  '/admin/yearly-evaluation': 'Quản lý Đánh giá Hàng năm',
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

    // Thêm menu items cho Executive
    if (user?.role === 'executive') {
      baseItems.push(
        {
          key: '/admin/kpi-dashboards',
          icon: <BarChartOutlined />,
          label: 'Quản lý KPIs',
        },
        {
          key: 'management',
          icon: <SettingOutlined />,
          label: 'Quản lý Hệ thống',
          children: [
            {
              key: '/admin/notifications',
              icon: <CheckOutlined />,
              label: 'Quản lý Thông báo',
            },
            {
              key: '/admin/monthly-work',
              icon: <CalendarOutlined />,
              label: 'Công việc Hàng tháng',
            },
            {
              key: '/admin/quarterly-work',
              icon: <FileTextOutlined />,
              label: 'Công việc Hàng quý',
            },
            {
              key: '/admin/yearly-work',
              icon: <FileTextOutlined />,
              label: 'Công việc Hàng năm',
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
            {
              key: '/admin/penalty-rules-bsc',
              icon: <FileTextOutlined />,
              label: 'Quy tắc Trừ điểm BSC',
            },
            {
              key: '/admin/daily-work',
              icon: <CalendarOutlined />,
              label: 'Công việc Hàng ngày',
            },
            {
              key: '/admin/daily-evaluation',
              icon: <CheckOutlined />,
              label: 'Đánh giá Hàng ngày',
            },
            {
              key: '/admin/monthly-evaluation',
              icon: <CheckOutlined />,
              label: 'Đánh giá Hàng tháng',
            },
            {
              key: '/admin/yearly-evaluation',
              icon: <CheckOutlined />,
              label: 'Đánh giá Hàng năm',
            },
          ],
        },
        {
          key: 'hr-management',
          icon: <TeamOutlined />,
          label: 'Quản lý Nhân sự',
          children: [
            {
              key: '/admin/users',
              icon: <UserOutlined />,
              label: 'Quản lý Người dùng',
            },
            {
              key: '/admin/departments',
              icon: <TeamOutlined />,
              label: 'Quản lý Phòng ban',
            },
          ],
        },
      );
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
