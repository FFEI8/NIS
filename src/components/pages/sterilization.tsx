'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable } from '@/components/shared/data-table';
import { Flame } from 'lucide-react';

export default function SterilizationPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sterilization-monitors?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'batchNo', label: '批次号' },
    { key: 'sterilizer', label: '灭菌器' },
    { key: 'method', label: '灭菌方式' },
    { key: 'sterilizeDate', label: '灭菌日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'bioResult', label: '生物监测', render: (v: string) => <StatusBadge status={v || '待检测'} /> },
    { key: 'chemResult', label: '化学监测', render: (v: string) => <StatusBadge status={v || '待检测'} /> },
    { key: 'status', label: '综合状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Flame size={22} className="text-orange-500" /> 消毒灭菌效果监测
      </h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
