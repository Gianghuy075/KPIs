import React from 'react';
import { Card } from 'antd';
import PenaltyLogicManager from '../../features/penalty/PenaltyLogicManager';

const KPIPenaltyRules = () => {
  return (
    <Card title="Quản lý Quy tắc Trừ điểm KPI" style={{ marginBottom: 24 }}>
      <PenaltyLogicManager />
    </Card>
  );
};

export default KPIPenaltyRules;
