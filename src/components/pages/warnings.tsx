'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, Pagination } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Search } from 'lucide-react';

export default function WarningsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '', level: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', ...filter });
    const res = await fetch(`/api/warnings?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleAction = async (row: any, action: string) => {
    const statusMap: Record<string, string> = { handle: '已处理', confirm: '已确认', exclude: '已排除' };
    await fetch(`/api/warnings/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: statusMap[action], handler: useAppStore.getState().currentUser?.name }) });
    fetchData();
  };

  const columns = [
    { key: 'patientId', label: '患者ID' },
    { key: 'patientName', label: '患者姓名' },
    { key: 'dept', label: '科室' },
    { key: 'warningType', label: '预警类型', render: (v: string) => <Badge variant={v === '暴发预警' ? 'destructive' : 'secondary'} className="text-xs">{v}</Badge> },
    { key: 'warningLevel', label: '预警级别', render: (v: string) => <span className={`text-xs font-bold ${v === '高' ? 'text-red-600' : v === '中' ? 'text-amber-600' : 'text-slate-500'}`}>{v}</span> },
    { key: 'description', label: '描述', render: (v: string) => <span className="text-xs max-w-[200px] truncate block" title={v}>{v}</span> },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <AlertTriangle size={22} className="text-amber-500" /> 智能预警管理
        </h2>
      </div>
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部类型</option>
          {['病例预警', '聚集预警', '暴发预警'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          {['待处理', '已确认', '已排除', '已处理'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.level} onChange={e => setFilter(f => ({ ...f, level: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部级别</option>
          {['高', '中', '低'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onAction={handleAction} />
      <Pagination page={page} total={total} onPageChange={setPage} />
    </div>
  );
}
