import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Empty,
  Button,
  Space,
  Statistic,
  Progress,
  Tag,
  Grid,
  Tooltip,
  Spin,
} from 'antd';
import {
  BarChartOutlined,
  RightOutlined,
  CheckCircleOutlined,
  ExclamationOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { kpiService, calculateTotalWeight } from '../../features/kpi-management/services/kpiService';
import { calculateScore, getStatus, PERSPECTIVE_COLORS } from '../../utils/kpiUtils';

const DEPARTMENTS = [
  { id: 1, name: 'Ban Lãnh đạo', manager: 'Nguyễn Văn A', color: '#2f54eb' },
  { id: 2, name: 'Kinh doanh', manager: 'Trần Thị B', color: '#52c41a' },
  { id: 3, name: 'Kỹ thuật', manager: 'Lê Văn C', color: '#faad14' },
  { id: 4, name: 'Nhân sự', manager: 'Phạm Thị D', color: '#d4380d' },
];

const KPIDashboards = () => {
  const navigate = useNavigate();
  const [departmentStats, setDepartmentStats] = useState({});
  const [loading, setLoading] = useState(false);
  const screens = Grid.useBreakpoint();

  useEffect(() => {
    loadAllDepartmentStats();
  }, []);

  const loadAllDepartmentStats = async () => {
    setLoading(true);
    try {
      const stats = {};
      
      for (const dept of DEPARTMENTS) {
        const kpis = await kpiService.getDepartmentKPIs(dept.id);
        
        if (kpis && kpis.length > 0) {
          const enrichedKPIs = kpis.map(kpi => {
            const completionRate = kpi.lowerIsBetter 
              ? kpi.target > 0 ? Math.min((kpi.target / kpi.actual) * 100, 150) : 0
              : calculateScore(kpi.actual, kpi.target);
            
            return {
              ...kpi,
              completionRate: parseFloat(completionRate.toFixed(1)),
              status: getStatus(completionRate),
            };
          });

          const completionRates = enrichedKPIs.map(k => k.completionRate);
          const avgCompletion = completionRates.length > 0 
            ? (completionRates.reduce((a, b) => a + b, 0) / completionRates.length).toFixed(1)
            : 0;

          const totalWeight = calculateTotalWeight(enrichedKPIs);
          const weightedCompletion = enrichedKPIs.length > 0
            ? (enrichedKPIs.reduce((sum, kpi) => sum + (kpi.completionRate * kpi.weight / 100), 0) / (totalWeight / 100)).toFixed(1)
            : 0;

          stats[dept.id] = {
            kpiCount: enrichedKPIs.length,
            avgCompletion: parseFloat(avgCompletion),
            weightedCompletion: parseFloat(weightedCompletion),
            completedCount: enrichedKPIs.filter(k => k.status === 'completed').length,
            warningCount: enrichedKPIs.filter(k => k.status === 'warning').length,
            riskCount: enrichedKPIs.filter(k => k.status === 'risk').length,
            totalWeight,
          };
        } else {
          stats[dept.id] = {
            kpiCount: 0,
            avgCompletion: 0,
            weightedCompletion: 0,
            completedCount: 0,
            warningCount: 0,
            riskCount: 0,
            totalWeight: 0,
          };
        }
      }
      
      setDepartmentStats(stats);
    } catch (error) {
      console.error('Lỗi tải thống kê:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDashboard = (departmentId) => {
    navigate(`/admin/kpi-dashboards/${departmentId}`);
  };

  const DepartmentCard = ({ dept }) => {
    const stats = departmentStats[dept.id] || {};
    const hasKPIs = stats.kpiCount > 0;

    return (
      <Card
        hoverable
        onClick={() => handleViewDashboard(dept.id)}
        style={{
          borderTop: `4px solid ${dept.color}`,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          height: '100%',
        }}
        className="shadow-sm hover:shadow-md"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {/* Header */}
          <div>
            <h3 style={{ marginBottom: 4, color: dept.color, fontWeight: 600, fontSize: 16 }}>
              {dept.name}
            </h3>
            <span className="text-gray-600 text-sm">Quản lý: {dept.manager}</span>
          </div>

          {/* Content */}
          {hasKPIs ? (
            <>
              <Row gutter={12}>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: dept.color }}>
                      {stats.avgCompletion.toFixed(1)}%
                    </div>
                    <div className="text-gray-600 text-xs">Tiến độ trung bình</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: dept.color }}>
                      {stats.weightedCompletion.toFixed(1)}%
                    </div>
                    <div className="text-gray-600 text-xs">Tiến độ có trọng số</div>
                  </div>
                </Col>
              </Row>

              <Progress
                percent={Math.min(stats.avgCompletion, 100)}
                strokeColor={dept.color}
                size="small"
              />

              <Row gutter={8}>
                <Col span={8}>
                  <Tooltip title="Hoàn thành">
                    <div style={{ textAlign: 'center' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
                      <div className="text-sm font-semibold">{stats.completedCount}</div>
                    </div>
                  </Tooltip>
                </Col>
                <Col span={8}>
                  <Tooltip title="Cảnh báo">
                    <div style={{ textAlign: 'center' }}>
                      <ExclamationOutlined style={{ color: '#faad14', fontSize: 18 }} />
                      <div className="text-sm font-semibold">{stats.warningCount}</div>
                    </div>
                  </Tooltip>
                </Col>
                <Col span={8}>
                  <Tooltip title="Rủi ro">
                    <div style={{ textAlign: 'center' }}>
                      <CloseCircleOutlined style={{ color: '#f5222d', fontSize: 18 }} />
                      <div className="text-sm font-semibold">{stats.riskCount}</div>
                    </div>
                  </Tooltip>
                </Col>
              </Row>

              <Tag color={dept.color} style={{ width: '100%', textAlign: 'center', padding: '4px 0' }}>
                {stats.kpiCount} KPI
              </Tag>
            </>
          ) : (
            <Empty
              description="Chưa thiết lập KPI"
              style={{ margin: '20px 0' }}
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Card>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12}>
            <div>
              <h1 className="text-3xl font-bold mb-2">Quản lý KPIs</h1>
              <p className="text-gray-600">Theo dõi tiến độ KPI theo từng phòng ban</p>
            </div>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              size="large"
              onClick={loadAllDepartmentStats}
              loading={loading}
            >
              Cập nhật dữ liệu
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Tổng Phòng ban"
              value={DEPARTMENTS.length}
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Phòng ban có KPI"
              value={Object.values(departmentStats).filter(s => s.kpiCount > 0).length}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Tổng KPI"
              value={Object.values(departmentStats).reduce((sum, s) => sum + s.kpiCount, 0)}
              valueStyle={{ color: '#faad14', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Tiến độ TB"
              value={
                Object.values(departmentStats).filter(s => s.kpiCount > 0).length > 0
                  ? (
                      Object.values(departmentStats)
                        .filter(s => s.kpiCount > 0)
                        .reduce((sum, s) => sum + s.avgCompletion, 0) /
                      Object.values(departmentStats).filter(s => s.kpiCount > 0).length
                    ).toFixed(1)
                  : 0
              }
              suffix="%"
              valueStyle={{ color: '#1890ff', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Department Dashboards */}
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {DEPARTMENTS.map(dept => (
            <Col
              key={dept.id}
              xs={24}
              sm={screens.sm ? 12 : 24}
              lg={screens.lg ? 6 : 12}
              xl={screens.xl ? 6 : 12}
            >
              <DepartmentCard dept={dept} />
            </Col>
          ))}
        </Row>
      </Spin>

      {/* Instructions */}
      <Card
        type="inner"
        title="Hướng dẫn sử dụng"
        style={{ backgroundColor: '#fafafa' }}
      >
        <ol className="space-y-2 text-sm">
          <li>☑️ <strong>Xem Dashboard:</strong> Nhấp vào bất kỳ thẻ phòng ban nào để xem chi tiết KPI</li>
          <li>📊 <strong>Theo dõi Tiến độ:</strong> Xem tiến độ trung bình, tiến độ có trọng số và trạng thái KPI</li>
          <li>⚙️ <strong>Quản lý KPI:</strong> Vào phần "Quản lý KPI Phòng ban" để thêm/sửa/xóa KPI</li>
          <li>🔄 <strong>Cập nhật:</strong> Nhấp "Cập nhật dữ liệu" để làm mới thông tin mới nhất</li>
        </ol>
      </Card>
    </div>
  );
};

export default KPIDashboards;
