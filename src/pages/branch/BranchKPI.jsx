import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { branchKpiService } from '../../services/branchKpiService';
import { useAuth } from '../../contexts/AuthContext';

const BranchKPI = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user?.branch) return;
    setLoading(true);
    try {
      const res = await branchKpiService.listByBranch(user.branch._id || user.branch);
      setData(res);
    } catch {
      message.error('Không tải được KPI phân xưởng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.branch]);

  const formatValue = (value, unit) => {
    if (typeof value !== 'number') return `${value} ${unit}`;
    const num = unit?.toLowerCase() === 'vnd' ? value.toLocaleString('vi-VN') : value.toLocaleString('vi-VN');
    return `${num} ${unit}`;
  };

  const columns = [
    { title: 'Tên KPI', dataIndex: ['companyKpi', 'title'], key: 'title' },
    { title: 'Category', dataIndex: ['companyKpi', 'category'], key: 'category' },
    { title: 'Phân bổ', key: 'alloc', render: (_, r)=> formatValue(r.allocatedValue, r.unit) },
    { title: 'Thực tế', dataIndex: 'actualValue', key: 'actualValue', render:(v, r)=> formatValue(v, r.unit) },
    { title: 'Hạn', dataIndex: 'targetDate', key: 'targetDate', render:(d)=> dayjs(d).format('YYYY-MM-DD') },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render:(s)=> <Tag>{s === 'assigned' ? 'Đã phân bổ' : s === 'in_progress' ? 'Đang thực hiện' : s === 'completed' ? 'Hoàn thành' : s}</Tag> },
  ];

  return (
    <Card title="KPI Phân xưởng">
      <Table columns={columns} dataSource={data} loading={loading} rowKey="_id" />
    </Card>
  );
};

export default BranchKPI;
