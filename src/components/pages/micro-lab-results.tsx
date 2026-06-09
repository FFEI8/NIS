'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { useConfigStore } from '@/store/config-store';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pagination } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Microscope, Search, Download, Zap, AlertTriangle, FlaskConical,
  Eye, FileUp, Play, Bug, TrendingUp, Activity, ShieldAlert,
} from 'lucide-react';

// ============ MDRO Type color mapping ============
const MDRO_TYPE_COLORS: Record<string, string> = {
  'CRAB': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'CRKP': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'MRSA': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'VRE': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'CRPA': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
};

// ============ MDRO Badge ============
function MDROBadge({ mdroType }: { mdroType: string }) {
  const tpl = useConfigStore.getState().mdroRuleTemplates.find(t => t.mdroType === mdroType);
  const color = MDRO_TYPE_COLORS[mdroType] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  if (!tpl) return <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">{mdroType}</Badge>;
  return (
    <Badge className={`${color} text-[10px] font-medium gap-0.5`}>
      {tpl.bacteriaName}[{tpl.mdroType}]
    </Badge>
  );
}

// ============ Specimen Badge ============
function SpecimenBadge({ type }: { type: string }) {
  const item = useConfigStore.getState().getDictItems('specimen_type').find(d => d.name === type);
  const color = item?.color || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  if (!item) return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
  return <Badge className={`${color} text-[10px]`}>{item.name}</Badge>;
}

