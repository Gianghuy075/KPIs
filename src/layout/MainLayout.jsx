import React, { useState } from 'react';
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
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header, Sider, Content, Footer } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard KPI',
  },
  {
    key: '/reports',
    icon: <BarChartOutlined />,
    label: 'Báo cáo',
    disabled: true,
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: 'Cài đặt',
    disabled: true,
  },
];

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
  },
];

const breadcrumbMap = {
  '/dashboard': 'Dashboard KPI',
  '/reports': 'Báo cáo',
  '/settings': 'Cài đặt',
};

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentBreadcrumb = breadcrumbMap[location.pathname] || 'Dashboard KPI';

  return (
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
          onClick={({ key }) => navigate(key)}
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
              <span style={{ fontWeight: 500 }}>Quản trị viên</span>
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
  );
};

export default MainLayout;
