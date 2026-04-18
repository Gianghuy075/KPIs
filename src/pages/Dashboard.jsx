import React, { useState, useMemo, useEffect } from 'react';
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
import penaltyService from '../services/penaltyService';
import StatisticsCard from '../components/StatisticsCard';
import PerspectivePieChart from '../components/Charts/PerspectivePieChart';
import BscBarChart, { SHORT_NAMES } from '../components/Charts/BscBarChart';
import MonthlyTrendChart from '../components/Charts/MonthlyTrendChart';
import NotificationBar from '../components/Notifications/NotificationBar';
import { getStatus, getStatusLabel, getStatusColor } from '../utils/kpiUtils';
import { calcCompletionRate } from '../utils/bonusUtils';

const { Title, Text } = Typography;

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1].map(y => ({ value: y, label: String(y) }));

const bscColorMap = {
  'Tài chính': '#1d4ed8',
  'Khách hàng': '#15803d',
  'Quy trình nội bộ': '#b45309',
  'Học hỏi & Phát triển': '#7c3aed',
};

const Dashboard = () => {
  const { message, modal } = AntApp.useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [year, setYear] = useState(currentYear);
  const [rawKpis, setRawKpis] = useState([]);
  const [bscCategories, setBscCategories] = useState([]);
  const [penaltyLogics, setPenaltyLogics] = useState([]);
  const [allEntries, setAllEntries] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editingKpi, setEditingKpi] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editForm] = Form.useForm();

  const isAdmin = user?.role === 'system_admin';
  const canManageKpis = isAdmin;
  const phanXuongId = user?.phanXuongId;

  useEffect(() => {
    Promise.all([
      workshopKpiService.listBscCategories(),
      penaltyService.list(),
    ]).then(([bsc, pl]) => {
      setBscCategories(bsc);
      setPenaltyLogics(pl);
    }).catch(() => {});
  }, []);

  const fetchKPIs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { year };
      if (!isAdmin && phanXuongId) params.phanXuongId = phanXuongId;
      const kpiList = await workshopKpiService.list(params);
      setRawKpis(kpiList || []);
      const entriesMap = {};
      await Promise.all((kpiList || []).map(async (kpi) => {
        try {
          const entries = await workshopKpiService.getMonthlyEntries(kpi.id);
          entriesMap[kpi.id] = entries;
        } catch {
          entriesMap[kpi.id] = [];
        }
      }));
      setAllEntries(entriesMap);
    } catch (err) {
      setError(err?.message || 'Không tải được KPI');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, [user?.role, year, phanXuongId]);

  const bscCategoryMap = useMemo(() => {
    const map = {};
    bscCategories.forEach(c => { map[c.id] = c.name; });
    return map;
  }, [bscCategories]);

  const kpis = useMemo(() => rawKpis.map(kpi => {
    const entries = allEntries[kpi.id] || [];
    const withData = entries.filter(e => e.actualValue != null);
    const actual = withData.length ? withData[withData.length - 1].actualValue : null;
    const completionRate = actual != null && kpi.targetValue
      ? calcCompletionRate(Number(actual), Number(kpi.targetValue))
      : 0;
    return {
      id: kpi.id,
      name: kpi.name,
      unit: kpi.targetUnit || '',
      weight: Number(kpi.weight || 0),
      target: Number(kpi.targetValue || 0),
      actual: actual ?? null,
      completionRate,
      bsc: bscCategoryMap[kpi.bscCategoryId] || 'Khác',
      status: getStatus(completionRate),
    };
  }), [rawKpis, allEntries, bscCategoryMap]);

  const stats = useMemo(() => {
    if (!kpis.length) return null;
    const completed = kpis.filter(k => k.status === 'completed').length;
    const warning = kpis.filter(k => k.status === 'warning').length;
    const risk = kpis.filter(k => k.status === 'risk').length;
    const weighted = kpis.reduce(
      (acc, k) => {
        acc.totalWeight += k.weight || 0;
        acc.weightedScore += (k.completionRate * (k.weight || 0)) / 100;
        return acc;
      },
      { weightedScore: 0, totalWeight: 0 },
    );
    const overallScore = weighted.totalWeight > 0
      ? (weighted.weightedScore / weighted.totalWeight) * 100
      : kpis.reduce((s, k) => s + k.completionRate, 0) / kpis.length;
    return {
      totalKPIs: kpis.length,
      overallScore: parseFloat(overallScore.toFixed(1)),
      completed,
      warning,
      risk,
      totalWeight: weighted.totalWeight,
    };
  }, [kpis]);

  const overallStatus = stats ? getStatus(stats?.overallScore) : null;

  const categoryData = useMemo(() => {
    const map = {};
    kpis.forEach(k => {
      map[k.bsc] = (map[k.bsc] || 0) + (k.weight || 1);
    });
    return Object.entries(map).map(([name, weight]) => ({ name, value: weight, weight, perspective: name }));
  }, [kpis]);

  const bscBarData = useMemo(() => {
    const order = ['Tài chính', 'Khách hàng', 'Quy trình nội bộ', 'Học hỏi & Phát triển'];
    const groups = {};
    kpis.forEach(k => {
      if (!groups[k.bsc]) groups[k.bsc] = [];
      groups[k.bsc].push(k.completionRate);
    });
    return order.filter(b => groups[b]).map(b => ({
      name: SHORT_NAMES[b] || b,
      fullName: b,
      avg: groups[b].reduce((s, v) => s + v, 0) / groups[b].length,
      count: groups[b].length,
    }));
  }, [kpis]);

  const monthlyTrend = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: `T${i + 1}`,
      weightedScore: 0,
      totalWeight: 0,
    }));
    kpis.forEach(kpi => {
      const entries = allEntries[kpi.id] || [];
      entries.forEach(e => {
        const mIdx = (e.month ?? e.monthIndex ?? 1) - 1;
        if (mIdx >= 0 && mIdx < 12 && e.actualValue != null && kpi.target > 0) {
          const rate = calcCompletionRate(Number(e.actualValue), kpi.target);
          months[mIdx].weightedScore += rate * (kpi.weight || 1);
          months[mIdx].totalWeight += (kpi.weight || 1);
        }
      });
    });
    return months.map(m => ({
      month: m.month,
      score: m.totalWeight > 0 ? parseFloat((m.weightedScore / m.totalWeight).toFixed(1)) : null,
    }));
  }, [kpis, allEntries]);

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
              <Button icon={<ReloadOutlined />} onClick={fetchKPIs} loading={loading}>
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