// ============ Detail Dialog ============
function LabResultDetailDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: any }) {
  if (!item) return null;

  const fields = [
    { label: '患者ID', value: item.patientId },
    { label: '患者姓名', value: item.patientName },
    { label: '科室', value: item.dept },
    { label: '床号', value: item.bedNo },
    { label: '住院号', value: item.visitId },
    { label: '标本类型', value: item.specimenType },
    { label: '标本编号', value: item.specimenNo },
    { label: '检验项目', value: item.reportItemName },
    { label: '结果值', value: item.resultValue },
    { label: '结果文本', value: item.resultText },
    { label: '单位', value: item.unit },
    { label: '参考范围', value: item.referenceRange },
    { label: '检测仪器', value: item.instrument },
    { label: '操作者', value: item.operator },
    { label: '审核人', value: item.reviewer },
    { label: '备注', value: item.remarks },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical size={20} className="text-emerald-500" /> 检验结果详情
          </DialogTitle>
          <DialogDescription>查看微生物检验结果的完整信息</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Header summary */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{item.reportItemName}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {item.patientName || item.patientId} · {item.dept || '未知科室'}
              </div>
            </div>
            <div className="flex gap-2">
              {item.isAbnormal === 1 && <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">异常</Badge>}
              {item.isMDRO === 1 && item.mdroType && <MDROBadge mdroType={item.mdroType} />}
              {item.warningTriggered === 1 && <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px]">已触发预警</Badge>}
            </div>
          </div>

          {/* Result value highlight */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1">结果值</div>
              <div className={`text-lg font-bold ${item.isAbnormal === 1 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                {item.resultValue || '-'}
                {item.unit && <span className="text-xs font-normal text-slate-400 ml-1">{item.unit}</span>}
              </div>
            </div>
            <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1">参考范围</div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.referenceRange || '-'}</div>
            </div>
            <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-center">
              <div className="text-[10px] text-slate-400 mb-1">报告时间</div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {item.reportTime ? new Date(item.reportTime).toLocaleString('zh-CN') : '-'}
              </div>
            </div>
          </div>

          {/* Detail fields */}
          <div className="grid grid-cols-2 gap-3">
            {fields.filter(f => f.value).map((field, i) => (
              <div key={i} className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
                <div className="text-[10px] text-slate-400 mb-1">{field.label}</div>
                <div className="text-sm text-slate-700 dark:text-slate-300">{field.value}</div>
              </div>
            ))}
          </div>

          {/* MDRO info */}
          {item.isMDRO === 1 && (
            <div className="p-3 border-2 border-rose-200 dark:border-rose-800 rounded-lg bg-rose-50 dark:bg-rose-900/10">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={16} className="text-rose-600 dark:text-rose-400" />
                <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">多重耐药菌检出</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-slate-500">耐药类型：</span>{item.mdroType && <MDROBadge mdroType={item.mdroType} />}</div>
                <div><span className="text-slate-500">菌名：</span><span className="text-slate-700 dark:text-slate-300">{item.organismName || '-'}</span></div>
                {item.antibioticResult && (
                  <div className="col-span-2"><span className="text-slate-500">药敏结果：</span><span className="text-slate-700 dark:text-slate-300 text-xs">{item.antibioticResult}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Warning info */}
          {item.warningTriggered === 1 && (
            <div className="p-3 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50 dark:bg-orange-900/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">已触发预警</span>
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {item.warningId ? `关联预警ID: ${item.warningId}` : '预警已触发，请在预警记录中查看详情'}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Main Page ============
export default function MicroLabResultsPage() {
  const { getDictNames, mdroRuleTemplates } = useConfigStore();
  const specimenOptions = getDictNames('specimen_type');
  const mdroTypeMap = Object.fromEntries(mdroRuleTemplates.map(t => [t.mdroType, { label: t.mdroType, fullName: t.bacteriaName, color: MDRO_TYPE_COLORS[t.mdroType] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' }]));

  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ keyword: '', specimenType: '', mdroType: '', isAbnormal: '' });
  const [stats, setStats] = useState({ total: 0, abnormalCount: 0, mdroCount: 0, warningCount: 0 });
  const [showDetail, setShowDetail] = useState(false);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (filter.keyword) params.set('keyword', filter.keyword);
    if (filter.specimenType) params.set('specimenType', filter.specimenType);
    if (filter.mdroType) params.set('mdroType', filter.mdroType);
    if (filter.isAbnormal) params.set('isAbnormal', filter.isAbnormal);
    try {
      const res = await fetch(`/api/micro-lab-results?${params}`);
      const d = await res.json();
      if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/micro-lab-results/stats');
      const d = await res.json();
      if (d.success) {
        setStats({
          total: d.data.total,
          abnormalCount: d.data.abnormalCount,
          mdroCount: d.data.mdroCount,
          warningCount: d.data.warningCount,
        });
      }
    } catch { /* ignore */ }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchStats(); }, [fetchStats]);

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/micro-lab-results/import', { method: 'POST' });
      const d = await res.json();
      if (d.success) {
        setToast({ message: d.data.message, type: 'success' });
        fetchData();
        fetchStats();
      } else {
        setToast({ message: d.message || '导入失败', type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: '导入失败: ' + e.message, type: 'error' });
    }
    setImporting(false);
    setTimeout(() => setToast(null), 5000);
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/warning-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate' }),
      });
      const d = await res.json();
      if (d.success) {
        setToast({ message: d.data.message, type: 'success' });
        fetchData();
        fetchStats();
      } else {
        setToast({ message: d.message || '执行失败', type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: '执行失败: ' + e.message, type: 'error' });
    }
    setEvaluating(false);
    setTimeout(() => setToast(null), 5000);
  };

  const handleViewDetail = (row: any) => {
    setDetailItem(row);
    setShowDetail(true);
  };

  const highlightMDRO = (name: string, isMDRO: number) => {
    if (isMDRO !== 1) return <span className="text-slate-700 dark:text-slate-300">{name}</span>;
    // Highlight MDRO keywords in the name
    let highlighted = name;
    for (const [type, info] of Object.entries(mdroTypeMap)) {
      if (name.includes(type)) {
        highlighted = name.replace(type, `<mark class="${info.color} rounded px-0.5">${type}</mark>`);
      }
      for (const keyword of [info.fullName]) {
        if (name.includes(keyword) || name.includes(info.label)) {
          return <span className="text-rose-700 dark:text-rose-400 font-medium">{name}</span>;
        }
      }
    }
    return <span className="text-amber-700 dark:text-amber-400 font-medium">{name}</span>;
  };

  const columns = [
    {
      key: 'patientId', label: '患者ID',
      render: (v: string, row: any) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-200">{v}</div>
          <div className="text-[10px] text-slate-400">{row.patientName || ''} {row.dept ? `· ${row.dept}` : ''}</div>
        </div>
      ),
    },
    {
      key: 'specimenType', label: '标本类型',
      render: (v: string) => <SpecimenBadge type={v} />,
    },
    {
      key: 'reportItemName', label: '检验项目',
      render: (v: string, row: any) => highlightMDRO(v, row.isMDRO),
    },
    {
      key: 'resultValue', label: '结果值',
      render: (v: string, row: any) => (
        <span className={row.isAbnormal === 1 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
          {v || '-'}{row.unit ? <span className="text-[10px] text-slate-400 ml-0.5">{row.unit}</span> : ''}
        </span>
      ),
    },
    {
      key: 'referenceRange', label: '参考范围',
      render: (v: string) => <span className="text-xs text-slate-500">{v || '-'}</span>,
    },
    {
      key: 'isAbnormal', label: '异常',
      render: (v: number) => v === 1
        ? <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px]">异常</Badge>
        : <Badge className="bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500 text-[10px]">正常</Badge>,
    },
    {
      key: 'isMDRO', label: 'MDRO',
      render: (_: any, row: any) => row.isMDRO === 1 && row.mdroType
        ? <MDROBadge mdroType={row.mdroType} />
        : <span className="text-slate-400 text-xs">-</span>,
    },
    {
      key: 'reportTime', label: '报告时间',
      render: (v: string) => v ? <span className="text-xs text-slate-500">{new Date(v).toLocaleString('zh-CN')}</span> : '-',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Microscope size={22} className="text-emerald-500" /> 微生物检验结果
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleImport} disabled={importing} className="gap-1.5">
            <FileUp size={14} /> {importing ? '导入中...' : '导入数据'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleEvaluate} disabled={evaluating} className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20">
            <Play size={14} /> {evaluating ? '执行中...' : '触发预警引擎'}
          </Button>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">查看和管理微生物检验结果，监测多重耐药菌（MDRO）检出情况</p>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '总检验数', value: stats.total, icon: <FlaskConical size={16} className="text-slate-500" />, color: 'bg-slate-50 dark:bg-slate-800' },
          { label: '异常结果', value: stats.abnormalCount, icon: <AlertTriangle size={16} className="text-red-500" />, color: 'bg-red-50 dark:bg-red-900/20' },
          { label: 'MDRO检出', value: stats.mdroCount, icon: <Bug size={16} className="text-amber-500" />, color: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: '预警触发', value: stats.warningCount, icon: <Zap size={16} className="text-orange-500" />, color: 'bg-orange-50 dark:bg-orange-900/20' },
        ].map((s, i) => (
          <div key={i} className={`p-3 rounded-lg border border-slate-200 dark:border-slate-700 ${s.color} flex items-center gap-3`}>
            {s.icon}
            <div>
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">{s.value}</div>
              <div className="text-[10px] text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter section */}
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <Input placeholder="搜索患者ID/检验项目" value={filter.keyword} onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
          className="w-48" />
        <select value={filter.specimenType} onChange={e => setFilter(f => ({ ...f, specimenType: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部标本</option>
          {specimenOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.mdroType} onChange={e => setFilter(f => ({ ...f, mdroType: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部MDRO</option>
          {Object.entries(mdroTypeMap).map(([k, v]) => <option key={k} value={k}>{v.label} - {v.fullName}</option>)}
        </select>
        <select value={filter.isAbnormal} onChange={e => setFilter(f => ({ ...f, isAbnormal: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          <option value="1">异常</option>
          <option value="0">正常</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>

      {/* Data table */}
      <div className="space-y-2">
        {loading ? (
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {columns.map(col => <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{col.label}</th>)}
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">操作</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                    {columns.map(col => <td key={col.key} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>)}
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {columns.map(col => <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{col.label}</th>)}
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2"><Microscope size={32} className="text-slate-300 dark:text-slate-600" /><span>暂无检验数据，请点击"导入数据"导入微生物检验结果</span></div>
                  </td></tr>
                ) : data.map((row, i) => (
                  <tr key={row.id || i} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''} ${row.isMDRO === 1 ? 'border-l-2 border-l-amber-400' : ''} ${row.isAbnormal === 1 && row.isMDRO !== 1 ? 'border-l-2 border-l-red-400' : ''}`}>
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetail(row)} className="h-7 text-xs gap-1 text-slate-600">
                        <Eye size={12} />详情
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} onPageChange={setPage} />
      </div>

      {/* Dialog */}
      {showDetail && <LabResultDetailDialog open={showDetail} item={detailItem} onClose={() => { setShowDetail(false); setDetailItem(null); }} />}
    </div>
  );
}
