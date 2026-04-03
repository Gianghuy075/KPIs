import React from 'react';
import { Button, Card, Row, Col, Typography, Space, Divider, Layout, Empty } from 'antd';
import { UserOutlined, TeamOutlined, CrownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const roles = [
    {
      key: 'executive',
      title: 'Trang quản lý cấp cao',
      description: 'Xem toàn bộ KPI từ tất cả các góc độ BSC',
      icon: <CrownOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      color: '#faad14',
    },
    {
      key: 'manager',
      title: 'Trang quản lý phòng ban',
      description: 'Quản lý KPI của phòng ban',
      icon: <TeamOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      color: '#1890ff',
    },
    {
      key: 'employee',
      title: 'Trang nhân viên',
      description: 'Xem KPI cá nhân và mục tiêu',
      icon: <UserOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      color: '#52c41a',
    },
  ];

  const handleLogin = (role) => {
    login(role);
    navigate('/dashboard');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 1000 }}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <Title level={1} style={{ color: '#1890ff', marginBottom: 8 }}>
                🎯 KPIs Management System
              </Title>
              <Paragraph style={{ fontSize: 16, color: '#666' }}>
                Hệ thống quản lý chỉ số hiệu suất theo mô hình Quản trị tự động
              </Paragraph>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {/* Role Selection */}
            <div style={{ marginBottom: 4 }}>
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 24, textAlign: 'center' }}>
                Vui lòng chọn vai trò của bạn:
              </Text>
            </div>

            <Row gutter={[24, 24]} justify="center">
              {roles.map((role) => (
                <Col xs={24} sm={24} md={8} key={role.key}>
                  <Card
                    hoverable
                    style={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      border: `2px solid ${role.color}20`,
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 8px 24px ${role.color}40`;
                      e.currentTarget.style.borderColor = role.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = `${role.color}20`;
                    }}
                  >
                    <Space
                      direction="vertical"
                      style={{ width: '100%', alignItems: 'center', flexGrow: 1 }}
                      size="large"
                    >
                      {/* Icon */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          padding: '16px',
                          borderRadius: 8,
                          background: `${role.color}10`,
                        }}
                      >
                        {role.icon}
                      </div>

                      {/* Title */}
                      <Title level={4} style={{ margin: 0, textAlign: 'center', color: role.color }}>
                        {role.title}
                      </Title>

                      {/* Description */}
                      <Text type="secondary" style={{ textAlign: 'center', fontSize: 13 }}>
                        {role.description}
                      </Text>

                      {/* Button */}
                      <Button
                        type="primary"
                        size="large"
                        block
                        style={{
                          background: role.color,
                          borderColor: role.color,
                          marginTop: 'auto',
                        }}
                        onClick={() => handleLogin(role.key)}
                      >
                        Đăng nhập
                      </Button>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Footer Info */}
            <Divider style={{ margin: '32px 0' }} />
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hệ thống Quản lý KPI © 2026 | Được phát triển bởi Giang Tuấn Huy - 0869975003
              </Text>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default Login;
