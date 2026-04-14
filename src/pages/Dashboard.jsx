import React, { useState, useMemo, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  App as AntApp,
} from 'antd';
import { ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { companyKpiService } from '../services/companyKpiService';
import { categoryWeightService } from '../services/categoryWeightService';
import { useAuth } from '../contexts/AuthContext';
import StatisticsCard from '../components/StatisticsCard';
import PerspectivePieChart from '../components/Charts/PerspectivePieChart';
import NotificationBar from '../components/Notifications/NotificationBar';
import KPITable from '../features/kpi-management/components/KPITable';
import { getStatus, getStatusLabel, getStatusColor, PERSPECTIVES } from '../utils/kpiUtils';

const { Title, Text } = Typography;
const categories = [
  { value: 'business', label: 'Kinh doanh' },
  { value: 'customer', label: 'Khách hàng' },
  { value: 'internal', label: 'Nội bộ' },
  { value: 'learning', label: 'Học tập & Phát triển' },
];

const Dashboard = () => {
  const { message, modal } = AntApp.useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rawKpis, setRawKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryWeights, setCategoryWeights] = useState({});
  const [editOpen, setEditOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const fetchKPIs = async () => {
    setLoading(true);
    setError('');
    try {
      const [res, weightData] = await Promise.all([
        companyKpiService.list(),
        user?.role === 'branch_manager'
          ? categoryWeightService.getBranchWeights(user.branch?._id || user.branch)
          : categoryWeightService.getAdminWeights(),
      ]);
      setRawKpis(res || []);
      const weightMap = Object.fromEntries((weightData || []).map((w) => [w.category, w.weight]));
      setCategoryWeights(weightMap);
    } catch (err) {
      setError(err?.message || 'Không tải được KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  const kpis = useMemo(() => {
    const mapPerspective = {
      business: PERSPECTIVES.FINANCIAL,
      customer: PERSPECTIVES.CUSTOMER,
      internal: PERSPECTIVES.INTERNAL,
      learning: PERSPECTIVES.LEARNING,
    };

    return (rawKpis || []).filter(Boolean).map((kpi) => {
      const targetValue = Number(kpi.targetValue || 0);
      const actualValue = Number(kpi.actualValue || 0);
      const completionRate = targetValue > 0 ? Math.min((actualValue / targetValue) * 100, 150) : 0;
      const perspectiveLabel = mapPerspective[kpi.category] || kpi.category || 'Khác';
      return {
        id: kpi._id || kpi.id,
        name: kpi.title || '—',
        unit: kpi.unit || '',
        category: kpi.category,
        categoryWeight: categoryWeights[kpi.category] ?? 0,
        weight: Number(kpi.weight || 0),
        target: targetValue,
        actual: actualValue,
        completionRate,
        status: getStatus(completionRate),
        perspective: perspectiveLabel,
      };
    });
  }, [rawKpis, categoryWeights]);

  const stats = useMemo(() => {
    if (!kpis.length) return null;

    const completed = kpis.filter((k) => k.status === 'completed').length;
    const warning = kpis.filter((k) => k.status === 'warning').length;
    const risk = kpis.filter((k) => k.status === 'risk').length;

    const weighted = kpis.reduce(
      (acc, k) => {
        const weight = k.weight || 0;
        acc.totalWeight += weight;
        acc.weightedScore += (k.completionRate * weight) / 100;
        return acc;
      },
      { weightedScore: 0, totalWeight: 0 },
    );

    const overallScore = weighted.totalWeight > 0
      ? (weighted.weightedScore / weighted.totalWeight) * 100
      : kpis.reduce((sum, k) => sum + k.completionRate, 0) / kpis.length;

    return {
      totalKPIs: kpis.length,
      overallScore: parseFloat(overallScore.toFixed(1)),
      completed,
      warning,
      risk,
      totalWeight: weighted.totalWeight,
    };
  }, [kpis]);

  const overallStatus = stats ? getStatus(stats.overallScore) : null;

  const categoryData = useMemo(() => {
    const map = {};
    kpis.forEach((k) => {
      const perspective = k.perspective;
      const value = k.weight || 1;
      map[perspective] = (map[perspective] || 0) + value;
    });
    return Object.entries(map).map(([perspective, weight]) => ({
      name: perspective,
      value: weight,
      weight,
      perspective,
    }));
  }, [kpis]);

  const openEdit = (record) => {
    const kpi = rawKpis.find((k) => (k._id || k.id) === record.id);
    if (!kpi) return;
    setEditingKpi(kpi);
    editForm.setFieldsValue({
      title: kpi.title,
      category: kpi.category,
      targetValue: kpi.targetValue,
      unit: kpi.unit,
      targetDate: kpi.targetDate ? dayjs(kpi.targetDate) : null,
      description: kpi.description,
    });
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      await companyKpiService.update(editingKpi._id || editingKpi.id, {
        title: values.title,
        category: values.category,
        targetValue: values.targetValue,
        unit: values.unit,
        targetDate: values.targetDate?.toISOString(),
        description: values.description,
      });
      message.success('Đã cập nhật KPI');
      setEditOpen(false);
      setEditingKpi(null);
      fetchKPIs();
    } catch (err) {
      if (!err?.errorFields) {
        message.error('Cập nhật thất bại');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    modal.confirm({
      title: 'Xóa KPI?',
      content: 'Bạn chắc chắn muốn xóa KPI này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await companyKpiService.remove(id);
          message.success('Đã xóa KPI');
          fetchKPIs();
        } catch (err) {
          message.error('Xóa KPI thất bại');
        }
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
                <Text type="secondary">Quản lý và theo dõi chỉ số hiệu suất then chốt</Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchKPIs} loading={loading}>
                Làm mới
              </Button>
              <Button type="primary" onClick={() => navigate('/admin/kpis-bsc')}>
                Quản lý KPI
              </Button>
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
                stats.overallScore >= 100 ? 'success' : stats.overallScore >= 70 ? 'normal' : 'exception'
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

      {/* Pie Chart */}
      {kpis.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Phân bổ KPI theo góc độ" size="small">
              <PerspectivePieChart kpis={categoryData} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Hướng dẫn trạng thái" size="small" style={{ height: '100%' }}>
              <div style={{ padding: '8px 0' }}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Mô hình Balanced Scorecard (BSC)</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Hệ thống đánh giá KPI theo 4 góc độ chiến lược
                  </Text>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                {[
                  { color: '#1890ff', label: 'Tài chính', desc: 'Doanh thu, lợi nhuận, chi phí' },
                  { color: '#52c41a', label: 'Khách hàng', desc: 'Hài lòng, giữ chân, tăng trưởng' },
                  { color: '#faad14', label: 'Quy trình nội bộ', desc: 'Hiệu quả vận hành, chất lượng' },
                  { color: '#722ed1', label: 'Học hỏi & Phát triển', desc: 'Nhân sự, đổi mới, tri thức' },
                ].map((item) => (
                  <div key={item.label} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <div>
                      <Text strong style={{ fontSize: 13 }}>{item.label}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.desc}</Text>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* KPI Table */}
      <Card
        title={
          <Space>
            <span>Bảng KPI BSC</span>
            {stats && (
              <Text type="secondary" style={{ fontWeight: 'normal', fontSize: 13 }}>
                ({stats.totalKPIs} chỉ số)
              </Text>
            )}
          </Space>
        }
        styles={{ body: { padding: 0 } }}
      >
        <KPITable kpis={kpis} loading={loading} onEdit={openEdit} onDelete={handleDelete} categoryWeights={categoryWeights} />
      </Card>

      <Modal
        title="Chỉnh sửa KPI BSC"
        open={editOpen}
        onCancel={() => {
          setEditOpen(false);
          setEditingKpi(null);
        }}
        onOk={handleUpdate}
        okButtonProps={{ loading: saving }}
        destroyOnHide
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Tên KPI" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Góc độ BSC" rules={[{ required: true }]}>
            <Select options={categories} />
          </Form.Item>
          <Form.Item
            name="targetValue"
            label="Giá trị mục tiêu"
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="targetDate" label="Hạn hoàn thành" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả" rules={[{ max: 300 }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
