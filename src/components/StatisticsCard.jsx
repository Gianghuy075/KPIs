import React from 'react';
import { Card, Statistic, Progress, Tag } from 'antd';

const StatisticsCard = ({
  title,
  value,
  suffix,
  prefix,
  precision = 1,
  progressPercent,
  progressStatus,
  tag,
  tagColor,
  style,
}) => {
  return (
    <Card
      size="small"
      style={{ height: '100%', ...style }}
      bodyStyle={{ padding: '16px' }}
    >
      <Statistic
        title={title}
        value={value}
        suffix={suffix}
        prefix={prefix}
        precision={precision}
        valueStyle={{ fontSize: 24 }}
      />
      {progressPercent !== undefined && (
        <Progress
          percent={progressPercent}
          size="small"
          status={progressStatus}
          style={{ marginTop: 8 }}
        />
      )}
      {tag && (
        <Tag color={tagColor} style={{ marginTop: 8 }}>
          {tag}
        </Tag>
      )}
    </Card>
  );
};

export default StatisticsCard;
