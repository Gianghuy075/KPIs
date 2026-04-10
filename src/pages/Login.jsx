import React, { useState } from 'react';
import { Button, Card, Typography, Layout, Form, Input, Space, Divider, Alert, message } from 'antd';
import { LockOutlined, UserOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { roleLabels } from '../constants/roles';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

const redirectByRole = {
  senior_manager: '/dashboard',
  branch_manager: '/dashboard',
  employee: '/dashboard',
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values) => {
    setLoading(true);
    setError('');
    try {
      const user = await login(values.identifier, values.password);
      const target = redirectByRole[user.role] || '/dashboard';
      message.success(`Chào ${user.name || 'bạn'} (${roleLabels[user.role] || user.role})`);
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
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
        <div style={{ width: '100%', maxWidth: 480 }}>
          <Card
            style={{
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Title level={2} style={{ color: '#1890ff', marginBottom: 8 }}>
                🎯 KPIs Management System
              </Title>
              <Paragraph style={{ fontSize: 16, color: '#666', marginBottom: 0 }}>
                Đăng nhập bằng email hoặc username
              </Paragraph>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            {error && (
              <Alert
                type="error"
                message="Đăng nhập không thành công"
                description={error}
                showIcon
                closable
                style={{ marginBottom: 16 }}
              />
            )}

            <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
              <Form.Item
                label="Email hoặc Username"
                name="identifier"
                rules={[{ required: true, message: 'Vui lòng nhập email hoặc username' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="vd: admin@company.com hoặc admin"
                  autoComplete="username"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<LoginOutlined />}
                  block
                  size="large"
                  loading={loading}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: '16px 0' }} />
            <Space direction="vertical" style={{ width: '100%', textAlign: 'center' }} size={2}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Vai trò hỗ trợ: Quản lý cấp cao, Quản lý phòng ban, Nhân viên
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hệ thống Quản lý KPI © 2026 | Liên hệ hỗ trợ: 0869975003
              </Text>
            </Space>
          </Card>
        </div>
      </Content>
    </Layout>
  );
};

export default Login;
