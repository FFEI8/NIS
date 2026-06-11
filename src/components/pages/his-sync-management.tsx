'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Database, Table2, GitMerge, Globe, Plus, RefreshCw, Save, Loader2,
  Play, Plug, Pencil, Trash2, ToggleLeft, ToggleRight, Eye,
  CheckCircle2, XCircle, AlertTriangle, Activity, ArrowRight,
  Zap, Shield, Server, SlidersHorizontal, Clock, ChevronDown,
  ChevronUp, RotateCcw, Wifi, WifiOff, Circle, Radio, Timer,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

// ============ Constants ============
const API_BASE = '/api/his-sync';
const PORT_PARAM = 'XTransformPort=3030';

const SYNC_MODES = [
  {
    key: 'direct', label: '数据库直连方案', icon: Database,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    pros: ['简单直接，开发成本低', '实时性好，可定时拉取最新数据', '无需HIS端开发配合'],
    cons: ['需要直连HIS数据库的网络权限', '可能影响HIS数据库性能', '存在安全风险，需严格控制只读权限'],
    recommended: '适用于HIS允许只读连接的场景',
  },
  {
    key: 'sync_table', label: '同步表方案', icon: Table2,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',
    pros: ['解耦合，HIS与感控系统独立运行', '安全性高，仅暴露同步表', '不影响HIS核心业务性能'],
    cons: ['需要HIS端开发同步表写入逻辑', '存在一定延迟（取决于写入频率）', '需要维护额外的同步表结构'],
    recommended: '适用于HIS不允许直连但愿意配合的场景',
  },
  {
    key: 'esb', label: 'ESB企业服务总线', icon: GitMerge,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    pros: ['松耦合，标准化消息传递', '实时推送，数据延迟低', '企业级标准，可扩展性强'],
    cons: ['需要ESB平台支持', '实施成本较高', '系统复杂度增加，排障困难'],
    recommended: '适用于已部署ESB的大型医院',
  },
  {
    key: 'api', label: 'API接口方案', icon: Globe,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    pros: ['标准化接口，安全可控', '易于扩展和维护', '支持多种认证方式'],
    cons: ['需要HIS端开发API接口', '实时性取决于调用频率', '接口版本管理需要规范'],
    recommended: '适用于HIS提供标准API接口的场景',
  },
] as const;

const BUSINESS_SCENARIOS: Record<string, string> = {
  temperature: '体温数据同步', micro_lab: '微生物检验同步',
  patient_info: '患者信息同步', infectious_lab: '传染病检验同步',
};

const SYNC_MODE_LABELS: Record<string, string> = {
  direct: '数据库直连', sync_table: '同步表', esb: 'ESB总线', api: 'API接口',
};

const FREQ_OPTIONS = [
  { value: 300, label: '每5分钟' }, { value: 900, label: '每15分钟' },
  { value: 1800, label: '每30分钟' }, { value: 3600, label: '每1小时' },
  { value: 21600, label: '每6小时' }, { value: 43200, label: '每12小时' },
  { value: 86400, label: '每24小时' }, { value: 0, label: '自定义' },
];

// ============ Types ============
interface SyncConfig {
  id: string; name: string; syncMode: string; businessScenario: string;
  hisDbType?: string; hisHost?: string; hisPort?: string; hisDatabase?: string;
  hisUsername?: string; hisPassword?: string; hisTableName?: string; hisOptions?: string;
  syncTableName?: string; esbEndpoint?: string; esbAuthConfig?: string;
  apiEndpoint?: string; apiAuthType?: string; apiAuthConfig?: string;
  syncQuery?: string; fieldMapping?: string; transformRules?: string;
  incrementalField?: string; syncInterval: number; batchSize: number;
  enabled: number; autoWarning: number; connectionStatus: string;
  lastSyncTime?: string; lastSyncStatus?: string; lastSyncCount?: number;
  lastSyncError?: string; totalSyncCount: number; totalFailCount: number;
  description?: string; createdAt: string; updatedAt: string;
}

interface SyncLog {
  id: string; configId: string; configName: string; syncMode: string;
  businessScenario: string; triggerType: string; startTime: string;
  endTime?: string; duration?: number; status: string;
  sourceCount?: number; targetCount?: number; skippedCount?: number;
  errorCount?: number; warningCount?: number; errorDetail?: string;
  dataSample?: string; logDetail?: string; operator?: string; createdAt: string;
}

interface SyncStats {
  totalConfigs: number; enabledConfigs: number; totalSyncs: number;
  totalFails: number; recentLogs: SyncLog[];
  syncModeStats: Array<{ syncMode: string; count: number }>;
  scenarioStats: Array<{ businessScenario: string; count: number }>;
}

// ============ Helper functions ============
function api(path: string, options?: RequestInit) {
  const sep = path.includes('?') ? '&' : '?';
  return fetch(`${API_BASE}${path}${sep}${PORT_PARAM}`, options);
}

