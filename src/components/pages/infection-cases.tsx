'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useConfigStore } from '@/store/config-store';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, Pagination } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Activity, Plus, Save, RefreshCw, Search, Trash2, AlertTriangle } from 'lucide-react';

function InfectionCaseForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const { getDeptNames, getDictNames } = useConfigStore();
  const deptOptions = getDeptNames();
  const infectionSiteOptions = getDictNames('infection_site');
  const statusOptions = getDictNames('infection_case_status');

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
        <div className="grid grid-cols-2 gap-4 py-4">
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
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors">
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
  const deptOptions = getDeptNames();
  const infectionSiteOptions = getDictNames('infection_site');
  const statusOptions = getDictNames('infection_case_status');

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ dept: '', status: '', infectionSite: '' });

  // Batch delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', ...filter });
    const res = await fetch(`/api/infection-cases?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Clear selection when data changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [data]);

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

  const handleBatchDelete = async () => {
    setBatchDeleting(true);
    try {
      const res = await fetch('/api/infection-cases/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const d = await res.json();
      if (d.success) {
        setSelectedIds(new Set());
        setShowBatchDeleteConfirm(false);
        void fetchData();
      }
    } catch {
      // Error handling
    } finally {
      setBatchDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length && data.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map((row: any) => row.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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

  const allSelected = data.length > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Activity size={22} className="text-emerald-500" /> 感染病例管理
        </h2>
        <div className="flex items-center gap-2">
          {/* Batch delete button */}
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <Trash2 size={16} /> 批量删除 ({selectedIds.size})
            </Button>
          )}
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            <Plus size={16} /> 新增病例
          </Button>
        </div>
      </div>

      {/* Batch operation bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle size={16} />
            已选择 <span className="font-bold">{selectedIds.size}</span> 条记录
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            取消选择
          </Button>
        </div>
      )}

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

      {/* Data table with checkboxes */}
      {loading ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 w-10"></th>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{col.label}</th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">操作</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                  <td className="px-4 py-3"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3"><div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded" /></td>
                  ))}
                  <td className="px-4 py-3"><div className="h-4 w-16 bg-slate-100 dark:bg-slate-700 rounded" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 w-10 bg-slate-50 dark:bg-slate-800">
                  <Checkbox
                    checked={allSelected}
                    ref={(el: any) => {
                      if (el) {
                        el.dataset.state = someSelected ? 'indeterminate' : allSelected ? 'checked' : 'unchecked';
                        el.indeterminate = someSelected;
                      }
                    }}
                    onCheckedChange={toggleSelectAll}
                    className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                </th>
                {columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap bg-slate-50 dark:bg-slate-800">
                    {col.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    暂无数据
                  </td>
                </tr>
              ) : data.map((row: any, i: number) => (
                <tr key={row.id || i} className={`border-b border-slate-100 dark:border-slate-700/50 hover:bg-emerald-50/70 dark:hover:bg-emerald-900/15 transition-colors duration-200 ${i % 2 === 1 ? 'bg-slate-50/60 dark:bg-slate-800/40' : 'bg-white dark:bg-slate-900/20'} ${selectedIds.has(row.id) ? 'bg-emerald-50/90 dark:bg-emerald-900/25' : ''}`}>
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={() => toggleSelectRow(row.id)}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => { setEditItem(row); setShowForm(true); }} className="h-7 text-xs gap-1 hover:bg-slate-100 dark:hover:bg-slate-700/50">
                        <RefreshCw size={12} />编辑
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="h-7 text-xs gap-1 text-red-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 size={12} />删除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 pt-2">
        <span className="text-xs">共 <span className="font-semibold text-slate-700 dark:text-slate-300">{total}</span> 条记录{selectedIds.size > 0 ? `，已选 ${selectedIds.size} 条` : ''}</span>
        <Pagination page={page} total={total} onPageChange={setPage} />
      </div>

      {showForm && <InfectionCaseForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}

      {/* Batch delete confirmation dialog */}
      <AlertDialog open={showBatchDeleteConfirm} onOpenChange={setShowBatchDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" /> 确认批量删除
            </AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除选中的 <span className="font-bold text-red-600">{selectedIds.size}</span> 条感染病例记录吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={batchDeleting}
              className="bg-red-600 hover:bg-red-500 focus:ring-red-500"
            >
              {batchDeleting ? (
                <><RefreshCw size={14} className="animate-spin mr-1.5" /> 删除中...</>
              ) : (
                <><Trash2 size={14} className="mr-1.5" /> 确认删除</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
