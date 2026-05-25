'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet } from 'lucide-react';

export default function InfectionReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/infection-reports?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'title', label: '报告标题' },
    { key: 'type', label: '报告类型', render: (v: string) => <Badge variant="secondary" className="text-xs">{v}</Badge> },
    { key: 'period', label: '报告周期' },
    { key: 'author', label: '作者' },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', render: (v: string) => v?.slice(0, 10) },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <FileSpreadsheet size={22} className="text-emerald-500" /> 感染报告管理
      </h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
