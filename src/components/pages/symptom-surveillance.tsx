'use client';

import { useState, useCallback, useEffect } from 'react';
import { useConfigStore } from '@/store/config-store';
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
import { ScanSearch, Plus, Save, RefreshCw, Search } from 'lucide-react';

function SymptomSurveillanceForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const { getDeptNames, getDictNames } = useConfigStore();
  const deptOptions = getDeptNames();
  const symptomGroupOptions = getDictNames('symptom_group');
  const statusOptions = getDictNames('symptom_status');

  const [form, setForm] = useState({
    dept: item?.dept || '', patientId: item?.patientId || '', patientName: item?.patientName || '',
    gender: item?.gender || '男', age: item?.age || '', temperature: item?.temperature || '',
    symptomGroup: item?.symptomGroup || '发热', symptomDetail: item?.symptomDetail || '',
    onsetDate: item?.onsetDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    reportDate: item?.reportDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    reporter: item?.reporter || '',
    isClustered: item?.isClustered || 0, clusterId: item?.clusterId || '',
    alertTriggered: item?.alertTriggered || 0, alertId: item?.alertId || '',
    preliminaryJudge: item?.preliminaryJudge || '', handlingMeasure: item?.handlingMeasure || '',
    status: item?.status || '待核实',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.patientName || !form.symptomDetail) return;
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
            <ScanSearch size={20} className="text-emerald-500" />
            {item ? '编辑症状监测' : '新增症状监测'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <FormField label="科室" required><select value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))} className={selectClass}>{deptOptions.map(d => <option key={d} value={d}>{d}</option>)}</select></FormField>
          <FormField label="患者ID"><Input value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} /></FormField>
          <FormField label="患者姓名" required><Input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} /></FormField>
          <FormField label="性别"><select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className={selectClass}><option value="男">男</option><option value="女">女</option></select></FormField>
          <FormField label="年龄"><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} /></FormField>
          <FormField label="体温(°C)"><Input type="number" step="0.1" value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: Number(e.target.value) }))} /></FormField>
          <FormField label="症状群" required><select value={form.symptomGroup} onChange={e => setForm(f => ({ ...f, symptomGroup: e.target.value }))} className={selectClass}>{symptomGroupOptions.map(g => <option key={g} value={g}>{g}</option>)}</select></FormField>
          <FormField label="发病日期" required><Input type="date" value={form.onsetDate} onChange={e => setForm(f => ({ ...f, onsetDate: e.target.value }))} /></FormField>
          <FormField label="报告日期"><Input type="date" value={form.reportDate} onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} /></FormField>
          <FormField label="报告人"><Input value={form.reporter} onChange={e => setForm(f => ({ ...f, reporter: e.target.value }))} /></FormField>
          <FormField label="症状详情" required className="col-span-2"><Input value={form.symptomDetail} onChange={e => setForm(f => ({ ...f, symptomDetail: e.target.value }))} /></FormField>
          <FormField label="是否聚集性"><select value={form.isClustered} onChange={e => setForm(f => ({ ...f, isClustered: Number(e.target.value) }))} className={selectClass}><option value={0}>否</option><option value={1}>是</option></select></FormField>
          <FormField label="初步判断"><Input value={form.preliminaryJudge} onChange={e => setForm(f => ({ ...f, preliminaryJudge: e.target.value }))} /></FormField>
          <FormField label="处置措施" className="col-span-2"><Input value={form.handlingMeasure} onChange={e => setForm(f => ({ ...f, handlingMeasure: e.target.value }))} /></FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.patientName || !form.symptomDetail} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SymptomSurveillancePage() {
  const { getDeptNames, getDictNames } = useConfigStore();
  const deptOptions = getDeptNames();
  const symptomGroupOptions = getDictNames('symptom_group');
  const statusOptions = getDictNames('symptom_status');

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ symptomGroup: '', dept: '', status: '', isClustered: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (filter.symptomGroup) params.set('symptomGroup', filter.symptomGroup);
    if (filter.dept) params.set('dept', filter.dept);
    if (filter.status) params.set('status', filter.status);
    if (filter.isClustered) params.set('isClustered', filter.isClustered);
    const res = await fetch(`/api/symptom-surveillance?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/symptom-surveillance/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/symptom-surveillance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    setShowForm(false); setEditItem(null); void fetchData();
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该症状监测记录？')) return;
    await fetch(`/api/symptom-surveillance/${row.id}`, { method: 'DELETE' });
    void fetchData();
  };

  const handleAction = async (row: any, action: string) => {
    if (action === 'verify') {
      await fetch(`/api/symptom-surveillance/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...row, status: '已核实' }) });
      void fetchData();
    }
  };

  const columns = [
    { key: 'patientName', label: '患者姓名', render: (v: string) => <span className="font-medium text-slate-800 dark:text-slate-200">{v}</span> },
    { key: 'dept', label: '科室' },
    { key: 'temperature', label: '体温', render: (v: number) => {
      if (!v) return '-';
      const color = v > 38.5 ? 'text-red-600 font-bold' : v > 37.3 ? 'text-orange-600 font-medium' : 'text-slate-600 dark:text-slate-400';
      return <span className={color}>{v}°C</span>;
    }},
    { key: 'symptomGroup', label: '症状群', render: (v: string) => <Badge variant="outline" className="text-xs">{v}</Badge> },
    { key: 'symptomDetail', label: '症状详情', render: (v: string) => <span className="text-xs max-w-[150px] truncate block">{v}</span> },
    { key: 'onsetDate', label: '发病日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'isClustered', label: '聚集性', render: (v: number) => v === 1 ? <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs">聚集</Badge> : <span className="text-slate-400 text-xs">否</span> },
    { key: 'alertTriggered', label: '预警', render: (v: number) => v === 1 ? <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">已触发</Badge> : <span className="text-slate-400 text-xs">-</span> },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ScanSearch size={22} className="text-emerald-500" /> 症状监测
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增记录
        </Button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">发热、腹泻等症状群的监测、核实与聚集性预警</p>
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <select value={filter.symptomGroup} onChange={e => setFilter(f => ({ ...f, symptomGroup: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
          <option value="">全部症状群</option>
          {symptomGroupOptions.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filter.dept} onChange={e => setFilter(f => ({ ...f, dept: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
          <option value="">全部科室</option>
          {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
          <option value="">全部状态</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.isClustered} onChange={e => setFilter(f => ({ ...f, isClustered: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
          <option value="">是否聚集性</option>
          <option value="1">是</option>
          <option value="0">否</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} onAction={handleAction} />
      <Pagination page={page} total={total} onPageChange={setPage} />
      {showForm && <SymptomSurveillanceForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
