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
  FlaskConical, Plus, Save, RefreshCw, Search, ToggleLeft, ToggleRight,
  Download, ArrowLeftRight, AlertTriangle, Shield, Clock,
} from 'lucide-react';

const DISEASE_CATEGORIES = ['甲类', '乙类', '丙类', '其他'];
const WARNING_LEVELS = ['高', '中', '低'];
const TEST_METHODS = ['血清学', '核酸检测', '抗原检测', '培养', '涂片'];
const SPECIMEN_TYPES = ['血清', '全血', '咽拭子', '痰液', '粪便', '尿液', '脑脊液', '分泌物'];

function getCategoryColor(category: string) {
  switch (category) {
    case '甲类': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case '乙类': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case '丙类': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
}

function getWarningLevelColor(level: string) {
  switch (level) {
    case '高': return 'text-red-600 dark:text-red-400 font-bold';
    case '中': return 'text-amber-600 dark:text-amber-400 font-semibold';
    case '低': return 'text-slate-500 dark:text-slate-400';
    default: return 'text-slate-500 dark:text-slate-400';
  }
}

function TestItemForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    testItemCode: item?.testItemCode || '',
    testItemName: item?.testItemName || '',
    positiveResult: item?.positiveResult || '',
    diseaseName: item?.diseaseName || '',
    diseaseCode: item?.diseaseCode || '',
    diseaseCategory: item?.diseaseCategory || '乙类',
    isNotifiable: item?.isNotifiable ?? 1,
    reportTimeLimit: item?.reportTimeLimit ?? 24,
    isolationType: item?.isolationType || '',
    testMethod: item?.testMethod || '血清学',
    specimenTypes: item?.specimenTypes || '',
    warningLevel: item?.warningLevel || '中',
    riskNote: item?.riskNote || '',
    sort: item?.sort ?? 0,
    status: item?.status ?? 1,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.testItemCode || !form.testItemName || !form.positiveResult || !form.diseaseName) {
      toast.error('请填写必填字段');
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 200));
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical size={20} className="text-emerald-500" />
            {item ? '编辑检验项目' : '新增检验项目'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <FormField label="检验项目编码" required>
            <Input value={form.testItemCode} onChange={e => setForm(f => ({ ...f, testItemCode: e.target.value }))} placeholder="如 jyxx2351" disabled={!!item} />
          </FormField>
          <FormField label="检验项目名称" required>
            <Input value={form.testItemName} onChange={e => setForm(f => ({ ...f, testItemName: e.target.value }))} placeholder="如 乙型肝炎病毒表面抗原（HBsAg）" />
          </FormField>
          <FormField label="阳性判定结果值" required>
            <Input value={form.positiveResult} onChange={e => setForm(f => ({ ...f, positiveResult: e.target.value }))} placeholder="如 阳性/HIV感染待确定" />
          </FormField>
          <FormField label="关联传染病名称" required>
            <Input value={form.diseaseName} onChange={e => setForm(f => ({ ...f, diseaseName: e.target.value }))} placeholder="如 病毒性肝炎" />
          </FormField>
          <FormField label="ICD-10编码">
            <Input value={form.diseaseCode} onChange={e => setForm(f => ({ ...f, diseaseCode: e.target.value }))} placeholder="如 B16" />
          </FormField>
          <FormField label="传染病分类">
            <select value={form.diseaseCategory} onChange={e => setForm(f => ({ ...f, diseaseCategory: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
              {DISEASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </FormField>
          <FormField label="是否法定报告">
            <select value={form.isNotifiable} onChange={e => setForm(f => ({ ...f, isNotifiable: parseInt(e.target.value) }))}
              className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
              <option value={1}>是</option>
              <option value={0}>否</option>
            </select>
          </FormField>
          <FormField label="报告时限(小时)">
            <Input type="number" value={form.reportTimeLimit} onChange={e => setForm(f => ({ ...f, reportTimeLimit: parseInt(e.target.value) || 0 }))} />
          </FormField>
          <FormField label="隔离类型">
            <Input value={form.isolationType} onChange={e => setForm(f => ({ ...f, isolationType: e.target.value }))} placeholder="如 住院隔离" />
          </FormField>
          <FormField label="检测方法">
            <select value={form.testMethod} onChange={e => setForm(f => ({ ...f, testMethod: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
              {TEST_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
          <FormField label="适用标本类型">
            <Input value={form.specimenTypes} onChange={e => setForm(f => ({ ...f, specimenTypes: e.target.value }))} placeholder="逗号分隔，如 血清,全血" />
          </FormField>
          <FormField label="预警级别">
            <select value={form.warningLevel} onChange={e => setForm(f => ({ ...f, warningLevel: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
              {WARNING_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </FormField>
          <div className="col-span-1 sm:col-span-2">
            <FormField label="风险提示">
              <textarea value={form.riskNote} onChange={e => setForm(f => ({ ...f, riskNote: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 resize-none"
                placeholder="如 甲类传染病需2小时内报告" />
            </FormField>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.testItemCode || !form.testItemName || !form.positiveResult || !form.diseaseName}
            className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InfectiousDiseaseTestItemsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ diseaseCategory: '', status: '', keyword: '' });
  const [hisMappings, setHisMappings] = useState<any[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (filter.diseaseCategory) params.set('diseaseCategory', filter.diseaseCategory);
    if (filter.status) params.set('status', filter.status);
    if (filter.keyword) params.set('keyword', filter.keyword);
    const res = await fetch(`/api/infectious-disease-test-items?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    try {
      if (editItem) {
        const res = await fetch(`/api/infectious-disease-test-items/${editItem.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!result.success) { toast.error(result.message); return; }
        toast.success('检验项目已更新');
      } else {
        const res = await fetch('/api/infectious-disease-test-items', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
        const result = await res.json();
        if (!result.success) { toast.error(result.message); return; }
        toast.success('检验项目已创建');
      }
      setShowForm(false); setEditItem(null); void fetchData();
    } catch {
      toast.error('保存失败');
    }
  };

  const handleDelete = async (row: any) => {
    try {
      const res = await fetch(`/api/infectious-disease-test-items/${row.id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) { toast.success('已删除'); void fetchData(); }
      else toast.error(result.message);
    } catch {
      toast.error('删除失败');
    }
  };

  const handleToggleStatus = async (row: any) => {
    const newStatus = row.status === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/infectious-disease-test-items/${row.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(newStatus === 1 ? '已启用' : '已禁用');
        void fetchData();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleImportFromHIS = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/his-id-test-mapping?pageSize=100');
      const d = await res.json();
      if (d.success) {
        setHisMappings(d.data.items || []);
        setShowImportDialog(true);
      } else {
        toast.error('获取HIS映射数据失败');
      }
    } catch {
      toast.error('获取HIS映射数据失败');
    }
    setImporting(false);
  };

  const doImport = async (mapping: any) => {
    try {
      const newItem = {
        testItemCode: mapping.testItemCode,
        testItemName: mapping.testItemName,
        positiveResult: '阳性',
        diseaseName: mapping.testItemName?.replace(/（.*?）/, '').replace(/[（）]/g, '') || '待配置',
        diseaseCategory: '乙类',
        warningLevel: '中',
        status: 1,
      };
      const res = await fetch('/api/infectious-disease-test-items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newItem),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`已导入: ${mapping.testItemName}`);
        void fetchData();
      } else {
        toast.error(result.message || '导入失败');
      }
    } catch {
      toast.error('导入失败');
    }
  };

  const handleExport = () => {
    const csv = [
      '检验项目编码,检验项目名称,阳性判定结果值,关联传染病名称,传染病分类,是否法定报告,报告时限,预警级别,状态',
      ...data.map(r =>
        `${r.testItemCode},${r.testItemName},${r.positiveResult},${r.diseaseName},${r.diseaseCategory},${r.isNotifiable ? '是' : '否'},${r.reportTimeLimit || ''}h,${r.warningLevel},${r.status === 1 ? '启用' : '禁用'}`
      )
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '传染病检验项目配置.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'testItemCode', label: '检验项目编码', render: (v: string) => <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{v}</span> },
    { key: 'testItemName', label: '检验项目名称', render: (v: string) => <span className="text-xs max-w-[200px] truncate block" title={v}>{v}</span> },
    { key: 'positiveResult', label: '阳性判定结果值', render: (v: string) => <span className="text-xs max-w-[120px] truncate block" title={v}>{v}</span> },
    { key: 'diseaseName', label: '关联传染病', render: (v: string) => <span className="text-xs">{v}</span> },
    { key: 'diseaseCategory', label: '传染病分类', render: (v: string) => (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${getCategoryColor(v)}`}>{v}</Badge>
    )},
    { key: 'isNotifiable', label: '法定报告', render: (v: number) => (
      v ? <Shield size={14} className="text-red-500" /> : <span className="text-slate-400 text-xs">否</span>
    )},
    { key: 'reportTimeLimit', label: '报告时限', render: (v: number) => v ? (
      <span className="text-xs flex items-center gap-1"><Clock size={12} className="text-amber-500" />{v}h</span>
    ) : <span className="text-slate-400 text-xs">-</span> },
    { key: 'warningLevel', label: '预警级别', render: (v: string) => <span className={`text-xs ${getWarningLevelColor(v)}`}>{v}</span> },
    { key: 'status', label: '状态', render: (v: number) => <StatusBadge status={v === 1 ? '已启用' : '已禁用'} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <FlaskConical size={22} className="text-emerald-500" /> 传染病检验项目配置
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleImportFromHIS} disabled={importing} className="gap-1.5 text-xs border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/20">
            {importing ? <RefreshCw size={14} className="animate-spin" /> : <ArrowLeftRight size={14} />}
            从HIS映射导入
          </Button>
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            <Plus size={16} /> 新增项目
          </Button>
        </div>
      </div>

      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <Input value={filter.keyword} onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
          placeholder="搜索编码/名称/传染病"
          className="w-48 h-8 text-sm" />
        <select value={filter.diseaseCategory} onChange={e => setFilter(f => ({ ...f, diseaseCategory: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部分类</option>
          {DISEASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
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

      {/* Custom action buttons rendered after the data table */}
      {data.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {data.filter(r => r.status === 1).length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ToggleRight size={14} className="text-emerald-500" /> 已启用: {data.filter(r => r.status === 1).length}
            </span>
          )}
          {data.filter(r => r.status === 0).length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ToggleLeft size={14} className="text-slate-400" /> 已禁用: {data.filter(r => r.status === 0).length}
            </span>
          )}
        </div>
      )}

      <Pagination page={page} total={total} onPageChange={setPage} />

      {showForm && <TestItemForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}

      {/* Import from HIS Mapping Dialog */}
      {showImportDialog && (
        <Dialog open onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftRight size={20} className="text-sky-500" />
                从HIS映射导入检验项目
              </DialogTitle>
            </DialogHeader>
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              选择HIS映射记录导入为检验项目配置。导入后可编辑详细信息。
            </div>
            {hisMappings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                暂无HIS映射数据，请先配置HIS检验映射
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {hisMappings.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{m.testItemName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        编码: {m.testItemCode} | HIS: {m.hisTestCode} - {m.hisTestName}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => doImport(m)} className="gap-1 text-xs bg-sky-600 hover:bg-sky-500">
                      <Download size={12} /> 导入
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
