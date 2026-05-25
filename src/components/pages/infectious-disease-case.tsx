'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { Biohazard, Plus, Save, RefreshCw, Search, User, CalendarDays, ShieldCheck } from 'lucide-react';

const DISEASE_CATEGORY_MAP: Record<string, string> = {
  '鼠疫': '甲类', '霍乱': '甲类',
  '新冠': '乙类', '新型冠状病毒感染': '乙类', '肺结核': '乙类', '病毒性肝炎': '乙类',
  '麻疹': '乙类', '流行性出血热': '乙类', '狂犬病': '乙类', '流行性乙型脑炎': '乙类',
  '登革热': '乙类', '炭疽': '乙类', '细菌性和阿米巴性痢疾': '乙类', '肺炭疽': '乙类',
  '伤寒和副伤寒': '乙类', '流行性脑脊髓膜炎': '乙类', '百日咳': '乙类', '白喉': '乙类',
  '新生儿破伤风': '乙类', '猩红热': '乙类', '布鲁氏菌病': '乙类', '淋病': '乙类',
  '梅毒': '乙类', '钩端螺旋体病': '乙类', '血吸虫病': '乙类', '疟疾': '乙类',
  '人感染H7N9禽流感': '乙类', '艾滋病': '乙类',
  '流行性感冒': '丙类', '流感': '丙类', '流行性腮腺炎': '丙类', '腮腺炎': '丙类',
  '风疹': '丙类', '手足口病': '丙类', '急性出血性结膜炎': '丙类', '麻风病': '丙类',
  '流行性和地方性斑疹伤寒': '丙类', '黑热病': '丙类', '包虫病': '丙类', '丝虫病': '丙类',
  '其他感染性腹泻病': '丙类', '水痘': '丙类',
};

export { DISEASE_CATEGORY_MAP };

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    '甲类': 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
    '乙类': 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    '丙类': 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800',
    '其他': 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-700/30 dark:text-slate-400 dark:border-slate-600',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${colors[category] || colors['其他']}`}>{category}</span>;
}

export { CategoryBadge };

function InfectiousDiseaseCaseForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    patientId: item?.patientId || '', patientName: item?.patientName || '', gender: item?.gender || '男',
    age: item?.age || '', idCard: item?.idCard || '', phone: item?.phone || '', address: item?.address || '',
    dept: item?.dept || '感染科', bedNo: item?.bedNo || '',
    admissionDate: item?.admissionDate?.slice(0, 10) || '', onsetDate: item?.onsetDate?.slice(0, 10) || '',
    diagnosisDate: item?.diagnosisDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    reportDate: item?.reportDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    diseaseName: item?.diseaseName || '', diseaseCode: item?.diseaseCode || '',
    diseaseCategory: item?.diseaseCategory || '',
    reportType: item?.reportType || '初次报告', infectionSource: item?.infectionSource || '',
    clinicalDiagnosis: item?.clinicalDiagnosis || '', labResult: item?.labResult || '',
    severity: item?.severity || '普通', outcome: item?.outcome || '', outcomeDate: item?.outcomeDate?.slice(0, 10) || '',
    isolationType: item?.isolationType || '', isolationDate: item?.isolationDate?.slice(0, 10) || '',
    reporter: item?.reporter || '', reviewer: item?.reviewer || '', reviewComment: item?.reviewComment || '',
    status: item?.status || '待审核', reportToCDC: item?.reportToCDC || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleDiseaseNameChange = (name: string) => {
    const cat = DISEASE_CATEGORY_MAP[name] || '其他';
    setForm(f => ({ ...f, diseaseName: name, diseaseCategory: cat }));
  };

  const handleSave = async () => {
    if (!form.patientName || !form.diseaseName) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  const diseaseOptions = Object.keys(DISEASE_CATEGORY_MAP);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Biohazard size={20} className="text-emerald-500" />
            {item ? '编辑传染病病例' : '新增传染病病例'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><User size={14} /> 患者基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="患者ID" required><Input value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} /></FormField>
              <FormField label="患者姓名" required><Input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))} /></FormField>
              <FormField label="性别">
                <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  <option value="男">男</option><option value="女">女</option>
                </select>
              </FormField>
              <FormField label="年龄"><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} /></FormField>
              <FormField label="身份证号"><Input value={form.idCard} onChange={e => setForm(f => ({ ...f, idCard: e.target.value }))} /></FormField>
              <FormField label="联系电话"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></FormField>
              <FormField label="现住址" className="col-span-2"><Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></FormField>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><Biohazard size={14} /> 传染病信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="传染病名称" required>
                <select value={form.diseaseName} onChange={e => handleDiseaseNameChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  <option value="">请选择</option>
                  {diseaseOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="传染病分类">
                <div className="flex items-center h-9">
                  {form.diseaseCategory ? <CategoryBadge category={form.diseaseCategory} /> : <span className="text-slate-400 text-sm">选择病名后自动填充</span>}
                </div>
              </FormField>
              <FormField label="ICD-10编码"><Input value={form.diseaseCode} onChange={e => setForm(f => ({ ...f, diseaseCode: e.target.value }))} /></FormField>
              <FormField label="报告类型">
                <select value={form.reportType} onChange={e => setForm(f => ({ ...f, reportType: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  {['初次报告', '订正报告', '转归报告'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="严重程度">
                <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  {['轻症', '普通', '重症', '危重症'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="感染来源"><Input value={form.infectionSource} onChange={e => setForm(f => ({ ...f, infectionSource: e.target.value }))} /></FormField>
              <FormField label="临床诊断"><Input value={form.clinicalDiagnosis} onChange={e => setForm(f => ({ ...f, clinicalDiagnosis: e.target.value }))} /></FormField>
              <FormField label="实验室结果"><Input value={form.labResult} onChange={e => setForm(f => ({ ...f, labResult: e.target.value }))} /></FormField>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><CalendarDays size={14} /> 日期与科室</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="报告科室" required>
                <select value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  {['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '感染科', '呼吸科', '消化科'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </FormField>
              <FormField label="床号"><Input value={form.bedNo} onChange={e => setForm(f => ({ ...f, bedNo: e.target.value }))} /></FormField>
              <FormField label="入院日期"><Input type="date" value={form.admissionDate} onChange={e => setForm(f => ({ ...f, admissionDate: e.target.value }))} /></FormField>
              <FormField label="发病日期"><Input type="date" value={form.onsetDate} onChange={e => setForm(f => ({ ...f, onsetDate: e.target.value }))} /></FormField>
              <FormField label="诊断日期" required><Input type="date" value={form.diagnosisDate} onChange={e => setForm(f => ({ ...f, diagnosisDate: e.target.value }))} /></FormField>
              <FormField label="报告日期" required><Input type="date" value={form.reportDate} onChange={e => setForm(f => ({ ...f, reportDate: e.target.value }))} /></FormField>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><ShieldCheck size={14} /> 隔离与转归</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="隔离方式">
                <select value={form.isolationType} onChange={e => setForm(f => ({ ...f, isolationType: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  <option value="">请选择</option>
                  {['居家隔离', '集中隔离', '住院隔离', '无需隔离'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="隔离开始日期"><Input type="date" value={form.isolationDate} onChange={e => setForm(f => ({ ...f, isolationDate: e.target.value }))} /></FormField>
              <FormField label="转归">
                <select value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  <option value="">请选择</option>
                  {['治愈', '好转', '未愈', '死亡', '其他'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </FormField>
              <FormField label="转归日期"><Input type="date" value={form.outcomeDate} onChange={e => setForm(f => ({ ...f, outcomeDate: e.target.value }))} /></FormField>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.patientName || !form.diseaseName} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InfectiousDiseaseCasePage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ diseaseCategory: '', status: '', dept: '', startDate: '', endDate: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (filter.diseaseCategory) params.set('diseaseCategory', filter.diseaseCategory);
    if (filter.status) params.set('status', filter.status);
    if (filter.dept) params.set('dept', filter.dept);
    if (filter.startDate) params.set('startDate', filter.startDate);
    if (filter.endDate) params.set('endDate', filter.endDate);
    const res = await fetch(`/api/infectious-disease-cases?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/infectious-disease-cases/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/infectious-disease-cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    setShowForm(false); setEditItem(null); void fetchData();
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该传染病病例？')) return;
    await fetch(`/api/infectious-disease-cases/${row.id}`, { method: 'DELETE' });
    void fetchData();
  };

  const handleAction = async (row: any, action: string) => {
    if (action === 'review') {
      await fetch(`/api/infectious-disease-cases/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...row, status: '已审核' }) });
      void fetchData();
    } else if (action === 'report-cdc') {
      await fetch(`/api/infectious-disease-cases/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...row, reportToCDC: 1, status: '已上报', reportToCDCTime: new Date().toISOString() }) });
      void fetchData();
    }
  };

  const handleExport = () => {
    const csv = ['患者姓名,性别,年龄,传染病名称,分类,科室,严重程度,报告人,报告日期,状态',
      ...data.map(r => `${r.patientName},${r.gender},${r.age},${r.diseaseName},${r.diseaseCategory},${r.dept},${r.severity},${r.reporter || ''},${r.reportDate?.slice(0, 10)},${r.status}`)
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '传染病病例数据.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'patientName', label: '患者姓名' },
    { key: 'gender', label: '性别' },
    { key: 'age', label: '年龄' },
    { key: 'diseaseName', label: '传染病名称', render: (v: string) => <span className="font-medium text-slate-800 dark:text-slate-200">{v}</span> },
    { key: 'diseaseCategory', label: '分类', render: (v: string) => <CategoryBadge category={v} /> },
    { key: 'dept', label: '科室' },
    { key: 'severity', label: '严重程度', render: (v: string) => {
      const colors: Record<string, string> = { '危重症': 'text-red-600', '重症': 'text-orange-600', '普通': 'text-slate-600 dark:text-slate-400', '轻症': 'text-emerald-600' };
      return <span className={`font-medium ${colors[v] || ''}`}>{v}</span>;
    }},
    { key: 'reporter', label: '报告人', render: (v: string) => v || '-' },
    { key: 'reportDate', label: '报告日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Biohazard size={22} className="text-emerald-500" /> 传染病病例上报
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增病例
        </Button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">法定传染病病例的报告、审核与CDC上报管理</p>
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <select value={filter.diseaseCategory} onChange={e => setFilter(f => ({ ...f, diseaseCategory: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部分类</option>
          {['甲类', '乙类', '丙类', '其他'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          {['待审核', '已审核', '退回', '已上报', '已结案'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.dept} onChange={e => setFilter(f => ({ ...f, dept: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部科室</option>
          {['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '感染科', '呼吸科', '消化科'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <Input type="date" value={filter.startDate} onChange={e => setFilter(f => ({ ...f, startDate: e.target.value }))} className="w-36 h-8 text-sm" />
        <span className="text-slate-400 self-center">~</span>
        <Input type="date" value={filter.endDate} onChange={e => setFilter(f => ({ ...f, endDate: e.target.value }))} className="w-36 h-8 text-sm" />
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} onAction={(row, action) => handleAction(row, action)} onExport={handleExport}
      />
      <Pagination page={page} total={total} onPageChange={setPage} />
      {showForm && <InfectiousDiseaseCaseForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
