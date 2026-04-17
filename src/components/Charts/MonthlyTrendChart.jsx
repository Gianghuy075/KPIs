import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {val != null
        ? <div>Điểm KPI: <b style={{ color: val >= 85 ? '#16a34a' : val >= 70 ? '#d97706' : '#dc2626' }}>{val.toFixed(1)}%</b></div>
        : <div style={{ color: '#9ca3af' }}>Chưa có dữ liệu</div>
      }
    </div>
  );
};

const MonthlyTrendChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <AreaChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 4 }}>
      <defs>
        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
          <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
      <YAxis
        domain={[0, 110]}
        tickFormatter={v => `${v}%`}
        tick={{ fontSize: 11, fill: '#9ca3af' }}
        axisLine={false}
        tickLine={false}
        width={40}
      />
      <Tooltip content={<CustomTooltip />} />
      <ReferenceLine
        y={85}
        stroke="#16a34a"
        strokeDasharray="5 4"
        label={{ value: '85% mục tiêu', position: 'insideTopRight', fontSize: 11, fill: '#16a34a' }}
      />
      <Area
        type="monotone"
        dataKey="score"
        stroke="#1d4ed8"
        strokeWidth={2.5}
        fill="url(#scoreGrad)"
        dot={{ r: 4, fill: '#1d4ed8', strokeWidth: 0 }}
        activeDot={{ r: 6 }}
        connectNulls={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);

export default MonthlyTrendChart;
