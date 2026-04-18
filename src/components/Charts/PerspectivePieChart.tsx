import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PERSPECTIVE_COLORS } from '../../utils/kpiUtils';

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PerspectivePieChart = ({ kpis }) => {
  const data = React.useMemo(() => {
    const grouped = {};
    kpis.forEach((kpi) => {
      if (!grouped[kpi.perspective]) {
        grouped[kpi.perspective] = { name: kpi.perspective, value: 0, count: 0 };
      }
      grouped[kpi.perspective].value += kpi.weight;
      grouped[kpi.perspective].count += 1;
    });
    return Object.values(grouped);
  }, [kpis]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={90}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={PERSPECTIVE_COLORS[entry.name] || '#8884d8'} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PerspectivePieChart;
