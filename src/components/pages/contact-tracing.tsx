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
import { UsersRound, Plus, Save, RefreshCw, Search, User, Biohazard, MapPin, ShieldCheck } from 'lucide-react';

function ContactTracingForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const { getDictNames } = useConfigStore();
  const relationshipOptions = getDictNames('contact_relationship');
  const contactTypeOptions = getDictNames('contact_type');
  const exposureLevelOptions = getDictNames('exposure_level');
  const symptomStatusOptions = getDictNames('symptom_status');
  const quarantineTypeOptions = getDictNames('quarantine_type');
  const testResultOptions = getDictNames('test_result');
  const followUpStatusOptions = getDictNames('follow_up_status');

  const [form, setForm] = useState({
    caseId: item?.caseId || '', casePatientName: item?.casePatientName || '',
    contactName: item?.contactName || '', contactIdCard: item?.contactIdCard || '',
    contactPhone: item?.contactPhone || '', contactAddress: item?.contactAddress || '',
    gender: item?.gender || '男', age: item?.age || '',
    relationship: item?.relationship || '家属', contactType: item?.contactType || '密切接触',
    contactDate: item?.contactDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    contactDuration: item?.contactDuration || '', contactLocation: item?.contactLocation || '',
    exposureLevel: item?.exposureLevel || '中',
    symptomStatus: item?.symptomStatus || '无症状', symptomDetail: item?.symptomDetail || '',
    quarantineType: item?.quarantineType || '', quarantineStart: item?.quarantineStart?.slice(0, 10) || '',
    quarantineEnd: item?.quarantineEnd?.slice(0, 10) || '',
    testResult: item?.testResult || '未检测', testDate: item?.testDate?.slice(0, 10) || '',
    followUpStatus: item?.followUpStatus || '待随访', followUpPerson: item?.followUpPerson || '',
    lastFollowUpDate: item?.lastFollowUpDate?.slice(0, 10) || '',
    remark: item?.remark || '', status: item?.status || '待确认',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.contactName || !form.casePatientName) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  const selectClass = "w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersRound size={20} className="text-emerald-500" />
            {item ? '编辑接触者追踪' : '新增接触者追踪'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><Biohazard size={14} /> 关联病例</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="病例ID"><Input value={form.caseId} onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))} /></FormField>
              <FormField label="病例姓名" required><Input value={form.casePatientName} onChange={e => setForm(f => ({ ...f, casePatientName: e.target.value }))} /></FormField>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><User size={14} /> 接触者信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="接触者姓名" required><Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} /></FormField>
              <FormField label="性别"><select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className={selectClass}><option value="男">男</option><option value="女">女</option></select></FormField>
              <FormField label="年龄"><Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} /></FormField>
              <FormField label="身份证号"><Input value={form.contactIdCard} onChange={e => setForm(f => ({ ...f, contactIdCard: e.target.value }))} /></FormField>
              <FormField label="联系电话"><Input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} /></FormField>
              <FormField label="住址"><Input value={form.contactAddress} onChange={e => setForm(f => ({ ...f, contactAddress: e.target.value }))} /></FormField>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><MapPin size={14} /> 接触信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="与患者关系" required><select value={form.relationship} onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))} className={selectClass}>{relationshipOptions.map(r => <option key={r} value={r}>{r}</option>)}</select></FormField>
              <FormField label="接触类型" required><select value={form.contactType} onChange={e => setForm(f => ({ ...f, contactType: e.target.value }))} className={selectClass}>{contactTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></FormField>
              <FormField label="接触日期" required><Input type="date" value={form.contactDate} onChange={e => setForm(f => ({ ...f, contactDate: e.target.value }))} /></FormField>
              <FormField label="接触时长"><Input value={form.contactDuration} onChange={e => setForm(f => ({ ...f, contactDuration: e.target.value }))} placeholder="如：2小时" /></FormField>
              <FormField label="接触地点"><Input value={form.contactLocation} onChange={e => setForm(f => ({ ...f, contactLocation: e.target.value }))} /></FormField>
              <FormField label="暴露等级" required><select value={form.exposureLevel} onChange={e => setForm(f => ({ ...f, exposureLevel: e.target.value }))} className={selectClass}>{exposureLevelOptions.map(l => <option key={l} value={l}>{l}</option>)}</select></FormField>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5"><ShieldCheck size={14} /> 隔离与检测</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="症状状态"><select value={form.symptomStatus} onChange={e => setForm(f => ({ ...f, symptomStatus: e.target.value }))} className={selectClass}>{symptomStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></FormField>
              <FormField label="症状详情"><Input value={form.symptomDetail} onChange={e => setForm(f => ({ ...f, symptomDetail: e.target.value }))} /></FormField>
              <FormField label="隔离方式"><select value={form.quarantineType} onChange={e => setForm(f => ({ ...f, quarantineType: e.target.value }))} className={selectClass}><option value="">请选择</option>{quarantineTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}</select></FormField>
              <FormField label="隔离开始"><Input type="date" value={form.quarantineStart} onChange={e => setForm(f => ({ ...f, quarantineStart: e.target.value }))} /></FormField>
              <FormField label="隔离结束"><Input type="date" value={form.quarantineEnd} onChange={e => setForm(f => ({ ...f, quarantineEnd: e.target.value }))} /></FormField>
              <FormField label="检测结果"><select value={form.testResult} onChange={e => setForm(f => ({ ...f, testResult: e.target.value }))} className={selectClass}>{testResultOptions.map(r => <option key={r} value={r}>{r}</option>)}</select></FormField>
              <FormField label="检测日期"><Input type="date" value={form.testDate} onChange={e => setForm(f => ({ ...f, testDate: e.target.value }))} /></FormField>
              <FormField label="随访状态"><select value={form.followUpStatus} onChange={e => setForm(f => ({ ...f, followUpStatus: e.target.value }))} className={selectClass}>{followUpStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}</select></FormField>
              <FormField label="随访人"><Input value={form.followUpPerson} onChange={e => setForm(f => ({ ...f, followUpPerson: e.target.value }))} /></FormField>
              <FormField label="备注"><Input value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} /></FormField>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.contactName || !form.casePatientName} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ContactTracingPage() {
  const { getDictNames } = useConfigStore();
  const contactTypeOptions = getDictNames('contact_type');
  const statusOptions = getDictNames('contact_status');
  const followUpStatusOptions = getDictNames('follow_up_status');
  const exposureLevelOptions = getDictNames('exposure_level');

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ contactType: '', status: '', followUpStatus: '', exposureLevel: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (filter.contactType) params.set('contactType', filter.contactType);
    if (filter.status) params.set('status', filter.status);
    if (filter.followUpStatus) params.set('followUpStatus', filter.followUpStatus);
    const res = await fetch(`/api/contact-tracings?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/contact-tracings/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/contact-tracings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    setShowForm(false); setEditItem(null); void fetchData();
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该接触者追踪记录？')) return;
    await fetch(`/api/contact-tracings/${row.id}`, { method: 'DELETE' });
    void fetchData();
  };

  const handleAction = async (row: any, action: string) => {
    if (action === 'followup') {
      await fetch(`/api/contact-tracings/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...row, followUpStatus: '随访中', lastFollowUpDate: new Date().toISOString() }) });
      void fetchData();
    }
  };

  const ExposureBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      '高': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      '中': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      '低': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[level] || ''}`}>{level}</span>;
  };

  const TestResultBadge = ({ result }: { result: string }) => {
    const colors: Record<string, string> = {
      '阳性': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      '阴性': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[result] || 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400'}`}>{result || '未检测'}</span>;
  };

  const SymptomBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = {
      '无症状': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      '有症状': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      '已确诊': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || ''}`}>{status}</span>;
  };

  const columns = [
    { key: 'casePatientName', label: '病例姓名' },
    { key: 'contactName', label: '接触者姓名', render: (v: string) => <span className="font-medium text-slate-800 dark:text-slate-200">{v}</span> },
    { key: 'relationship', label: '与患者关系' },
    { key: 'contactType', label: '接触类型', render: (v: string) => <Badge variant={v === '密切接触' ? 'destructive' : 'secondary'} className="text-xs">{v}</Badge> },
    { key: 'contactDate', label: '接触日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'exposureLevel', label: '暴露等级', render: (v: string) => <ExposureBadge level={v} /> },
    { key: 'symptomStatus', label: '症状状态', render: (v: string) => <SymptomBadge status={v} /> },
    { key: 'quarantineType', label: '隔离方式', render: (v: string) => v || '-' },
    { key: 'testResult', label: '检测结果', render: (v: string) => <TestResultBadge result={v} /> },
    { key: 'followUpStatus', label: '随访状态', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <UsersRound size={22} className="text-emerald-500" /> 接触者追踪
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增记录
        </Button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">传染病病例密切接触者与一般接触者的追踪管理</p>
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <select value={filter.contactType} onChange={e => setFilter(f => ({ ...f, contactType: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部接触类型</option>
          {contactTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.followUpStatus} onChange={e => setFilter(f => ({ ...f, followUpStatus: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部随访状态</option>
          {followUpStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.exposureLevel} onChange={e => setFilter(f => ({ ...f, exposureLevel: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部暴露等级</option>
          {exposureLevelOptions.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} onAction={handleAction} />
      <Pagination page={page} total={total} onPageChange={setPage} />
      {showForm && <ContactTracingForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}
