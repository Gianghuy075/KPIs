import React from 'react';
import { Spin } from 'antd';

const LoadingSpinner = ({ tip = 'Đang tải...', size = 'large' }) => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
    <Spin size={size} tip={tip} />
  </div>
);

export default LoadingSpinner;
