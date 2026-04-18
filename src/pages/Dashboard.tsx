import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  App as AntApp,
} from 'antd';
import { ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import KpiSystemTable from '../components/KpiSystemTable';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import workshopKpiService from '../services/workshopKpiService';
import StatisticsCard from '../components/StatisticsCard';
import PerspectivePieChart from '../components/Charts/PerspectivePieChart';
import BscBarChart from '../components/Charts/BscBarChart';
import MonthlyTrendChart from '../components/Charts/MonthlyTrendChart';
import NotificationBar from '../components/Notifications/NotificationBar';
import { getStatusLabel, getStatusColor } from '../utils/kpiUtils';
import { getCurrentYear, getYearRange } from '../constants/year';
import { useDashboardData } from '../features/dashboard/useDashboardData';

const { Title, Text } = Typography;

const currentYear = getCurrentYear();
const yearOptions = getYearRange(currentYear).map((year) => ({ value: year, label: String(year) }));

const Dashboard = () => {
  const { message, modal } = AntApp.useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [year, setYear] = useState(currentYear);
  const [editOpen, setEditOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const {
    rawKpis,
    setRawKpis,
    penaltyLogics,
    allEntries,
    loading,
    error,
    refresh,
    bscCategoryMap,
    kpis,
    stats,
    overallStatus,
    categoryData,
    bscBarData,
    monthlyTrend,
    isAdmin,
  } = useDashboardData({ year, user });

  const canManageKpis = isAdmin;

  const openEdit = (row) => {
    setEditingKpi(row);
    editForm.setFieldsValue({
      name: row.name,
      targetValue: row.targetValue,
      targetUnit: row.targetUnit,
      weight: row.weight,
      bscCategoryId: row.bscCategoryId,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      const updated = await workshopKpiService.update(editingKpi.id, values);
      setRawKpis(prev => prev.map(k => k.id === updated.id ? updated : k));
      message.success('Đã cập nhật KPI');
      setEditOpen(false);
      setEditingKpi(null);
    } catch (err) {
      if (!err?.errorFields) message.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row) => {
    modal.confirm({
      title: 'Xóa KPI?',
      content: `Bạn chắc chắn muốn xóa "${row.name}"?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        await workshopKpiService.remove(row.id);
        setRawKpis(prev => prev.filter(k => k.id !== row.id));
        message.success('Đã xóa KPI');
      },
    });
  };


  return (
    <div>
      <NotificationBar />

      {error && (
        <Alert
          message="Lỗi tải dữ liệu"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Page Header */}
      <div style={{ marginBottom: 24, marginTop: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <TrophyOutlined style={{ fontSize: 28, color: '#faad14' }} />
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  Dashboard KPI - Balanced Scorecard
                </Title>
                <Text type="secondary">
                  Quản lý và theo dõi chỉ số hiệu suất then chốt
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 100 }} />
              <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
                Làm mới
              </Button>
              {isAdmin && (
                <Button type="primary" onClick={() => navigate('/admin/workshop-kpis')}>
                  Quản lý KPI
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* Statistics Summary */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatisticsCard
              title="Điểm KPI Tổng thể"
              value={stats.overallScore}
              suffix="%"
              precision={1}
              progressPercent={Math.min(stats.overallScore, 100)}
              progressStatus={
                stats.overallScore >= 100
                  ? 'success'
                  : stats.overallScore >= 70
                    ? 'normal'
                    : 'exception'
              }
              tag={getStatusLabel(overallStatus)}
              tagColor={getStatusColor(overallStatus)}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticsCard
              title="Tổng số KPI"
              value={stats.totalKPIs}
              suffix="chỉ số"
              precision={0}
              tag={`Tổng trọng số: ${stats.totalWeight}%`}
              tagColor="blue"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticsCard
              title="Hoàn thành"
              value={stats.completed}
              suffix={`/ ${stats.totalKPIs}`}
              precision={0}
              tag="Đã hoàn thành"
              tagColor={getStatusColor('completed')}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticsCard
              title="Cảnh báo & Rủi ro"
              value={stats.warning + stats.risk}
              suffix="chỉ số"
              precision={0}
              tag={`${stats.warning} cảnh báo / ${stats.risk} rủi ro`}
              tagColor={getStatusColor(stats.warning > stats.risk ? 'warning' : 'risk')}
            />
          </Col>
        </Row>
      )}

      {/* Charts Row */}
      {kpis.length > 0 && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={8}>
              <Card title="Phân bổ trọng số BSC" size="small" style={{ height: '100%' }}>
                <PerspectivePieChart kpis={categoryData} />
              </Card>
            </Col>
            <Col xs={24} lg={16}>
              <Card title="Hoàn thành trung bình theo góc độ BSC" size="small" style={{ height: '100%' }}>
                <BscBarChart data={bscBarData} />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24}>
              <Card
                title="Xu hướng điểm KPI theo tháng"
                size="small"
                extra={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Điểm trung bình có trọng số — đường xanh: mục tiêu 85%
                  </Text>
                }
              >
                <MonthlyTrendChart data={monthlyTrend} />
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Edit KPI Modal (admin only) */}
      {canManageKpis && (
        <Modal
          title="Chỉnh sửa KPI"
          open={editOpen}
          onCancel={() => { setEditOpen(false); setEditingKpi(null); }}
          onOk={handleUpdate}
          okButtonProps={{ loading: saving }}
          destroyOnHide
        >
          <Form form={editForm} layout="vertical">
            <Form.Item name="name" label="Tên KPI" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="targetValue" label="Mục tiêu" rules={[{ required: true, type: 'number', min: 0 }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="targetUnit" label="Đơn vị" rules={[{ required: true }]}>
              <Input placeholder="VD: %, triệu đồng, lỗi" />
            </Form.Item>
            <Form.Item name="weight" label="Trọng số (%)" rules={[{ type: 'number', min: 0, max: 100 }]}>
              <InputNumber style={{ width: '100%' }} min={0} max={100} />
            </Form.Item>
          </Form>
        </Modal>
      )}

      {/* BSC KPI Table */}
      <KpiSystemTable
        kpis={rawKpis}
        allEntries={allEntries}
        bscCategoryMap={bscCategoryMap}
        penaltyLogics={penaltyLogics}
        canManage={canManageKpis}
        onEdit={openEdit}
        onDelete={handleDelete}
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;
