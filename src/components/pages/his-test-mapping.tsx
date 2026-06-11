'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, Pagination } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeftRight, Plus, Save, RefreshCw, Search, ToggleLeft, ToggleRight,
  AlertTriangle, Link2, Hash, FileWarning,
} from 'lucide-react';

function getConsistencyRiskColor(risk: string) {
  if (!risk) return '';
  if (risk.includes('高') || risk.includes('严重')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
  if (risk.includes('中') || risk.includes('一般')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
}

function HisMappingForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    hisTestCode: item?.hisTestCode || '',
    hisTestName: item?.hisTestName || '',
    subItemNo: item?.subItemNo ?? 1,
    testItemCode: item?.testItemCode || '',
    testItemName: item?.testItemName || '',
    transformRule: item?.transformRule || '',
    specialLogic: item?.specialLogic || '',
    consistencyRisk: item?.consistencyRisk || '',
    sort: item?.sort ?? 0,
    status: item?.status ?? 1,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.hisTestCode || !form.hisTestName || !form.testItemCode || !form.testItemName) {
      toast.error('请填写必填字段');
      return;
    }
    setSaving(true);
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight size={20} className="text-emerald-500" />
            {item ? '编辑HIS检验映射' : '新增HIS检验映射'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 py-4">
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <Link2 size={16} className="text-sky-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">HIS检验项目信息</span>
            </div>
          </div>
          <FormField label="HIS检验代码" required>
            <Input value={form.hisTestCode} onChange={e => setForm(f => ({ ...f, hisTestCode: e.target.value }))} placeholder="HIS系统中的组合项目代码" />
          </FormField>
          <FormField label="HIS检验名称" required>
            <Input value={form.hisTestName} onChange={e => setForm(f => ({ ...f, hisTestName: e.target.value }))} placeholder="HIS系统中的组合项目名称" />
          </FormField>
          <FormField label="子项序号">
            <Input type="number" value={form.subItemNo} onChange={e => setForm(f => ({ ...f, subItemNo: parseInt(e.target.value) || 1 }))} />
          </FormField>

          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <Hash size={16} className="text-emerald-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">系统检验项目信息</span>
            </div>
          </div>
          <FormField label="系统检验编码" required>
            <Input value={form.testItemCode} onChange={e => setForm(f => ({ ...f, testItemCode: e.target.value }))} placeholder="系统中的检验项目编码" />
          </FormField>
          <FormField label="系统检验名称" required>
            <Input value={form.testItemName} onChange={e => setForm(f => ({ ...f, testItemName: e.target.value }))} placeholder="系统中的检验项目名称" />
          </FormField>

          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
              <AlertTriangle size={16} className="text-amber-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">转换与一致性</span>
            </div>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <FormField label="转换规则">
              <textarea value={form.transformRule} onChange={e => setForm(f => ({ ...f, transformRule: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                placeholder="描述HIS值到系统值的转换规则" />
            </FormField>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <FormField label="特殊处理逻辑">
              <textarea value={form.specialLogic} onChange={e => setForm(f => ({ ...f, specialLogic: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                placeholder="描述需要特殊处理的逻辑" />
            </FormField>
          </div>
          <div className="col-span-1 sm:col-span-2">
            <FormField label="一致性风险说明">
              <textarea value={form.consistencyRisk} onChange={e => setForm(f => ({ ...f, consistencyRisk: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                placeholder="描述数据一致性风险" />
            </FormField>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.hisTestCode || !form.hisTestName || !form.testItemCode || !form.testItemName}
            className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function HisTestMappingPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ status: '', keyword: '' });
  // Stats from API (not from paginated data)
  const [stats, setStats] = useState({ enabledCount: 0, disabledCount: 0, riskCount: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (filter.status) params.set('status', filter.status);
    if (filter.keyword) params.set('keyword', filter.keyword);
    const res = await fetch(`/api/his-id-test-mapping?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  // Fetch stats separately (not affected by pagination)
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/his-id-test-mapping/stats');
      const d = await res.json();
      if (d.success) {
        setStats({
          enabledCount: d.data.enabledCount,
          disabledCount: d.data.disabledCount,
          riskCount: d.data.riskCount,
        });
      }
    } catch { /* ignore */ }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchStats(); }, [fetchStats]);

  const handleSave = async (formData: any) => {
    try {
      if (editItem) {
        const res = await fetch(`/api/his-id-test-mapping/${editItem.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!result.success) { toast.error(result.message); return; }
        toast.success('HIS检验映射已更新');
      } else {
        const res = await fetch('/api/his-id-test-mapping', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!result.success) { toast.error(result.message); return; }
        toast.success('HIS检验映射已创建');
      }
      setShowForm(false); setEditItem(null); void fetchData(); void fetchStats();
    } catch {
      toast.error('保存失败');
    }
  };

  const handleDelete = async (row: any) => {
    try {
      const res = await fetch(`/api/his-id-test-mapping/${row.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) { toast.success('已删除'); void fetchData(); void fetchStats(); }
      else toast.error(result.message);
    } catch {
      toast.error('删除失败');
    }
  };

  const handleToggleStatus = async (row: any) => {
    const newStatus = row.status === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/his-id-test-mapping/${row.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(newStatus === 1 ? '已启用' : '已禁用');
        void fetchData(); void fetchStats();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const escapeCsvField = (value: string | number | undefined | null): string => {
    const str = String(value ?? '');
    // If the field contains a comma, double quote, or newline, wrap in double quotes
    // and escape any internal double quotes by doubling them
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExport = () => {
    const headers = ['HIS检验代码', 'HIS检验名称', '子项序号', '系统检验编码', '系统检验名称', '转换规则', '一致性风险', '状态'];
    const csv = [
      headers.map(escapeCsvField).join(','),
      ...data.map(r =>
        [
          escapeCsvField(r.hisTestCode),
          escapeCsvField(r.hisTestName),
          escapeCsvField(r.subItemNo),
          escapeCsvField(r.testItemCode),
          escapeCsvField(r.testItemName),
          escapeCsvField(r.transformRule || ''),
          escapeCsvField(r.consistencyRisk || ''),
          escapeCsvField(r.status === 1 ? '启用' : '禁用'),
        ].join(',')
      )
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'HIS检验项目映射.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'hisTestCode', label: 'HIS检验代码', render: (v: string) => <span className="text-xs font-mono text-sky-600 dark:text-sky-400">{v}</span> },
    { key: 'hisTestName', label: 'HIS检验名称', render: (v: string) => <span className="text-xs max-w-[160px] truncate block" title={v}>{v}</span> },
    { key: 'subItemNo', label: '子项序号', render: (v: number) => <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-slate-50 dark:bg-slate-800">{v}</Badge> },
    { key: 'testItemCode', label: '系统检验编码', render: (v: string) => <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{v}</span> },
    { key: 'testItemName', label: '系统检验名称', render: (v: string) => <span className="text-xs max-w-[160px] truncate block" title={v}>{v}</span> },
    { key: 'transformRule', label: '转换规则', render: (v: string) => v ? (
      <span className="text-xs max-w-[120px] truncate block" title={v}>{v}</span>
    ) : <span className="text-slate-400 text-xs">-</span> },
    { key: 'consistencyRisk', label: '一致性风险', render: (v: string) => v ? (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 max-w-[120px] truncate ${getConsistencyRiskColor(v)}`} title={v}>{v}</Badge>
    ) : <span className="text-slate-400 text-xs">-</span> },
    { key: 'status', label: '状态', render: (v: number) => <StatusBadge status={v === 1 ? '已启用' : '已禁用'} /> },
  ];

  // Summary stats (from API, not from paginated data)
  const { enabledCount, disabledCount, riskCount } = stats;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ArrowLeftRight size={22} className="text-emerald-500" /> HIS检验项目映射
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增映射
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '映射总数', value: total, icon: <ArrowLeftRight size={16} />, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: '已启用', value: enabledCount, icon: <ToggleRight size={16} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: '已禁用', value: disabledCount, icon: <ToggleLeft size={16} />, color: 'text-slate-400 dark:text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: '有风险说明', value: riskCount, icon: <FileWarning size={16} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className={`p-2 rounded-lg ${stat.bg}`}><span className={stat.color}>{stat.icon}</span></div>
            <div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{stat.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <Input value={filter.keyword} onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
          placeholder="搜索HIS代码/名称/系统名称"
          className="w-56 h-8 text-sm" />
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          <option value="1">启用</option>
          <option value="0">禁用</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>

      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }}
        onDelete={handleDelete}
        onExport={handleExport}
        onAction={(row, action) => {
          if (action === 'toggle') handleToggleStatus(row);
        }}
      />

      <Pagination page={page} total={total} onPageChange={setPage} />

      {showForm && <HisMappingForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
