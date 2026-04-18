import React from 'react';
import { Card } from 'antd';
import BonusConfigManager from '../../features/bonus/BonusConfigManager';

const BonusConfigs = () => {
  return (
    <Card title="Cấu hình thưởng KPI" style={{ marginBottom: 24 }}>
      <BonusConfigManager />
    </Card>
  );
};

export default BonusConfigs;
