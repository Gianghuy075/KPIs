import { Card } from 'antd';
import AdminKpiOverview from '../../features/workshop-kpi/AdminKpiOverview';

const WorkshopKpiView = () => (
  <Card title="Xem KPI theo phân xưởng" style={{ marginBottom: 24 }}>
    <AdminKpiOverview />
  </Card>
);

export default WorkshopKpiView;
