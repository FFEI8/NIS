'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable } from '@/components/shared/data-table';
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
import { ShieldAlert, Plus, Upload, RefreshCw } from 'lucide-react';

function ExposureForm({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ staffName: '', staffDept: '', exposureType: '针刺伤', exposurePart: '', exposureDate: new Date().toISOString().slice(0, 10), emergencyAction: '', riskLevel: '中' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.staffName || !form.exposurePart) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <>
      <div className="space-y-3 py-2">
        {[
          { label: '暴露人员', key: 'staffName', type: 'text', required: true },
          { label: '科室', key: 'staffDept', type: 'select', options: ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科'] },
          { label: '暴露类型', key: 'exposureType', type: 'select', options: ['针刺伤', '血液体液暴露', '其他'] },
          { label: '暴露部位', key: 'exposurePart', type: 'text', required: true },
          { label: '暴露日期', key: 'exposureDate', type: 'date' },
          { label: '紧急处理', key: 'emergencyAction', type: 'text' },
          { label: '风险级别', key: 'riskLevel', type: 'select', options: ['高', '中', '低'] },
        ].map(f => (
          <FormField key={f.key} label={f.label} required={f.required}>
            {f.type === 'select' ? (
              <select value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
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
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
          {saving ? '提交中...' : '上报'}
        </Button>
      </DialogFooter>
    </>
  );
}

export default function OccupationalExposurePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/occupational-exposures?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (formData: any) => {
    await fetch('/api/occupational-exposures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    setShowForm(false);
    fetch('/api/occupational-exposures?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); });
  };

  const columns = [
    { key: 'staffName', label: '暴露人员' },
    { key: 'staffDept', label: '科室' },
    { key: 'exposureType', label: '暴露类型' },
    { key: 'exposurePart', label: '暴露部位' },
    { key: 'exposureDate', label: '暴露日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'riskLevel', label: '风险级别', render: (v: string) => <span className={`text-xs font-bold ${v === '高' ? 'text-red-600' : v === '中' ? 'text-amber-600' : 'text-slate-500'}`}>{v}</span> },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ShieldAlert size={22} className="text-orange-500" /> 职业暴露监测
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 上报暴露
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} />
      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ShieldAlert size={20} className="text-orange-500" /> 上报职业暴露</DialogTitle>
            </DialogHeader>
            <ExposureForm onSave={handleSave} onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
