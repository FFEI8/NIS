'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { Pill } from 'lucide-react';

export default function AntibioticUsagePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/antibiotic-usages?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'dept', label: '科室' },
    { key: 'month', label: '月份' },
    { key: 'totalPatients', label: '住院人数' },
    { key: 'antibioticPatients', label: '使用人数' },
    { key: 'usageRate', label: '使用率', render: (v: number) => <div className="flex items-center gap-2"><div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${v > 60 ? 'bg-red-500' : v > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(v, 100)}%` }} /></div><span className="text-xs font-medium">{v}%</span></div> },
    { key: 'ddd', label: 'DDD值', render: (v: number) => v ? v.toFixed(1) : '-' },
    { key: 'pathogenSendRate', label: '送检率', render: (v: number) => v ? `${v.toFixed(1)}%` : '-' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Pill size={22} className="text-teal-500" /> 抗菌药物应用管理
      </h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
}
