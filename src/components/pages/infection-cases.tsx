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
import { Activity, Plus, Save, RefreshCw, Search } from 'lucide-react';

function InfectionCaseForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const { getDeptNames, getDictNames } = useConfigStore();
  const deptOptions = getDeptNames().length > 0 ? getDeptNames() : ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科'];
  const infectionSiteOptions = getDictNames('infection_site').length > 0 ? getDictNames('infection_site') : ['手术部位', '呼吸道', '泌尿道', '血流', '皮肤软组织', '胃肠道'];
  const statusOptions = getDictNames('infection_case_status').length > 0 ? getDictNames('infection_case_status') : ['待审核', '已确认', '已排除'];

  const [form, setForm] = useState({
    patientId: item?.patientId || '', patientName: item?.patientName || '', gender: item?.gender || '男',
    age: item?.age || '', dept: item?.dept || '内科', infectionSite: item?.infectionSite || '',
    pathogen: item?.pathogen || '', infectionDate: item?.infectionDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    admissionDate: item?.admissionDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    status: item?.status || '待审核',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.patientId || !form.patientName) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" />
            {item ? '编辑感染病例' : '新增感染病例'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {[
            { label: '患者ID', key: 'patientId', type: 'text', required: true },
            { label: '患者姓名', key: 'patientName', type: 'text', required: true },
            { label: '性别', key: 'gender', type: 'select', options: ['男', '女'] },
            { label: '年龄', key: 'age', type: 'number' },
            { label: '科室', key: 'dept', type: 'select', options: deptOptions },
            { label: '感染部位', key: 'infectionSite', type: 'select', options: infectionSiteOptions, required: true },
            { label: '病原体', key: 'pathogen', type: 'text' },
            { label: '状态', key: 'status', type: 'select', options: statusOptions },
          ].map(field => (
            <FormField key={field.key} label={field.label} required={field.required}>
              {field.type === 'select' ? (
                <select value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input type={field.type} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
              )}
            </FormField>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.patientId || !form.patientName} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InfectionCasesPage() {
  const { getDeptNames, getDictNames } = useConfigStore();
  const deptOptions = getDeptNames().length > 0 ? getDeptNames() : ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '血液科', '肿瘤科'];
  const infectionSiteOptions = getDictNames('infection_site').length > 0 ? getDictNames('infection_site') : ['手术部位', '呼吸道', '泌尿道', '血流', '皮肤软组织', '胃肠道', '中枢神经'];
  const statusOptions = getDictNames('infection_case_status').length > 0 ? getDictNames('infection_case_status') : ['待审核', '已确认', '已排除'];

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ dept: '', status: '', infectionSite: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', ...filter });
    const res = await fetch(`/api/infection-cases?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/infection-cases/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/infection-cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    setShowForm(false); setEditItem(null); void fetchData();
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该感染病例？')) return;
    await fetch(`/api/infection-cases/${row.id}`, { method: 'DELETE' });
    void fetchData();
  };

  const handleExport = () => {
    const csv = ['患者ID,患者姓名,性别,年龄,科室,感染部位,病原体,感染日期,状态',
      ...data.map(r => `${r.patientId},${r.patientName},${r.gender},${r.age},${r.dept},${r.infectionSite},${r.pathogen || ''},${r.infectionDate?.slice(0, 10)},${r.status}`)
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '感染病例数据.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'patientId', label: '患者ID' },
    { key: 'patientName', label: '患者姓名' },
    { key: 'gender', label: '性别' },
    { key: 'age', label: '年龄' },
    { key: 'dept', label: '科室' },
    { key: 'infectionSite', label: '感染部位' },
    { key: 'pathogen', label: '病原体', render: (v: string) => <span className="text-xs max-w-[120px] truncate block">{v || '-'}</span> },
    { key: 'infectionDate', label: '感染日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Activity size={22} className="text-emerald-500" /> 感染病例管理
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增病例
        </Button>
      </div>
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <select value={filter.dept} onChange={e => setFilter(f => ({ ...f, dept: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部科室</option>
          {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.infectionSite} onChange={e => setFilter(f => ({ ...f, infectionSite: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部部位</option>
          {infectionSiteOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} onExport={handleExport} />
      <Pagination page={page} total={total} onPageChange={setPage} />
      {showForm && <InfectionCaseForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
