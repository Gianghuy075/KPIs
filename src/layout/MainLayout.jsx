import React, { useState, useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Breadcrumb, Space } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  TrophyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationManager from '../components/Notifications/NotificationManager';
import { BREADCRUMB_MAP, getMenuItemsByRole } from './navigationConfig';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Gọi useMemo TRƯỚC khi có điều kiện early return
  const menuItems = useMemo(() => getMenuItemsByRole(user?.role), [user?.role]);
  
  // Xử lý breadcrumb cho dynamic routes
  let currentBreadcrumb = BREADCRUMB_MAP[location.pathname] || 'Dashboard KPI';
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
