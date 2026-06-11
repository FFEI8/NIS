'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConfigStore } from '@/store/config-store';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, Pagination } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Siren, Plus, Save, RefreshCw, Search } from 'lucide-react';

function DiseaseAlertForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const { getDictNames } = useConfigStore();
  const alertTypeOptions = getDictNames('alert_type');
  const alertLevelOptions = getDictNames('alert_level');
  const alertSourceOptions = getDictNames('alert_source');
  const alertStatusOptions = getDictNames('alert_status');

  const [form, setForm] = useState({
    alertType: item?.alertType || '法定传染病预警', alertLevel: item?.alertLevel || '黄色',
    diseaseName: item?.diseaseName || '', alertSource: item?.alertSource || '人工上报',
    triggerRule: item?.triggerRule || '', relatedCaseIds: item?.relatedCaseIds || '',
    relatedSymptomIds: item?.relatedSymptomIds || '', affectedDept: item?.affectedDept || '',
    affectedCount: item?.affectedCount || 0, description: item?.description || '',
    suggestion: item?.suggestion || '', handler: item?.handler || '', handleResult: item?.handleResult || '',
    status: item?.status || '待处理',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.description) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  const selectClass = "w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Siren size={20} className="text-emerald-500" />
            {item ? '编辑传染病预警' : '新增传染病预警'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <FormField label="预警类型" required><select value={form.alertType} onChange={e => setForm(f => ({ ...f, alertType: e.target.value }))} className={selectClass}>{alertTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></FormField>
          <FormField label="预警等级" required><select value={form.alertLevel} onChange={e => setForm(f => ({ ...f, alertLevel: e.target.value }))} className={selectClass}>{alertLevelOptions.map(l => <option key={l} value={l}>{l}</option>)}</select></FormField>
          <FormField label="传染病名称"><Input value={form.diseaseName} onChange={e => setForm(f => ({ ...f, diseaseName: e.target.value }))} /></FormField>
          <FormField label="预警来源"><select value={form.alertSource} onChange={e => setForm(f => ({ ...f, alertSource: e.target.value }))} className={selectClass}>{alertSourceOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></FormField>
          <FormField label="涉及科室"><Input value={form.affectedDept} onChange={e => setForm(f => ({ ...f, affectedDept: e.target.value }))} /></FormField>
          <FormField label="涉及人数"><Input type="number" value={form.affectedCount} onChange={e => setForm(f => ({ ...f, affectedCount: Number(e.target.value) }))} /></FormField>
          <FormField label="触发规则"><Input value={form.triggerRule} onChange={e => setForm(f => ({ ...f, triggerRule: e.target.value }))} /></FormField>
          <FormField label="关联病例IDs"><Input value={form.relatedCaseIds} onChange={e => setForm(f => ({ ...f, relatedCaseIds: e.target.value }))} placeholder="逗号分隔" /></FormField>
          <FormField label="预警描述" required className="col-span-2"><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField>
          <FormField label="处置建议" className="col-span-2"><Input value={form.suggestion} onChange={e => setForm(f => ({ ...f, suggestion: e.target.value }))} /></FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.description} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DiseaseAlertPage() {
  const { getDictNames } = useConfigStore();
  const alertTypeOptions = getDictNames('alert_type');
  const alertLevelOptions = getDictNames('alert_level');
  const alertStatusOptions = getDictNames('alert_status');

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ alertType: '', alertLevel: '', status: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (filter.alertType) params.set('alertType', filter.alertType);
    if (filter.alertLevel) params.set('alertLevel', filter.alertLevel);
    if (filter.status) params.set('status', filter.status);
    const res = await fetch(`/api/disease-alerts?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/disease-alerts/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/disease-alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    setShowForm(false); setEditItem(null); void fetchData();
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该预警记录？')) return;
    await fetch(`/api/disease-alerts/${row.id}`, { method: 'DELETE' });
    void fetchData();
  };

  const handleAction = async (row: any, action: string) => {
    if (action === 'handle') {
      await fetch(`/api/disease-alerts/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...row, status: '处理中', handler: '当前用户', handleTime: new Date().toISOString() }) });
      void fetchData();
    } else if (action === 'close') {
      await fetch(`/api/disease-alerts/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...row, status: '已关闭' }) });
      void fetchData();
    }
  };

  const AlertLevelBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      '红色': 'bg-red-600 text-white',
      '橙色': 'bg-orange-500 text-white',
      '黄色': 'bg-yellow-500 text-white',
      '蓝色': 'bg-blue-500 text-white',
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold ${colors[level] || 'bg-slate-400 text-white'}`}>{level}</span>;
  };

  const columns = [
    { key: 'alertType', label: '预警类型', render: (v: string) => <span className="text-xs">{v}</span> },
    { key: 'alertLevel', label: '预警等级', render: (v: string) => <AlertLevelBadge level={v} /> },
    { key: 'diseaseName', label: '传染病名称', render: (v: string) => <span className="font-medium text-slate-800 dark:text-slate-200">{v || '-'}</span> },
    { key: 'alertSource', label: '预警来源' },
    { key: 'affectedDept', label: '涉及科室', render: (v: string) => v || '-' },
    { key: 'affectedCount', label: '涉及人数', render: (v: number) => <span className="font-medium">{v || 0}</span> },
    { key: 'description', label: '描述', render: (v: string) => <span className="text-xs max-w-[150px] truncate block">{v}</span> },
    { key: 'handler', label: '处理人', render: (v: string) => v || '-' },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', render: (v: string) => v?.slice(0, 10) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Siren size={22} className="text-emerald-500" /> 传染病预警
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增预警
        </Button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">法定传染病预警、聚集性疫情预警、症状监测预警管理</p>
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <select value={filter.alertType} onChange={e => setFilter(f => ({ ...f, alertType: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
          <option value="">全部预警类型</option>
          {alertTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.alertLevel} onChange={e => setFilter(f => ({ ...f, alertLevel: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
          <option value="">全部等级</option>
          {alertLevelOptions.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
          <option value="">全部状态</option>
          {alertStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} onAction={handleAction} />
      <Pagination page={page} total={total} onPageChange={setPage} />
      {showForm && <DiseaseAlertForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
