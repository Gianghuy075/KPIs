import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { DASHBOARD_BSC_SHORT_NAMES } from '../../constants/dashboard';

const BSC_COLORS = {
  'Tài chính': '#1d4ed8',
  'Khách hàng': '#15803d',
  'Quy trình nội bộ': '#b45309',
  'Học hỏi & Phát triển': '#7c3aed',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.fullName}</div>
      <div>Hoàn thành TB: <b>{d.avg.toFixed(1)}%</b></div>
      <div style={{ color: '#6b7280' }}>Số KPI: {d.count}</div>
    </div>
  );
};

const BscBarChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 4 }} barCategoryGap="35%">
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 12, fill: '#374151' }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        domain={[0, 110]}
        tickFormatter={v => `${v}%`}
        tick={{ fontSize: 11, fill: '#9ca3af' }}
        axisLine={false}
        tickLine={false}
        width={40}
      />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
      <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={60}>
        {data.map(entry => (
          <Cell key={entry.name} fill={BSC_COLORS[entry.fullName] || '#8884d8'} />
        ))}
        <LabelList dataKey="avg" position="top" formatter={v => `${v.toFixed(0)}%`} style={{ fontSize: 11, fill: '#374151', fontWeight: 600 }} />
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

export const SHORT_NAMES = DASHBOARD_BSC_SHORT_NAMES;
export default BscBarChart;
