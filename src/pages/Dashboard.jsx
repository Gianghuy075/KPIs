import React, { useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Alert,
} from 'antd';
import { PlusOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { useKPIActions } from '../features/kpi-management/hooks/useKPIActions';
import KPITable from '../features/kpi-management/components/KPITable';
import AddKPIModal from '../features/kpi-management/components/AddKPIModal';
import StatisticsCard from '../components/StatisticsCard';
import PerspectivePieChart from '../components/Charts/PerspectivePieChart';
import { getStatusColor, getStatusLabel } from '../utils/kpiUtils';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { kpis, loading, error, fetchKPIs, addKPI, updateKPI, deleteKPI } = useKPIActions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);

  const stats = useMemo(() => {
    if (!kpis.length) return null;

    const totalWeight = kpis.reduce((sum, k) => sum + k.weight, 0);
    const weightedScore = kpis.reduce((sum, k) => sum + (k.completionRate * k.weight) / 100, 0);
    const overallScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;

    const completed = kpis.filter((k) => k.status === 'completed').length;
    const warning = kpis.filter((k) => k.status === 'warning').length;
    const risk = kpis.filter((k) => k.status === 'risk').length;

    return {
      totalKPIs: kpis.length,
      overallScore: parseFloat(overallScore.toFixed(1)),
      completed,
      warning,
      risk,
      totalWeight,
    };
  }, [kpis]);

  const handleOpenAdd = () => {
    setEditingKPI(null);
    setModalOpen(true);
  };

  const handleEdit = (kpi) => {
    setEditingKPI(kpi);
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    let success;
    if (editingKPI) {
      success = await updateKPI(editingKPI.id, values);
    } else {
      success = await addKPI(values);
    }
    if (success) {
      setModalOpen(false);
      setEditingKPI(null);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingKPI(null);
  };

  const overallStatus = stats
    ? stats.overallScore >= 100 ? 'completed' : stats.overallScore >= 70 ? 'warning' : 'risk'
    : null;

  return (
    <div>
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
      <div style={{ marginBottom: 24 }}>
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
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
                Thêm KPI
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
              title="Hoàn thành / Cảnh báo"
              value={stats.completed}
              suffix={`/ ${stats.warning}`}
              precision={0}
              tag="KPI đạt mục tiêu"
              tagColor="success"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatisticsCard
              title="KPI Rủi ro"
              value={stats.risk}
              suffix="chỉ số"
              precision={0}
              tag={stats.risk === 0 ? 'Tốt' : 'Cần chú ý'}
              tagColor={stats.risk === 0 ? 'success' : 'error'}
            />
          </Col>
        </Row>
      )}

      {/* Pie Chart */}
      {kpis.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Phân bổ trọng số theo góc độ BSC" size="small">
              <PerspectivePieChart kpis={kpis} />
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
            <span>Bảng KPI theo góc độ BSC</span>
            {stats && (
              <Text type="secondary" style={{ fontWeight: 'normal', fontSize: 13 }}>
                ({stats.totalKPIs} chỉ số)
              </Text>
            )}
          </Space>
        }
        extra={
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenAdd}>
            Thêm KPI
          </Button>
        }
      >
        <KPITable kpis={kpis} loading={loading} onEdit={handleEdit} onDelete={deleteKPI} />
      </Card>

      <AddKPIModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingKPI={editingKPI}
        loading={loading}
        allKPIs={kpis}
      />
    </div>
  );
};

export default Dashboard;
