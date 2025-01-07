import React from 'react';
import { Tag } from 'antd';

interface StatusTagProps {
  status: string;
  source_status?: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ status, source_status }) => {
  const getStatusConfig = () => {
    switch (source_status || status) {
      case 'manual':
        return { color: 'blue', text: '手动创建' };
      case 'crawler_pending':
        return { color: 'orange', text: '待爬虫' };
      case 'crawler_running':
        return { color: 'processing', text: '爬虫进行中' };
      case 'crawler_success':
        return { color: 'success', text: '爬虫成功' };
      case 'crawler_failed':
        return { color: 'error', text: '爬虫失败' };
      case 'pending':
        return { color: 'default', text: '待分配' };
      case 'distributed':
        return { color: 'success', text: '已分配' };
      case 'inactive':
        return { color: 'error', text: '已下架' };
      default:
        return { color: 'default', text: status };
    }
  };

  const { color, text } = getStatusConfig();

  return <Tag color={color}>{text}</Tag>;
};

export default StatusTag; 