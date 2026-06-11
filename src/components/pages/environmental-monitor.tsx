'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
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
import { Droplets, Plus, Save, RefreshCw } from 'lucide-react';

function EnvMonitorForm({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const { getDeptNames, getDictNames } = useConfigStore();
  const deptOptions = getDeptNames('临床');
  const sampleTypeOptions = getDictNames('sample_type');

  const [form, setForm] = useState({ dept: '', samplePoint: '', sampleType: '空气', sampleDate: new Date().toISOString().slice(0, 10), colonyCount: '', standardLimit: '', result: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <>
      <div className="space-y-4 py-4">
        {[
          { label: '科室', key: 'dept', type: 'select', options: deptOptions, required: true },
          { label: '采样点', key: 'samplePoint', type: 'text', required: true },
          { label: '采样类型', key: 'sampleType', type: 'select', options: sampleTypeOptions },
          { label: '采样日期', key: 'sampleDate', type: 'date' },
          { label: '菌落数', key: 'colonyCount', type: 'number' },
          { label: '标准限值', key: 'standardLimit', type: 'number' },
          { label: '结果', key: 'result', type: 'select', options: ['合格', '不合格'] },
        ].map(f => (
          <FormField key={f.key} label={f.label} required={f.required}>
            {f.type === 'select' ? (
              <select value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <Input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
            )}
          </FormField>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>取消</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? '保存中...' : '保存'}
        </Button>
      </DialogFooter>
    </>
  );
}

export default function EnvironmentalMonitorPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/environmental-monitors?page=${page}&pageSize=20`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    await fetch('/api/environmental-monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    setShowForm(false); fetchData();
  };

  const handleReview = async (row: any) => {
    await fetch(`/api/environmental-monitors/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewStatus: '已审核', reviewer: useAppStore.getState().currentUser?.name }) });
    fetchData();
  };

  const columns = [
    { key: 'dept', label: '科室' },
    { key: 'samplePoint', label: '采样点' },
    { key: 'sampleType', label: '采样类型' },
    { key: 'sampleDate', label: '采样日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'colonyCount', label: '菌落数' },
    { key: 'result', label: '结果', render: (v: string) => <StatusBadge status={v || '待出'} /> },
    { key: 'reviewStatus', label: '审核状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Droplets size={22} className="text-cyan-500" /> 环境卫生学监测
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增监测
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onAction={handleReview} />
      <Pagination page={page} total={total} onPageChange={setPage} />
      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Droplets size={20} className="text-cyan-500" /> 新增环境监测记录</DialogTitle>
            </DialogHeader>
            <EnvMonitorForm onSave={handleSave} onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
