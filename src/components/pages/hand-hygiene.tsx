'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { Hand } from 'lucide-react';

export default function HandHygienePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hand-hygienes?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'dept', label: '科室' },
    { key: 'month', label: '月份' },
    { key: 'totalOpportunities', label: '应执行次数' },
    { key: 'compliantActions', label: '实际执行次数' },
    { key: 'complianceRate', label: '依从率', render: (v: number) => <div className="flex items-center gap-2"><div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v}%` }} /></div><span className="text-xs font-medium">{v}%</span></div> },
    { key: 'beforeContact', label: '接触前', render: (v: number) => v ? `${v}%` : '-' },
    { key: 'afterContact', label: '接触后', render: (v: number) => v ? `${v}%` : '-' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Hand size={22} className="text-emerald-500" /> 手卫生依从性监测
      </h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