function getSyncModeDef(mode: string) {
  return SYNC_MODES.find(m => m.key === mode) || SYNC_MODES[0];
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    '成功': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    '运行中': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    '失败': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '部分成功': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  return map[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

function getConnStatusBadge(status: string) {
  if (status === '连接成功') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (status === '连接失败') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

function formatDuration(ms?: number) {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(iso?: string) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return iso; }
}

function relativeTime(iso?: string) {
  if (!iso) return '从未';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins}分钟前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}小时前`;
    const days = Math.floor(hrs / 24);
    return `${days}天前`;
  } catch { return iso; }
}

function categorizeError(err?: string): { category: string; color: string } {
  if (!err) return { category: '未知', color: 'bg-slate-100 text-slate-700' };
  const lower = err.toLowerCase();
  if (lower.includes('timeout') || lower.includes('超时') || lower.includes('etimedout')) return { category: '超时', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  if (lower.includes('auth') || lower.includes('unauthorized') || lower.includes('认证') || lower.includes('登录')) return { category: '认证', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' };
  if (lower.includes('network') || lower.includes('econnrefused') || lower.includes('enotfound') || lower.includes('网络') || lower.includes('连接')) return { category: '网络', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  return { category: '数据', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' };
}

// ============ Status Dot Component ============
function StatusDot({ config, executingId }: { config: SyncConfig; executingId: string | null }) {
  const isSyncing = executingId === config.id;
  if (config.enabled === 0) return <Circle size={10} className="text-slate-400 dark:text-slate-500 shrink-0" />;
  if (isSyncing) return <Radio size={10} className="text-sky-500 animate-spin shrink-0" />;
  if (config.connectionStatus === '连接失败') return <Circle size={10} className="text-red-500 shrink-0" fill="currentColor" />;
  if (config.connectionStatus === '连接成功') return <span className="relative flex h-2.5 w-2.5 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" /></span>;
  return <Circle size={10} className="text-slate-400 dark:text-slate-500 shrink-0" />;
}

// ============ Animated Counter ============
function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    const diff = value - from;
    if (diff === 0) return;
    const steps = 20;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setDisplay(Math.round(from + diff * (step / steps)));
      if (step >= steps) { clearInterval(timer); prevRef.current = value; }
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

// ============ Sync History Area Chart ============
function SyncHistoryChart({ logs }: { logs: SyncLog[] }) {
  const data = useMemo(() => {
    const days: Record<string, { success: number; fail: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { success: 0, fail: 0 };
    }
    logs.forEach(log => {
      const key = log.startTime?.slice(0, 10);
      if (key && days[key]) {
        if (log.status === '成功' || log.status === '部分成功') days[key].success += (log.targetCount ?? 0);
        if (log.status === '失败' || log.status === '部分成功') days[key].fail += (log.errorCount ?? 1);
      }
    });
    return Object.entries(days).map(([date, v]) => ({
      label: date.slice(5), success: v.success, fail: v.fail,
    }));
  }, [logs]);

  const maxVal = Math.max(1, ...data.map(d => d.success + d.fail));
  const W = 320, H = 120, PX = 30, PY = 10;
  const cw = (W - PX * 2) / (data.length - 1 || 1);
  const yScale = (v: number) => H - PY - (v / maxVal) * (H - PY * 2);

  const successPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${PX + i * cw} ${yScale(d.success)}`).join(' ');
  const totalPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${PX + i * cw} ${yScale(d.success + d.fail)}`).join(' ');
  const successArea = successPath + ` L ${PX + (data.length - 1) * cw} ${H - PY} L ${PX} ${H - PY} Z`;
  const failArea = totalPath + ` L ${PX + (data.length - 1) * cw} ${yScale(data[data.length - 1]?.success ?? 0)} ${successPath.split(' ').reverse().join(' ')} Z`.replace(/M|L/g, m => m === 'M' ? 'L' : 'M');

  return (
    <Card className="py-3 gap-2">
      <CardHeader className="pb-0 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity size={16} className="text-emerald-500" /> 近7天同步趋势
          <span className="ml-auto flex items-center gap-3 text-xs font-normal text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-emerald-400" /> 成功</span>
            <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-red-400" /> 失败</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-md" preserveAspectRatio="xMidYMid meet">
          {[0, 0.25, 0.5, 0.75, 1].map(t => (
            <g key={t}>
              <line x1={PX} y1={yScale(maxVal * t)} x2={W - PX} y2={yScale(maxVal * t)} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={0.5} strokeDasharray="3,3" />
              <text x={PX - 4} y={yScale(maxVal * t) + 3} textAnchor="end" className="fill-slate-400 text-[8px]">{Math.round(maxVal * t)}</text>
            </g>
          ))}
          <path d={successArea} fill="rgba(52,211,153,0.3)" />
          <path d={successPath} fill="none" stroke="#34d399" strokeWidth={1.5} />
          <path d={failArea} fill="rgba(248,113,113,0.3)" />
          <path d={totalPath} fill="none" stroke="#f87171" strokeWidth={1} strokeDasharray="3,2" />
          {data.map((d, i) => (
            <text key={d.label} x={PX + i * cw} y={H - 1} textAnchor="middle" className="fill-slate-400 text-[8px]">{d.label}</text>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
}

// ============ Data Flow Animation ============
function DataFlowAnimation() {
  return (
    <div className="relative flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-emerald-50 via-slate-50 to-rose-50 dark:from-emerald-900/10 dark:via-slate-800/50 dark:to-rose-900/10 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* HIS Source */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-rose-200 dark:border-rose-800 z-10">
        <Server size={18} className="text-rose-500" />
        <div>
          <div className="text-xs font-bold text-rose-700 dark:text-rose-400">HIS系统</div>
          <div className="text-[10px] text-slate-400">SQL Server 2016</div>
        </div>
      </div>
      {/* Animated arrows */}
      <div className="flex-1 relative h-8 min-w-[80px] max-w-[200px]">
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute top-1/2 -translate-y-1/2" style={{ animation: `flowRight 2s ease-in-out ${i * 0.7}s infinite` }}>
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80" />
              <ArrowRight size={14} className="text-emerald-500" />
            </div>
          </div>
        ))}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-emerald-200 dark:bg-emerald-800" />
      </div>
      {/* Target System */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-800 z-10">
        <Database size={18} className="text-emerald-500" />
        <div>
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">感控系统</div>
          <div className="text-[10px] text-slate-400">实时同步</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes flowRight {
          0% { left: 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { left: calc(100% - 20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ============ Loading Skeleton ============
function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
      </div>
    </div>
  );
}

// ============ Config Form Dialog ============
function ConfigFormDialog({ config, onClose, onSaved }: {
  config?: SyncConfig | null; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: config?.name || '', syncMode: config?.syncMode || 'direct',
    businessScenario: config?.businessScenario || 'temperature',
    hisDbType: config?.hisDbType || 'mssql', hisHost: config?.hisHost || '',
    hisPort: config?.hisPort || '1433', hisDatabase: config?.hisDatabase || '',
    hisUsername: config?.hisUsername || '', hisPassword: config?.hisPassword || '',
    hisTableName: config?.hisTableName || '', syncTableName: config?.syncTableName || '',
    esbEndpoint: config?.esbEndpoint || '', esbAuthConfig: config?.esbAuthConfig || '',
    apiEndpoint: config?.apiEndpoint || '', apiAuthType: config?.apiAuthType || 'bearer',
    apiAuthConfig: config?.apiAuthConfig || '', fieldMapping: config?.fieldMapping || '{}',
    transformRules: config?.transformRules || '{}', incrementalField: config?.incrementalField || '',
    syncInterval: config?.syncInterval ?? 300, batchSize: config?.batchSize ?? 500,
    autoWarning: config?.autoWarning ?? 1, description: config?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (field: string, value: unknown) => { setForm(prev => ({ ...prev, [field]: value })); setError(''); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('配置名称不能为空'); return; }
    setSaving(true);
    try {
      if (config?.id) {
        const res = await api(`/configs/${config.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        const d = await res.json(); if (d.error) { toast.error(d.error); setSaving(false); return; }
        toast.success('配置更新成功');
      } else {
        const res = await api('/configs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, enabled: 1 }) });
        const d = await res.json(); if (d.error) { toast.error(d.error); setSaving(false); return; }
        toast.success('配置创建成功');
      }
      onSaved();
    } catch { toast.error('操作失败'); }
    setSaving(false);
  };

  const showDbConfig = form.syncMode === 'direct' || form.syncMode === 'sync_table';
  const showSyncTable = form.syncMode === 'sync_table';
  const showEsbConfig = form.syncMode === 'esb';
  const showApiConfig = form.syncMode === 'api';
  const nextRun = form.syncInterval > 0 ? new Date(Date.now() + form.syncInterval * 1000).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database size={20} className="text-emerald-500" />
            {config ? '编辑同步配置' : '新建同步配置'}
          </DialogTitle>
          <DialogDescription>配置HIS数据同步方案和参数</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400"><XCircle size={14} /> {error}</div>}
          {/* 基本信息 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Server size={14} className="text-emerald-500" /> 基本信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">配置名称 <span className="text-red-500">*</span></label><Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="如: 体温数据直连同步" /></div>
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">同步方案</label><select value={form.syncMode} onChange={e => update('syncMode', e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300" disabled={!!config}>{SYNC_MODES.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">业务场景</label><select value={form.businessScenario} onChange={e => update('businessScenario', e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">{Object.entries(BUSINESS_SCENARIOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </div>
            <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">描述</label><textarea value={form.description} onChange={e => update('description', e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[48px]" placeholder="描述此同步配置的用途" /></div>
          </div>
          {/* 数据库连接 */}
          {showDbConfig && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Database size={14} className="text-sky-500" /> 数据库连接配置</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">主机地址</label><Input value={form.hisHost} onChange={e => update('hisHost', e.target.value)} placeholder="192.168.1.100" /></div>
                <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">端口</label><Input value={form.hisPort} onChange={e => update('hisPort', e.target.value)} placeholder="1433" /></div>
                <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">数据库名</label><Input value={form.hisDatabase} onChange={e => update('hisDatabase', e.target.value)} placeholder="HIS_Nursing" /></div>
                <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">用户名</label><Input value={form.hisUsername} onChange={e => update('hisUsername', e.target.value)} placeholder="sa" /></div>
                <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">密码</label><Input type="password" value={form.hisPassword} onChange={e => update('hisPassword', e.target.value)} placeholder="******" /></div>
                <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">源表名/视图</label><Input value={form.hisTableName} onChange={e => update('hisTableName', e.target.value)} placeholder="V_Temperature_Record" /></div>
              </div>
            </div>
          )}
          {showSyncTable && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Table2 size={14} className="text-sky-500" /> 同步表配置</h4>
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">同步表名</label><Input value={form.syncTableName} onChange={e => update('syncTableName', e.target.value)} placeholder="Sync_Temperature_To_Infection" /></div>
            </div>
          )}
          {showEsbConfig && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><GitMerge size={14} className="text-purple-500" /> ESB配置</h4>
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">ESB端点</label><Input value={form.esbEndpoint} onChange={e => update('esbEndpoint', e.target.value)} placeholder="http://esb.hospital.local/api/v1/push" /></div>
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">认证配置 (JSON)</label><textarea value={form.esbAuthConfig} onChange={e => update('esbAuthConfig', e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-mono bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[48px]" placeholder='{"type":"bearer","token":"xxx"}' /></div>
            </div>
          )}
          {showApiConfig && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Globe size={14} className="text-amber-500" /> API配置</h4>
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">API端点</label><Input value={form.apiEndpoint} onChange={e => update('apiEndpoint', e.target.value)} placeholder="http://his-api.hospital.local/api/v1/patients" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">认证类型</label><select value={form.apiAuthType} onChange={e => update('apiAuthType', e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300"><option value="bearer">Bearer Token</option><option value="basic">Basic Auth</option><option value="api_key">API Key</option><option value="oauth2">OAuth2</option></select></div>
                <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">认证配置 (JSON)</label><Input value={form.apiAuthConfig} onChange={e => update('apiAuthConfig', e.target.value)} placeholder='{"token":"xxx"}' /></div>
              </div>
            </div>
          )}
          {/* 字段映射 & 转换规则 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><ArrowRight size={14} className="text-teal-500" /> 字段映射与转换</h4>
            <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">字段映射 (JSON)</label><textarea value={form.fieldMapping} onChange={e => update('fieldMapping', e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-mono bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[80px]" placeholder='{"patientId":"PatientID"}' /></div>
            <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">转换规则 (JSON)</label><textarea value={form.transformRules} onChange={e => update('transformRules', e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-mono bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[60px]" placeholder='{"measureTime":{"type":"date_format"}}' /></div>
          </div>
          {/* 同步参数 + 调度 */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><SlidersHorizontal size={14} className="text-amber-500" /> 同步参数与调度</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">同步频率</label>
                <select value={FREQ_OPTIONS.some(o => o.value === form.syncInterval) ? form.syncInterval : 0} onChange={e => update('syncInterval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              {form.syncInterval === 0 && <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">自定义间隔(秒)</label><Input type="number" value={form.syncInterval || ''} onChange={e => update('syncInterval', parseInt(e.target.value) || 0)} /></div>}
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">批量大小</label><Input type="number" value={form.batchSize} onChange={e => update('batchSize', parseInt(e.target.value) || 500)} min={1} /></div>
              <div><label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">增量字段</label><Input value={form.incrementalField} onChange={e => update('incrementalField', e.target.value)} placeholder="CreateTime" /></div>
              <div className="flex items-end"><div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-lg w-full"><Switch checked={form.autoWarning === 1} onCheckedChange={c => update('autoWarning', c ? 1 : 0)} /><span className="text-xs text-slate-700 dark:text-slate-300">自动预警</span></div></div>
            </div>
            {form.syncInterval > 0 && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <Timer size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs text-emerald-700 dark:text-emerald-400">预计下次同步时间: {nextRun}</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name.trim()} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Log Detail Dialog (Enhanced) ============
function LogDetailDialog({ log, open, onClose, onRetry }: { log: SyncLog | null; open: boolean; onClose: () => void; onRetry?: (log: SyncLog) => void }) {
  const [expanded, setExpanded] = useState(false);
  if (!log) return null;
  const errCat = categorizeError(log.errorDetail);
  const isFailed = log.status === '失败' || log.status === '部分成功';
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Eye size={20} className="text-emerald-500" /> 同步日志详情</DialogTitle>
          <DialogDescription>{log.configName} - {SYNC_MODE_LABELS[log.syncMode] || log.syncMode}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge className={getStatusBadge(log.status)}>{log.status}</Badge>
              <span className="text-sm text-slate-600 dark:text-slate-400">{BUSINESS_SCENARIOS[log.businessScenario] || log.businessScenario}</span>
              {isFailed && <Badge className={`text-[10px] ${errCat.color}`}>{errCat.category}</Badge>}
            </div>
            <span className="text-xs text-slate-400">耗时: {formatDuration(log.duration)}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[{ label: '源记录', value: log.sourceCount ?? 0, color: 'text-sky-600' }, { label: '写入数', value: log.targetCount ?? 0, color: 'text-emerald-600' }, { label: '跳过数', value: log.skippedCount ?? 0, color: 'text-slate-500' }, { label: '错误数', value: log.errorCount ?? 0, color: 'text-red-600' }, { label: '预警数', value: log.warningCount ?? 0, color: 'text-amber-600' }].map(s => (
              <div key={s.label} className="p-2 border border-slate-100 dark:border-slate-700 rounded-lg text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
          {log.errorDetail && (
            <div className="space-y-2">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <XCircle size={14} />
                  <span className="text-xs font-medium">错误详情</span>
                  <Badge className={`text-[10px] ${errCat.color}`}>{errCat.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  {onRetry && <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); onRetry(log); }} className="h-6 text-xs gap-1 text-emerald-600"><RotateCcw size={10} />重试</Button>}
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
              <div className={`p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96' : 'max-h-12'}`}>
                <p className="text-xs text-red-700 dark:text-red-300 font-mono whitespace-pre-wrap break-all">{log.errorDetail}</p>
              </div>
            </div>
          )}
          {log.logDetail && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">执行日志</div>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 max-h-64 overflow-y-auto"><pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{log.logDetail}</pre></div>
            </div>
          )}
          {log.dataSample && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-slate-700 dark:text-slate-300">数据样本 (前5条)</div>
              <div className="bg-slate-900 dark:bg-slate-950 rounded-lg p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-sky-400 font-mono whitespace-pre-wrap">{(() => { try { return JSON.stringify(JSON.parse(log.dataSample), null, 2); } catch { return log.dataSample; } })()}</pre>
              </div>
            </div>
          )}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>关闭</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Main Page Component ============
export default function HisSyncManagementPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [configs, setConfigs] = useState<SyncConfig[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editConfig, setEditConfig] = useState<SyncConfig | null>(null);
  const [logDetail, setLogDetail] = useState<SyncLog | null>(null);
  const [showLogDetail, setShowLogDetail] = useState(false);
  const [logConfigFilter, setLogConfigFilter] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [testingAll, setTestingAll] = useState(false);



  const fetchConfigs = useCallback(async () => {
    try { const res = await api('/configs'); const d = await res.json(); if (d.data) setConfigs(d.data); } catch { toast.error('获取配置列表失败'); }
  }, []);

  const fetchStats = useCallback(async () => {
    try { const res = await api('/stats'); const d = await res.json(); setStats(d); } catch { /* silent */ }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (logConfigFilter) params.set('configId', logConfigFilter);
      if (logStatusFilter) params.set('status', logStatusFilter);
      params.set('limit', '50');
      const res = await api(`/logs?${params.toString()}`); const d = await res.json();
      if (d.data) setLogs(d.data);
    } catch { toast.error('获取日志失败'); }
    setLogsLoading(false);
  }, [logConfigFilter, logStatusFilter]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [configsRes, statsRes] = await Promise.all([api('/configs'), api('/stats')]);
        const configsData = await configsRes.json(); const statsData = await statsRes.json();
        if (configsData.data) setConfigs(configsData.data); if (statsData) setStats(statsData);
      } catch { toast.error('加载数据失败'); }
      setLoading(false);
      api('/seed', { method: 'POST' }).catch(() => {/* already seeded */});
    };
    loadData();
  }, []);

  // 30-second polling for stats (real-time status)
  useEffect(() => {
    const interval = setInterval(() => { void fetchStats(); void fetchConfigs(); }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchConfigs]);

  // Fetch logs when tab changes
  useEffect(() => {
    if (activeTab !== 'logs') return;
    let cancelled = false;
    const load = async () => {
      setLogsLoading(true);
      try {
        const params = new URLSearchParams();
        if (logConfigFilter) params.set('configId', logConfigFilter);
        if (logStatusFilter) params.set('status', logStatusFilter);
        params.set('limit', '50');
        const res = await api(`/logs?${params.toString()}`); const d = await res.json();
        if (!cancelled && d.data) setLogs(d.data);
      } catch { /* silent */ }
      if (!cancelled) setLogsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [activeTab, logConfigFilter, logStatusFilter]);

  const handleTestConnection = async (config: SyncConfig) => {
    setTestingId(config.id);
    try {
      const res = await api('/test-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ configId: config.id }) });
      const d = await res.json();
      if (d.success) toast.success(d.message || '连接测试成功'); else toast.error(d.message || '连接测试失败');
      void fetchConfigs();
    } catch { toast.error('连接测试请求失败'); }
    setTestingId(null);
  };

  const handleExecuteSync = async (config: SyncConfig) => {
    setExecutingId(config.id);
    try {
      const res = await api(`/execute/${config.id}`, { method: 'POST' }); const d = await res.json();
      if (d.data) {
        const r = d.data;
        if (r.status === '成功') toast.success(`同步完成: 写入${r.targetCount}条, 预警${r.warningCount || 0}条`);
        else if (r.status === '部分成功') toast.info(`部分成功: 写入${r.targetCount}条, 错误${r.errorCount}条`);
        else toast.error(`同步失败: ${r.error || '未知错误'}`);
      }
      void fetchConfigs(); void fetchStats();
    } catch { toast.error('同步执行请求失败'); }
    setExecutingId(null);
  };

  const handleToggleEnabled = async (config: SyncConfig) => {
    try {
      const newEnabled = config.enabled === 1 ? 0 : 1;
      await api(`/configs/${config.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: newEnabled }) });
      toast.success(newEnabled === 1 ? '已启用' : '已禁用');
      void fetchConfigs(); void fetchStats();
    } catch { toast.error('操作失败'); }
  };

  const handleDelete = async (config: SyncConfig) => {
    if (!confirm(`确认删除配置 [${config.name}]？此操作不可恢复。`)) return;
    try { await api(`/configs/${config.id}`, { method: 'DELETE' }); toast.success('配置已删除'); void fetchConfigs(); void fetchStats(); } catch { toast.error('删除失败'); }
  };

  const handleSyncAll = async () => {
    const enabled = configs.filter(c => c.enabled === 1);
    if (enabled.length === 0) { toast.info('没有启用的配置'); return; }
    setSyncingAll(true);
    let success = 0, fail = 0;
    for (const c of enabled) {
      try { const res = await api(`/execute/${c.id}`, { method: 'POST' }); const d = await res.json(); if (d.data?.status === '成功') success++; else fail++; } catch { fail++; }
    }
    if (fail > 0) toast.info(`批量同步完成: ${success}成功, ${fail}失败`); else toast.success(`批量同步完成: ${success}成功, ${fail}失败`);
    void fetchConfigs(); void fetchStats();
    setSyncingAll(false);
  };

  const handleTestAllConnections = async () => {
    const enabled = configs.filter(c => c.enabled === 1);
    if (enabled.length === 0) { toast.info('没有启用的配置'); return; }
    setTestingAll(true);
    let ok = 0, fail = 0;
    for (const c of enabled) {
      try { const res = await api('/test-connection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ configId: c.id }) }); const d = await res.json(); if (d.success) ok++; else fail++; } catch { fail++; }
    }
    if (fail > 0) toast.info(`批量测试完成: ${ok}成功, ${fail}失败`); else toast.success(`批量测试完成: ${ok}成功, ${fail}失败`);
    void fetchConfigs();
    setTestingAll(false);
  };

  const handleRetryLog = async (log: SyncLog) => {
    try {
      const res = await api(`/execute/${log.configId}`, { method: 'POST' }); const d = await res.json();
      if (d.data?.status === '成功') toast.success('重试同步成功'); else toast.error('重试同步失败');
      void fetchConfigs(); void fetchStats();
    } catch { toast.error('重试请求失败'); }
  };

  if (loading && !stats) return <div className="flex items-center justify-center h-64"><div className="text-center"><Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" /><div className="text-slate-500 text-sm">加载HIS同步管理数据...</div></div></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><Database size={22} className="text-emerald-600 dark:text-emerald-400" /></div>
          <div><h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">HIS同步管理</h2><p className="text-sm text-slate-500 dark:text-slate-400">医院信息系统数据同步方案配置与管理</p></div>
        </div>
        <Button onClick={() => { setEditConfig(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5"><Plus size={16} /> 新建配置</Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">方案总览</TabsTrigger>
          <TabsTrigger value="configs" className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">同步配置</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">同步日志</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 transition-all">方案对比</TabsTrigger>
        </TabsList>

        {/* ==================== Tab 1: 方案总览 ==================== */}
        <TabsContent value="overview" className="transition-opacity duration-300">
          {loading ? <LoadingSkeleton /> : (
            <>
              {/* Stats bar with animated counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: '总配置数', value: stats?.totalConfigs ?? 0, icon: <Database size={16} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: '启用数', value: stats?.enabledConfigs ?? 0, icon: <Wifi size={16} />, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20' },
                  { label: '累计同步', value: stats?.totalSyncs ?? 0, icon: <Activity size={16} />, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                  { label: '累计失败', value: stats?.totalFails ?? 0, icon: <WifiOff size={16} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                ].map(stat => (
                  <Card key={stat.label} className="py-3 gap-2 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center gap-2 mb-2"><div className={`p-1.5 rounded-lg ${stat.bg}`}><span className={stat.color}>{stat.icon}</span></div><span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span></div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200"><AnimatedCounter value={stat.value} /></div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Data Flow Animation */}
              <DataFlowAnimation />

              {/* Sync History Chart */}
              <div className="mt-4">
                <SyncHistoryChart logs={stats?.recentLogs ?? []} />
              </div>

              {/* Sync mode cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {SYNC_MODES.map(mode => {
                  const IconComp = mode.icon;
                  const configCount = configs.filter(c => c.syncMode === mode.key).length;
                  return (
                    <Card key={mode.key} className={`py-4 gap-3 border ${mode.border} hover:shadow-lg transition-all duration-200`}>
                      <CardHeader className="pb-0 px-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${mode.bg}`}><IconComp size={24} className={mode.color} /></div>
                            <div>
                              <CardTitle className="text-base">{mode.label}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={`text-[10px] ${mode.badge}`}>{mode.key.toUpperCase()}</Badge>
                                <span className="text-xs text-slate-400">{configCount}个配置</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-2 space-y-3">
                        <div className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">本系统</span>
                          <ArrowRight size={14} className="text-slate-400" />
                          {mode.key === 'sync_table' && <><span className="text-xs font-medium text-sky-700 dark:text-sky-400">同步表</span><ArrowRight size={14} className="text-slate-400" /></>}
                          {mode.key === 'esb' && <><span className="text-xs font-medium text-purple-700 dark:text-purple-400">ESB</span><ArrowRight size={14} className="text-slate-400" /></>}
                          {mode.key === 'api' && <><span className="text-xs font-medium text-amber-700 dark:text-amber-400">API</span><ArrowRight size={14} className="text-slate-400" /></>}
                          <span className="text-xs font-medium text-rose-700 dark:text-rose-400">SQL Server 2016</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1"><CheckCircle2 size={10} /> 优势</div><ul className="space-y-1">{mode.pros.map((p, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1"><span className="text-emerald-500 mt-0.5">•</span>{p}</li>)}</ul></div>
                          <div><div className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-1.5 flex items-center gap-1"><XCircle size={10} /> 劣势</div><ul className="space-y-1">{mode.cons.map((c, i) => <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1"><span className="text-red-500 mt-0.5">•</span>{c}</li>)}</ul></div>
                        </div>
                        <div className={`p-2.5 rounded-lg ${mode.bg} flex items-start gap-2`}><Zap size={14} className={`${mode.color} mt-0.5 shrink-0`} /><div><div className="text-[10px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">推荐场景</div><div className="text-xs text-slate-600 dark:text-slate-400">{mode.recommended}</div></div></div>
                        <Button onClick={() => { setEditConfig({ syncMode: mode.key } as SyncConfig); setShowForm(true); }} className={`w-full gap-1.5 bg-white dark:bg-slate-800 border ${mode.border} ${mode.color} text-sm`} variant="outline"><Plus size={14} /> 创建{mode.label}配置</Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Quick Actions Bar */}
              <div className="sticky bottom-4 mt-4 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg flex items-center justify-center gap-3 flex-wrap">
                <Button onClick={() => void handleSyncAll()} disabled={syncingAll} className="gap-1.5 bg-emerald-600 hover:bg-emerald-500">
                  {syncingAll ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />} {syncingAll ? '同步中...' : '同步全部'}
                </Button>
                <Button onClick={() => void handleTestAllConnections()} disabled={testingAll} variant="outline" className="gap-1.5">
                  {testingAll ? <RefreshCw size={14} className="animate-spin" /> : <Plug size={14} />} {testingAll ? '测试中...' : '测试全部连接'}
                </Button>
                <Button variant="outline" onClick={() => { void fetchConfigs(); void fetchStats(); }} className="gap-1.5"><RefreshCw size={14} /> 刷新</Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* ==================== Tab 2: 同步配置 (Card Layout) ==================== */}
        <TabsContent value="configs" className="transition-opacity duration-300">
          {loading ? <LoadingSkeleton /> : (
            <div className="space-y-3">
              {configs.length === 0 ? (
                <Card className="py-12 gap-3"><CardContent className="text-center"><Database size={40} className="text-slate-300 dark:text-slate-600 mx-auto mb-3" /><p className="text-slate-500 text-sm">暂无同步配置</p><Button onClick={() => { setEditConfig(null); setShowForm(true); }} className="mt-3 bg-emerald-600 hover:bg-emerald-500 gap-1.5"><Plus size={14} /> 新建配置</Button></CardContent></Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {configs.map(config => {
                    const modeDef = getSyncModeDef(config.syncMode);
                    const ModeIcon = modeDef.icon;
                    const successRate = config.totalSyncCount > 0 ? Math.round(((config.totalSyncCount - config.totalFailCount) / config.totalSyncCount) * 100) : 0;
                    const barColor = successRate >= 80 ? 'bg-emerald-500' : successRate >= 50 ? 'bg-amber-500' : 'bg-red-500';
                    const freqLabel = FREQ_OPTIONS.find(o => o.value === config.syncInterval)?.label || (config.syncInterval > 0 ? `${config.syncInterval}s` : '实时');
                    return (
                      <Card key={config.id} className={`py-4 gap-2 hover:shadow-lg transition-all duration-200 ${config.enabled === 0 ? 'opacity-60' : ''}`}>
                        <CardHeader className="pb-0 px-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-2 rounded-lg ${modeDef.bg}`}><ModeIcon size={18} className={modeDef.color} /></div>
                              <div>
                                <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{config.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <StatusDot config={config} executingId={executingId} />
                                  <Badge className={`text-[9px] ${getConnStatusBadge(config.connectionStatus)}`}>{config.connectionStatus}</Badge>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => handleToggleEnabled(config)}>
                              {config.enabled === 1 ? <ToggleRight size={24} className="text-emerald-500" /> : <ToggleLeft size={24} className="text-slate-300 dark:text-slate-600" />}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-2 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1"><Clock size={11} /> {relativeTime(config.lastSyncTime)}</span>
                            <Badge variant="outline" className={`text-[9px] ${modeDef.badge}`}>{BUSINESS_SCENARIOS[config.businessScenario] || config.businessScenario}</Badge>
                          </div>
                          {config.lastSyncStatus && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-slate-400">上次状态</span>
                              <Badge className={`text-[9px] ${getStatusBadge(config.lastSyncStatus)}`}>{config.lastSyncStatus}</Badge>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">频率</span>
                            <span className="text-slate-700 dark:text-slate-300">{freqLabel}</span>
                          </div>
                          {/* Success rate bar */}
                          {config.totalSyncCount > 0 && (
                            <div>
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="text-slate-500">成功率</span>
                                <span className={`font-medium ${successRate >= 80 ? 'text-emerald-600' : successRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{successRate}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${successRate}%` }} />
                              </div>
                            </div>
                          )}
                          {/* Quick Actions */}
                          <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                            <Button variant="ghost" size="sm" onClick={() => handleTestConnection(config)} disabled={testingId === config.id} className="h-7 text-xs gap-1 text-sky-600 hover:text-sky-500 flex-1">
                              {testingId === config.id ? <RefreshCw size={11} className="animate-spin" /> : <Plug size={11} />}测试
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleExecuteSync(config)} disabled={executingId === config.id} className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-500 flex-1">
                              {executingId === config.id ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}同步
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { setEditConfig(config); setShowForm(true); }} className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-500 flex-1">
                              <Pencil size={11} />编辑
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(config)} className="h-7 text-xs text-red-600 hover:text-red-500">
                              <Trash2 size={11} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ==================== Tab 3: 同步日志 ==================== */}
        <TabsContent value="logs" className="transition-opacity duration-300">
          <div className="space-y-3">
            <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
              <select value={logConfigFilter} onChange={e => setLogConfigFilter(e.target.value)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <option value="">全部配置</option>{configs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={logStatusFilter} onChange={e => setLogStatusFilter(e.target.value)} className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <option value="">全部状态</option><option value="成功">成功</option><option value="部分成功">部分成功</option><option value="失败">失败</option><option value="运行中">运行中</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => void fetchLogs()} className="gap-1.5 h-8"><RefreshCw size={14} /> 刷新</Button>
            </div>
            <Card className="py-4 gap-0">
              <ScrollArea className="w-full">
                <div className="min-w-[1000px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-xs font-semibold">配置名</TableHead>
                        <TableHead className="text-xs font-semibold">方案</TableHead>
                        <TableHead className="text-xs font-semibold">场景</TableHead>
                        <TableHead className="text-xs font-semibold text-center">触发</TableHead>
                        <TableHead className="text-xs font-semibold text-center">状态</TableHead>
                        <TableHead className="text-xs font-semibold text-center">源记录</TableHead>
                        <TableHead className="text-xs font-semibold text-center">写入</TableHead>
                        <TableHead className="text-xs font-semibold text-center">错误</TableHead>
                        <TableHead className="text-xs font-semibold text-center">预警</TableHead>
                        <TableHead className="text-xs font-semibold text-center">耗时</TableHead>
                        <TableHead className="text-xs font-semibold">执行时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        <TableRow><TableCell colSpan={11} className="text-center py-8"><Loader2 size={24} className="animate-spin text-emerald-500 mx-auto" /></TableCell></TableRow>
                      ) : logs.length === 0 ? (
                        <TableRow><TableCell colSpan={11} className="text-center py-8 text-slate-400 text-sm">暂无同步日志</TableCell></TableRow>
                      ) : (
                        logs.map((log, idx) => {
                          const errCat = categorizeError(log.errorDetail);
                          return (
                            <TableRow key={log.id} className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`} onClick={() => { setLogDetail(log); setShowLogDetail(true); }}>
                              <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-200">{log.configName}</TableCell>
                              <TableCell><Badge variant="outline" className={`text-[10px] ${getSyncModeDef(log.syncMode).badge}`}>{SYNC_MODE_LABELS[log.syncMode]}</Badge></TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{BUSINESS_SCENARIOS[log.businessScenario] || log.businessScenario}</TableCell>
                              <TableCell className="text-center text-xs text-slate-500">{log.triggerType === 'manual' ? '手动' : log.triggerType}</TableCell>
                              <TableCell className="text-center"><div className="flex items-center justify-center gap-1"><Badge className={`text-[10px] ${getStatusBadge(log.status)}`}>{log.status}</Badge>{log.errorDetail && <Badge className={`text-[9px] ${errCat.color}`}>{errCat.category}</Badge>}</div></TableCell>
                              <TableCell className="text-center text-xs text-slate-600 dark:text-slate-400">{log.sourceCount ?? '-'}</TableCell>
                              <TableCell className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">{log.targetCount ?? '-'}</TableCell>
                              <TableCell className="text-center text-xs">{log.errorCount ? <span className="text-red-600 dark:text-red-400 font-medium">{log.errorCount}</span> : <span className="text-slate-400">0</span>}</TableCell>
                              <TableCell className="text-center text-xs">{log.warningCount ? <span className="text-amber-600 dark:text-amber-400 font-medium">{log.warningCount}</span> : <span className="text-slate-400">0</span>}</TableCell>
                              <TableCell className="text-center text-xs text-slate-500">{formatDuration(log.duration)}</TableCell>
                              <TableCell className="text-xs text-slate-500 dark:text-slate-400">{formatTime(log.startTime)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        {/* ==================== Tab 4: 方案对比 ==================== */}
        <TabsContent value="comparison" className="transition-opacity duration-300">
          <Card className="py-4 gap-0">
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                      <TableHead className="text-xs font-semibold w-[120px]">对比维度</TableHead>
                      {SYNC_MODES.map(mode => { const I = mode.icon; return <TableHead key={mode.key} className="text-xs font-semibold text-center"><div className="flex flex-col items-center gap-1"><I size={18} className={mode.color} /><span>{mode.label}</span></div></TableHead>; })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[{ dimension: '实时性', values: ['高', '中', '高', '中'] }, { dimension: '安全性', values: ['低', '高', '高', '高'] }, { dimension: '实施难度', values: ['低', '中', '高', '中'] }, { dimension: '对HIS影响', values: ['高', '低', '低', '低'] }, { dimension: '维护成本', values: ['低', '中', '高', '中'] }, { dimension: '适用场景', values: ['HIS允许只读连接', 'HIS配合写同步表', '已部署ESB的大型医院', 'HIS提供标准API'] }, { dimension: '推荐等级', values: ['★★★★', '★★★★', '★★★', '★★★★'] }].map((row, idx) => (
                      <TableRow key={row.dimension} className={idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
                        <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-300">{row.dimension}</TableCell>
                        {row.values.map((val, ci) => {
                          let cellClass = 'text-sm text-slate-600 dark:text-slate-400';
                          if (['实时性', '安全性'].includes(row.dimension)) { if (val === '高') cellClass = 'text-sm text-emerald-600 dark:text-emerald-400 font-medium'; else if (val === '低') cellClass = 'text-sm text-red-500 dark:text-red-400'; else if (val === '中') cellClass = 'text-sm text-amber-600 dark:text-amber-400'; }
                          if (['实施难度', '对HIS影响', '维护成本'].includes(row.dimension)) { if (val === '高') cellClass = 'text-sm text-red-500 dark:text-red-400 font-medium'; else if (val === '低') cellClass = 'text-sm text-emerald-600 dark:text-emerald-400'; else if (val === '中') cellClass = 'text-sm text-amber-600 dark:text-amber-400'; }
                          return <TableCell key={ci} className={`text-center ${cellClass}`}>{val}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <Card className="py-3 gap-2 border-emerald-200 dark:border-emerald-800">
              <CardContent className="p-4 pt-0"><div className="flex items-center gap-2 mb-2"><Shield size={16} className="text-emerald-600 dark:text-emerald-400" /><span className="text-sm font-semibold text-slate-800 dark:text-slate-200">安全优先推荐</span></div><p className="text-xs text-slate-600 dark:text-slate-400">如医院信息安全要求严格，推荐使用 <strong className="text-sky-600 dark:text-sky-400">同步表方案</strong> 或 <strong className="text-amber-600 dark:text-amber-400">API接口方案</strong>，避免直连HIS数据库。</p></CardContent>
            </Card>
            <Card className="py-3 gap-2 border-sky-200 dark:border-sky-800">
              <CardContent className="p-4 pt-0"><div className="flex items-center gap-2 mb-2"><Zap size={16} className="text-sky-600 dark:text-sky-400" /><span className="text-sm font-semibold text-slate-800 dark:text-slate-200">实时性优先推荐</span></div><p className="text-xs text-slate-600 dark:text-slate-400">如对数据时效性要求高（如体温监测、MDRO预警），推荐使用 <strong className="text-emerald-600 dark:text-emerald-400">数据库直连方案</strong> 或 <strong className="text-purple-600 dark:text-purple-400">ESB推送方案</strong>。</p></CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {showForm && <ConfigFormDialog config={editConfig} onClose={() => { setShowForm(false); setEditConfig(null); }} onSaved={() => { setShowForm(false); setEditConfig(null); void fetchConfigs(); void fetchStats(); }} />}
      <LogDetailDialog log={logDetail} open={showLogDetail} onClose={() => { setShowLogDetail(false); setLogDetail(null); }} onRetry={handleRetryLog} />
    </div>
  );
}
