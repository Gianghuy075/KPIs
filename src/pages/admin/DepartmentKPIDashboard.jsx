import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Table,
  Empty,
  Space,
  Button,
  Tooltip,
  Grid,
  Affix,
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ExclamationOutlined,
  CloseCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { kpiService, calculateTotalWeight } from '../../features/kpi-management/services/kpiService';
import { calculateScore, getStatus, getStatusLabel, getStatusColor, PERSPECTIVES, PERSPECTIVE_COLORS } from '../../utils/kpiUtils';

const DEPARTMENTS = [
  { id: 1, name: 'Ban Lãnh đạo', manager: 'Nguyễn Văn A' },
  { id: 2, name: 'Kinh doanh', manager: 'Trần Thị B' },
  { id: 3, name: 'Kỹ thuật', manager: 'Lê Văn C' },
  { id: 4, name: 'Nhân sự', manager: 'Phạm Thị D' },
];

const DepartmentKPIDashboard = () => {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const screens = Grid.useBreakpoint();

  useEffect(() => {
    loadKPIs();
  }, [departmentId]);

  const loadKPIs = async () => {
    setLoading(true);
    try {
      const data = await kpiService.getDepartmentKPIs(parseInt(departmentId));
      // Add calculated fields for each KPI
      const enrichedData = (data || []).map(kpi => {
        const completionRate = kpi.lowerIsBetter 
          ? kpi.target > 0 ? Math.min((kpi.target / kpi.actual) * 100, 150) : 0
          : calculateScore(kpi.actual, kpi.target);
        
        return {
          ...kpi,
          completionRate: parseFloat(completionRate.toFixed(1)),
          status: getStatus(completionRate),
        };
      });
      setKpis(enrichedData);
    } catch (error) {
      console.error('Lỗi tải KPI:', error);
    } finally {
      setLoading(false);
    }
  };

  const department = DEPARTMENTS.find(d => d.id === parseInt(departmentId));
  if (!department) {
    return (
      <Card>
        <Empty description="Không tìm thấy phòng ban" />
      </Card>
    );
  }

  // Tính toán các chỉ số tổng hợp
  const completionRates = kpis.map(k => k.completionRate);
  const avgCompletion = completionRates.length > 0 
    ? (completionRates.reduce((a, b) => a + b, 0) / completionRates.length).toFixed(1)
    : 0;

  const completedCount = kpis.filter(k => k.status === 'completed').length;
  const warningCount = kpis.filter(k => k.status === 'warning').length;
  const riskCount = kpis.filter(k => k.status === 'risk').length;

  // Nhóm KPI theo góc độ BSC
  const kpisByPerspective = {};
  Object.values(PERSPECTIVES).forEach(perspective => {
    kpisByPerspective[perspective] = kpis.filter(k => k.perspective === perspective);
  });

  // Tính trọng số trung bình đạt được
  const totalWeight = calculateTotalWeight(kpis);
  const weightedCompletion = kpis.length > 0
    ? (kpis.reduce((sum, kpi) => sum + (kpi.completionRate * kpi.weight / 100), 0) / (totalWeight / 100)).toFixed(1)
    : 0;

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    if (status === 'warning') return <ExclamationOutlined style={{ color: '#faad14' }} />;
    return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 50,
      align: 'center',
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Tên KPI',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name, record) => (
        <Space>
          {getStatusIcon(record.status)}
          <Tooltip title={name}>{name}</Tooltip>
        </Space>
      ),
    },
    {
      title: 'Mục tiêu',
      dataIndex: 'target',
      key: 'target',
      width: 100,
      align: 'right',
      render: (value, record) => {
        const formatted = new Intl.NumberFormat('vi-VN').format(value);
        return `${formatted} ${record.unit}`;
      },
    },
    {
      title: 'Thực tế',
      dataIndex: 'actual',
      key: 'actual',
      width: 100,
      align: 'right',
      render: (value, record) => {
        const formatted = new Intl.NumberFormat('vi-VN').format(value);
        return `${formatted} ${record.unit}`;
      },
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={`${record.completionRate}%`}>
          <Progress
            type="circle"
            percent={Math.min(record.completionRate, 100)}
            width={50}
            format={() => `${record.completionRate}%`}
            status={
              record.status === 'completed' ? 'success' :
              record.status === 'warning' ? 'normal' : 'exception'
            }
          />
        </Tooltip>
      ),
    },
    {
      title: 'Trọng số',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      align: 'center',
      render: (weight) => <Tag color="blue">{weight}%</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <Card>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={12}>
            <div>
              <h1 className="text-3xl font-bold mb-2">{department.name}</h1>
              <p className="text-gray-600">Quản lý Phòng: <strong>{department.manager}</strong></p>
            </div>
          </Col>
          <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={() => navigate('/admin/kpi-dashboards')}
            >
              Xem tất cả Ban phòng
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Chỉ số tổng hợp */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Tổng tiến độ"
              value={avgCompletion}
              suffix="%"
              valueStyle={{ color: avgCompletion >= 100 ? '#52c41a' : '#1890ff', fontSize: 24 }}
              prefix={avgCompletion >= 100 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            />
            <Progress percent={Math.min(avgCompletion, 100)} status={avgCompletion >= 100 ? 'success' : 'active'} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Tiến độ có trọng số"
              value={weightedCompletion}
              suffix="%"
              valueStyle={{ color: weightedCompletion >= 100 ? '#52c41a' : '#1890ff', fontSize: 24 }}
            />
            <Progress percent={Math.min(weightedCompletion, 100)} status={weightedCompletion >= 100 ? 'success' : 'active'} />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Statistic
              title="Hoàn thành"
              value={completedCount}
              suffix={`/${kpis.length}`}
              valueStyle={{ color: '#52c41a', fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6} lg={6}>
          <Card bordered={false} className="shadow-sm">
            <Row gutter={8}>
              <Col span={12}>
                <Statistic
                  title="Cảnh báo"
                  value={warningCount}
                  valueStyle={{ color: '#faad14', fontSize: 24 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Rủi ro"
                  value={riskCount}
                  valueStyle={{ color: '#f5222d', fontSize: 24 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Các góc độ BSC */}
      {kpis.length > 0 && (
        <Row gutter={16}>
          {Object.entries(kpisByPerspective).map(([perspective, perspectiveKPIs]) => {
            if (perspectiveKPIs.length === 0) return null;
            
            const perspectiveProgress = perspectiveKPIs.length > 0
              ? perspectiveKPIs.reduce((sum, k) => sum + k.completionRate, 0) / perspectiveKPIs.length
              : 0;

            return (
              <Col xs={24} sm={12} lg={6} key={perspective}>
                <Card 
                  bordered={false}
                  className="shadow-sm"
                  style={{
                    borderLeft: `4px solid ${PERSPECTIVE_COLORS[perspective]}`,
                  }}
                >
                  <Statistic
                    title={perspective}
                    value={perspectiveProgress.toFixed(1)}
                    suffix="%"
                    valueStyle={{
                      color: PERSPECTIVE_COLORS[perspective],
                      fontSize: 24,
                    }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <small className="text-gray-600">
                      {perspectiveKPIs.length} KPI
                    </small>
                    <Progress
                      percent={Math.min(perspectiveProgress, 100)}
                      strokeColor={PERSPECTIVE_COLORS[perspective]}
                      size="small"
                    />
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Bảng KPI chi tiết */}
      <Card
        title={`Chi tiết KPI - Tổng cộng ${kpis.length} chỉ tiêu`}
        loading={loading}
      >
        {kpis.length === 0 ? (
          <Empty
            description="Chưa có KPI nào được thiết lập cho phòng ban này"
            style={{ marginTop: 48 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={kpis}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
};

export default DepartmentKPIDashboard;
