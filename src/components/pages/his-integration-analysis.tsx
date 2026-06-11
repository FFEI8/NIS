'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GitMerge, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  Database, FileText, Shield, Table2, AlertOctagon, Info, Loader2,
  ChevronRight, ArrowLeftRight, Calendar, Code2, Binary, SlidersHorizontal,
  Thermometer, RefreshCw, Save, Users, Activity, TrendingUp, Eye,
  Plus, Trash2, Pencil, Search, Wifi, WifiOff, FlaskConical,
  Clock, Filter, X, Play, TestTube, Download, Heart, Network,
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/app-store';
import { useConfigStore } from '@/store/config-store';

// Types
interface BusinessScenario {
  id: string;
  name: string;
  module: string;
  hisSystem: string;
  priority: string;
  description: string;
}

interface FieldMapping {
  id: string;
  systemField: string;
  systemLabel: string;
  dataType: string;
  length: number;
  required: boolean;
  hisField: string;
  hisTable: string;
  transformRule: string;
  specialLogic: string;
  validationRule: string;
  consistencyRisk: string;
}

interface ConversionRule {
  category: string;
  sourceFormat: string;
  targetFormat: string;
  conversionFunction: string;
  example: string;
}

interface ValidationRule {
  form: string;
  field: string;
  ruleType: string;
  ruleDescription: string;
  errorMessage: string;
  severity: string;
}

interface ConsistencyIssue {
  severity: string;
  category: string;
  description: string;
  affectedFields: string;
  solution: string;
}

interface TempRecord {
  id: string;
  patientId: string;
  patientName: string;
  dept: string;
  bedNo: string;
  temperature: number;
  measureRoute: string;
  measureTime: string;
  isAbnormal: boolean;
  isFever: boolean;
  isReported: boolean;
  dataSource: string;
  feverLevel: string;
}

interface TemperatureStats {
  totalRecords: number;
  feverCount: number;
  abnormalCount: number;
  reportedCount: number;
  trend: Array<{ date: string; avgTemp: number }>;
  deptBreakdown: Array<{ dept: string; total: number; fever: number; abnormal: number }>;
  records: TempRecord[];
}

interface LabResultRecord {
  id: string;
  patientId: string;
  patientName: string | null;
  dept: string | null;
  testItemName: string;
  resultValue: string | null;
  isPositive: number;
  diseaseName: string | null;
  diseaseCategory: string | null;
  reportTime: string | null;
  syncStatus: string;
  warningTriggered: number;
  autoReported: number;
  hisSource: string;
}

interface LabResultStats {
  totalCount: number;
  positiveCount: number;
  recentPositiveCount: number;
  warningTriggeredCount: number;
  autoReportedCount: number;
}

interface SyncLogRecord {
  id: string;
  ruleName: string;
  ruleCode: string;
  triggerSource: string;
  sourceDetail: string | null;
  warningLevel: string;
  warningType: string;
  actionTaken: string;
  status: string;
  createdAt: string;
}

interface HISMappingData {
  businessScenarios: BusinessScenario[];
  fieldMappings: Record<string, FieldMapping[]>;
  conversionRules: ConversionRule[];
  validationRules: ValidationRule[];
  consistencyIssues: ConsistencyIssue[];
  temperatureStats: TemperatureStats | null;
  summary: {
    totalScenarios: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    totalFieldMappings: number;
    totalConversionRules: number;
    totalValidationRules: number;
    totalConsistencyIssues: number;
    highSeverityIssues: number;
  };
}

interface WarningConfig {
  autoReportEnabled: boolean;
  feverThreshold: number;
  reportFeverLevel: string;
  targetDepts: string[];
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    prevTarget.current = target;
  }, [target, duration]);

  return value;
}

// Priority color mapping
function getPriorityColor(priority: string) {
  switch (priority) {
    case '高': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case '中': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case '低': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
}

function getPriorityDot(priority: string) {
  switch (priority) {
    case '高': return 'bg-red-500';
    case '中': return 'bg-amber-500';
    case '低': return 'bg-slate-400';
    default: return 'bg-slate-400';
  }
}

function getDataTypeColor(dataType: string) {
  switch (dataType) {
    case 'String': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400';
    case 'Int': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Float': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'DateTime': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Enum': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case '高': return 'bg-red-500';
    case '中': return 'bg-amber-500';
    case '低': return 'bg-slate-400';
    default: return 'bg-slate-400';
  }
}

function getSeverityBadge(severity: string) {
  switch (severity) {
    case '高': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case '中': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    case '低': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
}

function getRuleTypeBadge(ruleType: string) {
  const map: Record<string, string> = {
    required: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    format: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    range: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    'cross-field': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    business: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return map[ruleType] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
}

function getRuleTypeLabel(ruleType: string) {
  const map: Record<string, string> = {
    required: '必填',
    format: '格式',
    range: '范围',
    'cross-field': '跨字段',
    business: '业务逻辑',
  };
  return map[ruleType] || ruleType;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case '日期格式转换': return <Calendar size={16} className="text-purple-500" />;
    case '代码映射': return <Code2 size={16} className="text-emerald-500" />;
    case '数据类型转换': return <Binary size={16} className="text-sky-500" />;
    case '值域映射': return <SlidersHorizontal size={16} className="text-amber-500" />;
    default: return <ArrowLeftRight size={16} className="text-slate-500" />;
  }
}

function getTempColor(temp: number) {
  if (temp >= 39) return 'text-red-600 dark:text-red-400 font-bold';
  if (temp >= 38) return 'text-orange-600 dark:text-orange-400 font-semibold';
  if (temp >= 37.3) return 'text-amber-600 dark:text-amber-400 font-medium';
  return 'text-slate-700 dark:text-slate-300';
}

function getFeverLevelBadge(level: string) {
  switch (level) {
    case '高热': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case '超高热': return 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300 border-red-300 dark:border-red-700';
    case '中度发热': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    case '低热': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
  }
}

function getTriggerSourceLabel(source: string) {
  const map: Record<string, string> = {
    micro_lab: '微生物检验',
    infection_case: '感染病例',
    symptom: '症状监测',
    environment: '环境监测',
    temperature: '体温数据',
    infectious_disease_lab: '传染病检验',
  };
  return map[source] || source;
}

function getTriggerSourceBadge(source: string) {
  const map: Record<string, string> = {
    micro_lab: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    infection_case: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    symptom: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    environment: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    temperature: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    infectious_disease_lab: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };
  return map[source] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
}

function getSyncStatusBadge(status: string) {
  switch (status) {
    case '已同步': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case '待同步': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case '同步失败': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  }
}

// SVG Trend Chart Component
function TemperatureTrendChart({ trend, threshold }: { trend: Array<{ date: string; avgTemp: number }>; threshold: number }) {
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minTemp = 36.0;
  const maxTemp = 39.5;

  const scaleX = (i: number) => padding.left + (i / (trend.length - 1)) * chartW;
  const scaleY = (temp: number) => padding.top + chartH - ((temp - minTemp) / (maxTemp - minTemp)) * chartH;

  const points = trend.map((d, i) => `${scaleX(i)},${scaleY(d.avgTemp)}`).join(' ');
  const areaPoints = trend.map((d, i) => `${scaleX(i)},${scaleY(d.avgTemp)}`).join(' ') +
    ` ${scaleX(trend.length - 1)},${scaleY(minTemp)} ${scaleX(0)},${scaleY(minTemp)}`;

  const thresholdY = scaleY(threshold);
  const yLabels = [36.0, 36.5, 37.0, 37.5, 38.0, 38.5, 39.0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: '240px' }}>
      <rect x={padding.left} y={padding.top} width={chartW} height={chartH}
        className="fill-slate-50 dark:fill-slate-800/50" rx="2" />
      {yLabels.map(temp => (
        <line key={temp} x1={padding.left} y1={scaleY(temp)} x2={width - padding.right} y2={scaleY(temp)}
          className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      {yLabels.map(temp => (
        <text key={temp} x={padding.left - 5} y={scaleY(temp) + 3} textAnchor="end"
          className="fill-slate-500 dark:fill-slate-400 text-[10px]">
          {temp.toFixed(1)}℃
        </text>
      ))}
      {trend.map((d, i) => (
        <text key={d.date} x={scaleX(i)} y={height - 5} textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400 text-[10px]">
          {d.date}
        </text>
      ))}
      <line x1={padding.left} y1={thresholdY} x2={width - padding.right} y2={thresholdY}
        className="stroke-red-500" strokeWidth="1.5" strokeDasharray="6,3" />
      <text x={width - padding.right + 3} y={thresholdY + 3}
        className="fill-red-500 dark:fill-red-400 text-[9px] font-medium">
        {threshold}℃
      </text>
      <polygon points={areaPoints} className="fill-emerald-100 dark:fill-emerald-900/20" />
      <polyline points={points} className="fill-none stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="2" />
      {trend.map((d, i) => (
        <g key={d.date}>
          <circle cx={scaleX(i)} cy={scaleY(d.avgTemp)} r="4"
            className={d.avgTemp >= threshold ? 'fill-red-500 dark:fill-red-400' : 'fill-emerald-500 dark:fill-emerald-400'} />
          <text x={scaleX(i)} y={scaleY(d.avgTemp) - 8} textAnchor="middle"
            className={`text-[9px] font-medium ${d.avgTemp >= threshold ? 'fill-red-600 dark:fill-red-400' : 'fill-emerald-700 dark:fill-emerald-300'}`}>
            {d.avgTemp.toFixed(1)}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Stat Card with animated counter
function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: React.ReactNode; color: string;
}) {
  const animatedValue = useAnimatedCounter(value);
  return (
    <Card className="py-3 gap-2">
      <CardContent className="p-3 pt-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={color}>{icon}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{animatedValue}</div>
      </CardContent>
    </Card>
  );
}

// Icon stat card with animated counter (for temperature & lab tabs)
function IconStatCard({ label, value, icon, color, bg }: {
  label: string; value: number; icon: React.ReactNode; color: string; bg: string;
}) {
  const animatedValue = useAnimatedCounter(value);
  return (
    <Card className="py-3 gap-2">
      <CardContent className="p-4 pt-0">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${bg}`}><span className={color}>{icon}</span></div>
          <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{animatedValue}</div>
      </CardContent>
    </Card>
  );
}

export default function HISIntegrationAnalysisPage() {
  const { getDeptNames, getSystemConfig } = useConfigStore();
  const ALL_DEPTS = getDeptNames();
  const [data, setData] = useState<HISMappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState('infection-case');
  const [activeTab, setActiveTab] = useState('overview');

  // HIS sync service configuration status
  const [hisConfigStatus, setHisConfigStatus] = useState<'checking' | 'configured' | 'not_configured'>('checking');
  const [hisSyncConfigs, setHisSyncConfigs] = useState<any[]>([]);
  // Connection test result
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; detail?: string } | null>(null);
  const [connectionTesting, setConnectionTesting] = useState(false);

  // Field mapping CRUD state
  const [mappingSearch, setMappingSearch] = useState('');
  const [editMapping, setEditMapping] = useState<FieldMapping | null>(null);
  const [addMappingOpen, setAddMappingOpen] = useState(false);
  const [deleteMapping, setDeleteMapping] = useState<FieldMapping | null>(null);
  const [mappingSaving, setMappingSaving] = useState(false);

  // Batch operations state
  const [selectedMappingIds, setSelectedMappingIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Health check state
  const [healthCheckOpen, setHealthCheckOpen] = useState(false);
  const [healthCheckResult, setHealthCheckResult] = useState<{
    score: number;
    issues: Array<{ severity: string; category: string; description: string; field: string; scenario: string }>;
  } | null>(null);
  const [healthCheckLoading, setHealthCheckLoading] = useState(false);

  // Temperature tab state
  const [tempStats, setTempStats] = useState<TemperatureStats | null>(null);
  const [tempLoading, setTempLoading] = useState(false);
  const [tempRecords, setTempRecords] = useState<TempRecord[]>([]);
  const [tempPage, setTempPage] = useState(1);
  const tempPageSize = 10;

  // Lab results tab state
  const [labStats, setLabStats] = useState<LabResultStats | null>(null);
  const [labRecords, setLabRecords] = useState<LabResultRecord[]>([]);
  const [labLoading, setLabLoading] = useState(false);
  const [labSyncing, setLabSyncing] = useState(false);
  const [labSyncResult, setLabSyncResult] = useState<{ synced: number; positive: number; warningsTriggered: number; casesCreated: number } | null>(null);
  const [labAutoReport, setLabAutoReport] = useState(true);

  // Sync log tab state
  const [syncLogs, setSyncLogs] = useState<SyncLogRecord[]>([]);
  const [syncLogLoading, setSyncLogLoading] = useState(false);
  const [syncLogFilter, setSyncLogFilter] = useState('');
  const [syncLogDateRange, setSyncLogDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Consistency filter
  const [consistencyFilter, setConsistencyFilter] = useState<string>('all');

  // Validation filter
  const [validationSearch, setValidationSearch] = useState('');
  const [validationRuleTypeFilter, setValidationRuleTypeFilter] = useState('');

  // Conversion test dialog
  const [conversionTest, setConversionTest] = useState<ConversionRule | null>(null);
  const [conversionTestInput, setConversionTestInput] = useState('');
  const [conversionTestOutput, setConversionTestOutput] = useState('');

  // Warning config
  const [warningConfig, setWarningConfig] = useState<WarningConfig>(() => {
    const storedAutoReport = getSystemConfig('temperature_warning_auto_report');
    const storedFeverThreshold = getSystemConfig('temperature_warning_fever_threshold');
    const storedReportFeverLevel = getSystemConfig('temperature_warning_report_fever_level');
    const storedTargetDepts = getSystemConfig('temperature_warning_target_depts');
    if (storedAutoReport || storedFeverThreshold || storedReportFeverLevel) {
      return {
        autoReportEnabled: storedAutoReport ? storedAutoReport === 'true' : true,
        feverThreshold: storedFeverThreshold ? parseFloat(storedFeverThreshold) : 38.0,
        reportFeverLevel: storedReportFeverLevel || '中度发热',
        targetDepts: storedTargetDepts ? storedTargetDepts.split(',').filter(Boolean) : [],
      };
    }
    try {
      const saved = localStorage.getItem('hims-temperature-warning-config');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { autoReportEnabled: true, feverThreshold: 38.0, reportFeverLevel: '中度发热', targetDepts: [] };
  });

  const [configSaving, setConfigSaving] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{ syncedRecords: number; warningsTriggered: number } | null>(null);
  const [detailRecord, setDetailRecord] = useState<TempRecord | null>(null);

  const setActiveMenu = useAppStore(s => s.setActiveMenu);

  // Fetch main data
  const fetchData = useCallback(() => {
    setLoading(true);
    fetch('/api/his-mapping')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
        if (d.temperatureStats) {
          setTempStats(d.temperatureStats);
          setTempRecords(d.temperatureStats.records || []);
        }
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch temperature stats separately
  const fetchTempStats = useCallback(() => {
    setTempLoading(true);
    fetch('/api/temperature-records/stats')
      .then(r => r.json())
      .then(d => {
        setTempStats(d);
        setTempRecords(d.records || []);
        setTempLoading(false);
      })
      .catch(() => setTempLoading(false));
  }, []);

  // Fetch lab results data
  const fetchLabData = useCallback(() => {
    setLabLoading(true);
    Promise.all([
      fetch('/api/infectious-disease-lab-results/stats').then(r => r.json()),
      fetch('/api/infectious-disease-lab-results?pageSize=50').then(r => r.json()),
    ]).then(([statsData, listData]) => {
      if (statsData.success) setLabStats(statsData.data);
      if (listData.success) setLabRecords(listData.data.items);
      setLabLoading(false);
    }).catch(() => setLabLoading(false));
  }, []);

  // Fetch sync logs
  const fetchSyncLogs = useCallback(() => {
    setSyncLogLoading(true);
    fetch('/api/warning-rule-logs?pageSize=50')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setSyncLogs((d.data.items || []).map((item: any) => ({
            id: item.id,
            ruleName: item.ruleName,
            ruleCode: item.ruleCode,
            triggerSource: item.triggerSource,
            sourceDetail: item.sourceDetail,
            warningLevel: item.warningLevel,
            warningType: item.warningType,
            actionTaken: item.actionTaken,
            status: item.status,
            createdAt: item.createdAt,
          })));
        } else {
          setSyncLogs([]);
        }
        setSyncLogLoading(false);
      })
      .catch(() => { setSyncLogs([]); setSyncLogLoading(false); });
  }, []);

  // Load lab data and sync logs when their tabs are active
  useEffect(() => {
    if (activeTab === 'lab-results' && !labStats) fetchLabData();
    if (activeTab === 'sync-logs' && syncLogs.length === 0) fetchSyncLogs();
  }, [activeTab, labStats, fetchLabData, syncLogs.length, fetchSyncLogs]);

  // Check HIS sync service configuration status on mount
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await fetch('/api/his-sync/configs?XTransformPort=3030');
        const result = await res.json();
        if (result.data && result.data.length > 0) {
          setHisConfigStatus('configured');
          setHisSyncConfigs(result.data);
        } else {
          setHisConfigStatus('not_configured');
        }
      } catch {
        // Sync service might not be running
        setHisConfigStatus('not_configured');
      }
    };
    checkConfig();
  }, []);

  // Test actual connection to HIS sync service
  const handleTestConnection = async () => {
    setConnectionTesting(true);
    setConnectionTestResult(null);
    try {
      const res = await fetch('/api/health?XTransformPort=3030');
      const data = await res.json();
      if (data.status === 'ok') {
        setConnectionTestResult({
          success: true,
          message: 'HIS同步服务连接成功',
          detail: `服务运行中，已配置${data.totalConfigs}个同步方案，其中${data.enabledConfigs}个已启用`,
        });
        // Refresh config status
        if (data.totalConfigs > 0) {
          setHisConfigStatus('configured');
        } else {
          setHisConfigStatus('not_configured');
        }
      } else {
        setConnectionTestResult({ success: false, message: 'HIS同步服务响应异常' });
      }
    } catch {
      setConnectionTestResult({ success: false, message: '无法连接HIS同步服务，请检查服务是否启动' });
    }
    setConnectionTesting(false);
  };

  // Save warning config to backend SystemConfig
  const saveWarningConfig = async () => {
    setConfigSaving(true);
    try {
      const configs = [
        { configKey: 'temperature_warning_auto_report', configValue: String(warningConfig.autoReportEnabled), configType: 'boolean', category: 'temperature_warning', description: '体温预警自动上报开关' },
        { configKey: 'temperature_warning_fever_threshold', configValue: String(warningConfig.feverThreshold), configType: 'number', category: 'temperature_warning', description: '发热阈值(℃)' },
        { configKey: 'temperature_warning_report_fever_level', configValue: warningConfig.reportFeverLevel, configType: 'string', category: 'temperature_warning', description: '触发上报发热分级' },
        { configKey: 'temperature_warning_target_depts', configValue: warningConfig.targetDepts.join(','), configType: 'string', category: 'temperature_warning', description: '目标科室' },
      ];
      await Promise.all(configs.map(c => fetch('/api/system-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })));
      // Also save to localStorage as fallback
      localStorage.setItem('hims-temperature-warning-config', JSON.stringify(warningConfig));
      toast.success('预警配置已保存');
    } catch {
      toast.error('保存配置失败');
    }
    setConfigSaving(false);
  };

  // Sync HIS data
  const handleSync = async () => {
    setSyncDialogOpen(true);
    setSyncing(true);
    setSyncProgress(0);
    setSyncResult(null);
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => { if (prev >= 90) { clearInterval(progressInterval); return 90; } return prev + 15; });
    }, 300);
    try {
      const res = await fetch('/api/temperature-records/sync', { method: 'POST' });
      const result = await res.json();
      clearInterval(progressInterval);
      setSyncProgress(100);
      setSyncResult({ syncedRecords: result.syncedRecords, warningsTriggered: result.warningsTriggered });
      setSyncing(false);
      fetchTempStats();
    } catch {
      clearInterval(progressInterval);
      setSyncProgress(100);
      setSyncResult({ syncedRecords: 0, warningsTriggered: 0 });
      setSyncing(false);
    }
  };

  // Lab sync
  const handleLabSync = async () => {
    setLabSyncing(true);
    setLabSyncResult(null);
    try {
      const res = await fetch('/api/infectious-disease-lab-results/sync', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        setLabSyncResult(result.data);
      }
      fetchLabData();
    } catch { /* ignore */ }
    setLabSyncing(false);
  };

  // Field mapping CRUD operations
  const handleSaveMapping = async (mapping: Partial<FieldMapping>, isNew: boolean) => {
    setMappingSaving(true);
    try {
      if (isNew) {
        const res = await fetch('/api/his-mapping/field-mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...mapping, scenarioId: selectedScenario }),
        });
        const result = await res.json();
        if (!result.success) { toast.error(result.message); setMappingSaving(false); return; }
        toast.success('字段映射已创建');
      } else if (mapping.id) {
        const res = await fetch(`/api/his-mapping/field-mappings/${mapping.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mapping),
        });
        const result = await res.json();
        if (!result.success) { toast.error(result.message); setMappingSaving(false); return; }
        toast.success('字段映射已更新');
      }
      fetchData();
      setEditMapping(null);
      setAddMappingOpen(false);
    } catch {
      toast.error('保存字段映射失败');
    }
    setMappingSaving(false);
  };

  const handleDeleteMapping = async (id: string) => {
    try {
      await fetch(`/api/his-mapping/field-mappings/${id}`, { method: 'DELETE' });
      fetchData();
      setDeleteMapping(null);
      toast.success('字段映射已删除');
    } catch {
      toast.error('删除字段映射失败');
    }
  };

  // Batch operations
  const handleBatchDelete = async () => {
    setBatchProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedMappingIds).map(id =>
          fetch(`/api/his-mapping/field-mappings/${id}`, { method: 'DELETE' })
        )
      );
      toast.success(`已批量删除 ${selectedMappingIds.size} 个字段映射`);
      setSelectedMappingIds(new Set());
      fetchData();
    } catch {
      toast.error('批量删除失败');
    }
    setBatchProcessing(false);
  };

  const handleBatchToggleStatus = async (enable: boolean) => {
    setBatchProcessing(true);
    try {
      await Promise.all(
        Array.from(selectedMappingIds).map(id =>
          fetch(`/api/his-mapping/field-mappings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: enable ? 1 : 0 }),
          })
        )
      );
      toast.success(`已${enable ? '启用' : '禁用'} ${selectedMappingIds.size} 个字段映射`);
      setSelectedMappingIds(new Set());
      fetchData();
    } catch {
      toast.error(`批量${enable ? '启用' : '禁用'}失败`);
    }
    setBatchProcessing(false);
  };

  // CSV Export
  const handleExportCSV = (ids?: Set<string>) => {
    const fieldsToExport = ids
      ? currentFields.filter(f => ids.has(f.id))
      : currentFields;
    const headers = ['系统字段', '系统标签', '数据类型', '长度', '必填', 'HIS字段', 'HIS表名', '转换规则', '特殊逻辑', '校验规则', '一致性风险'];
    const rows = fieldsToExport.map(f => [
      f.systemField, f.systemLabel, f.dataType, String(f.length),
      f.required ? '是' : '否', f.hisField || '', f.hisTable || '',
      f.transformRule || '', f.specialLogic || '', f.validationRule || '', f.consistencyRisk || '',
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `字段映射_${selectedScenario}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${fieldsToExport.length} 条字段映射`);
  };

  // Health check
  const handleHealthCheck = () => {
    setHealthCheckLoading(true);
    setHealthCheckOpen(true);

    // Use setTimeout to allow the UI to update before running the analysis
    setTimeout(() => {
      const issues: Array<{ severity: string; category: string; description: string; field: string; scenario: string }> = [];
      const allScenarios = data?.businessScenarios || [];

      for (const scenario of allScenarios) {
        const fields = data?.fieldMappings[scenario.id] || [];
        for (const field of fields) {
          // Check 1: Required field without HIS mapping
          if (field.required && !field.hisField) {
            issues.push({
              severity: '高', category: '必填字段未映射',
              description: `必填字段 "${field.systemLabel}" 未配置HIS对应字段`,
              field: field.systemField, scenario: scenario.name,
            });
          }
          // Check 2: Consistency risk
          if (field.consistencyRisk) {
            issues.push({
              severity: '中', category: '一致性风险',
              description: field.consistencyRisk,
              field: field.systemField, scenario: scenario.name,
            });
          }
          // Check 3: Missing validation rule for required field
          if (field.required && !field.validationRule) {
            issues.push({
              severity: '中', category: '缺少校验规则',
              description: `必填字段 "${field.systemLabel}" 缺少校验规则`,
              field: field.systemField, scenario: scenario.name,
            });
          }
          // Check 4: Mapped field without transform rule (non-trivial)
          if (field.hisField && !field.transformRule && (field.dataType === 'DateTime' || field.dataType === 'Enum')) {
            issues.push({
              severity: '低', category: '缺少转换规则',
              description: `${field.dataType}类型字段 "${field.systemLabel}" 已映射但缺少转换规则`,
              field: field.systemField, scenario: scenario.name,
            });
          }
        }
      }

      // Calculate health score
      const totalFields = Object.values(data?.fieldMappings || {}).flat().length;
      const highIssues = issues.filter(i => i.severity === '高').length;
      const medIssues = issues.filter(i => i.severity === '中').length;
      const lowIssues = issues.filter(i => i.severity === '低').length;
      const deduction = highIssues * 10 + medIssues * 5 + lowIssues * 2;
      const score = Math.max(0, Math.min(100, 100 - deduction));

      setHealthCheckResult({ score, issues });
      setHealthCheckLoading(false);
    }, 100);
  };

  // Conversion rule test
  const handleTestConversion = (rule: ConversionRule) => {
    setConversionTest(rule);
    setConversionTestInput('');
    setConversionTestOutput('');
  };

  const runConversionTest = () => {
    if (!conversionTest || !conversionTestInput) return;
    const cat = conversionTest.category;
    let output = '';
    try {
      if (cat === '日期格式转换') {
        const d = new Date(conversionTestInput);
        output = isNaN(d.getTime()) ? '无法解析日期' : d.toISOString().split('T')[0];
      } else if (cat === '代码映射') {
        const codeMap: Record<string, string> = { '1': '男', '2': '女', 'M': '男', 'F': '女', '0': '否', 'Y': '是' };
        output = codeMap[conversionTestInput] || `未找到映射 (代码: ${conversionTestInput})`;
      } else if (cat === '数据类型转换') {
        const num = parseFloat(conversionTestInput);
        output = isNaN(num) ? '无法转换为数字' : String(num);
      } else if (cat === '值域映射') {
        const val = parseFloat(conversionTestInput);
        if (isNaN(val)) output = '请输入数字';
        else if (val >= 37.3 && val < 38) output = '低热';
        else if (val >= 38 && val < 39) output = '中度发热';
        else if (val >= 39 && val < 41) output = '高热';
        else if (val >= 41) output = '超高热';
        else output = '正常';
      } else {
        output = `转换结果: ${conversionTestInput}`;
      }
    } catch {
      output = '转换失败';
    }
    setConversionTestOutput(output);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
          <div className="text-slate-500 text-sm">加载HIS对接分析数据...</div>
        </div>
      </div>
    );
  }

  const { businessScenarios, fieldMappings, conversionRules, validationRules, consistencyIssues, summary } = data;
  const currentFields = fieldMappings[selectedScenario] || [];

  // Filtered field mappings
  const filteredFields = mappingSearch
    ? currentFields.filter(f =>
        f.systemField.toLowerCase().includes(mappingSearch.toLowerCase()) ||
        f.systemLabel.toLowerCase().includes(mappingSearch.toLowerCase()) ||
        f.hisField.toLowerCase().includes(mappingSearch.toLowerCase())
      )
    : currentFields;

  // Filtered consistency issues
  const filteredConsistency = consistencyFilter === 'all'
    ? consistencyIssues
    : consistencyIssues.filter(i => i.severity === consistencyFilter);

  // Filtered validation rules
  const filteredValidation = validationRules.filter(r => {
    const matchSearch = !validationSearch ||
      r.form.toLowerCase().includes(validationSearch.toLowerCase()) ||
      r.field.toLowerCase().includes(validationSearch.toLowerCase()) ||
      r.ruleDescription.toLowerCase().includes(validationSearch.toLowerCase());
    const matchType = !validationRuleTypeFilter || r.ruleType === validationRuleTypeFilter;
    return matchSearch && matchType;
  });

  // Temperature pagination
  const totalPages = Math.ceil(tempRecords.length / tempPageSize);
  const pagedRecords = tempRecords.slice((tempPage - 1) * tempPageSize, tempPage * tempPageSize);

  // Sync log filter
  const filteredSyncLogs = syncLogs.filter(log => {
    if (syncLogFilter && log.triggerSource !== syncLogFilter) return false;
    if (syncLogDateRange !== 'all') {
      const days = syncLogDateRange === '7d' ? 7 : syncLogDateRange === '30d' ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      if (new Date(log.createdAt) < cutoff) return false;
    }
    return true;
  });

  // Calculate total mapped fields per scenario
  const getMappedFieldCount = (scenarioId: string) => {
    const fields = fieldMappings[scenarioId] || [];
    return fields.filter(f => f.hisField).length;
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <GitMerge size={22} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">HIS对接分析</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">医院信息系统集成映射配置与数据一致性分析</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
            hisConfigStatus === 'configured'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : hisConfigStatus === 'checking'
                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}>
            {hisConfigStatus === 'configured' ? <Wifi size={14} /> : hisConfigStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : <WifiOff size={14} />}
            {hisConfigStatus === 'configured' ? `已配置(${hisSyncConfigs.length}个方案)` : hisConfigStatus === 'checking' ? '检测中...' : '未配置'}
          </div>
          <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={connectionTesting} className="h-8 text-xs border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-900/20">
            {connectionTesting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Wifi size={14} className="mr-1.5" />}
            检测连接
          </Button>
          <Button variant="outline" size="sm" onClick={handleHealthCheck} className="h-8 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-900/20">
            <Heart size={14} className="mr-1.5" />
            健康检查
          </Button>
          <Button variant="outline" size="sm" onClick={() => fetchData()} className="h-8 text-xs">
            <RefreshCw size={14} className="mr-1.5" />
            刷新
          </Button>
        </div>
        {/* Connection test result notification */}
        {connectionTestResult && (
          <div className={`w-full text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
            connectionTestResult.success
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {connectionTestResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            <span className="font-medium">{connectionTestResult.message}</span>
            {connectionTestResult.detail && <span className="opacity-80">- {connectionTestResult.detail}</span>}
          </div>
        )}
        {/* Note about HIS connectivity */}
        <div className="w-full text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
          <Info size={12} />
          <span>实际HIS连通性取决于同步服务的部署状态与网络配置，点击"检测连接"可验证同步服务是否在线</span>
        </div>
      </div>

      {/* Summary Stats Bar with animated counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: '业务场景', value: summary.totalScenarios, icon: <Database size={14} />, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: '高优先级', value: summary.highPriorityCount, icon: <AlertTriangle size={14} />, color: 'text-red-600 dark:text-red-400' },
          { label: '中优先级', value: summary.mediumPriorityCount, icon: <Info size={14} />, color: 'text-amber-600 dark:text-amber-400' },
          { label: '字段映射', value: summary.totalFieldMappings, icon: <Table2 size={14} />, color: 'text-sky-600 dark:text-sky-400' },
          { label: '转换规则', value: summary.totalConversionRules, icon: <ArrowLeftRight size={14} />, color: 'text-purple-600 dark:text-purple-400' },
          { label: '校验规则', value: summary.totalValidationRules, icon: <Shield size={14} />, color: 'text-teal-600 dark:text-teal-400' },
          { label: '一致性问题', value: summary.totalConsistencyIssues, icon: <AlertOctagon size={14} />, color: 'text-orange-600 dark:text-orange-400' },
          { label: '高危问题', value: summary.highSeverityIssues, icon: <AlertTriangle size={14} />, color: 'text-red-600 dark:text-red-400' },
        ].map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main Tabs with count badges */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            业务场景总览
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">{summary.totalScenarios}</Badge>
          </TabsTrigger>
          <TabsTrigger value="mapping" className="text-xs sm:text-sm">
            字段映射详情
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">{summary.totalFieldMappings}</Badge>
          </TabsTrigger>
          <TabsTrigger value="mapping-diagram" className="text-xs sm:text-sm">
            <Network size={14} className="mr-1" />
            映射关系图
          </TabsTrigger>
          <TabsTrigger value="conversion" className="text-xs sm:text-sm">
            数据格式转换
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">{summary.totalConversionRules}</Badge>
          </TabsTrigger>
          <TabsTrigger value="validation" className="text-xs sm:text-sm">
            校验规则汇总
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">{summary.totalValidationRules}</Badge>
          </TabsTrigger>
          <TabsTrigger value="consistency" className="text-xs sm:text-sm">
            一致性问题
            <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">{summary.totalConsistencyIssues}</Badge>
          </TabsTrigger>
          <TabsTrigger value="temperature" className="text-xs sm:text-sm">
            <Thermometer size={14} className="mr-1" />
            体温表对接
          </TabsTrigger>
          <TabsTrigger value="lab-results" className="text-xs sm:text-sm">
            <FlaskConical size={14} className="mr-1" />
            传染病检验对接
          </TabsTrigger>
          <TabsTrigger value="sync-logs" className="text-xs sm:text-sm">
            <Clock size={14} className="mr-1" />
            同步日志
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Business Scenario Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {businessScenarios.map((scenario) => {
              const totalFields = (fieldMappings[scenario.id] || []).length;
              const mappedFields = getMappedFieldCount(scenario.id);
              const progress = totalFields > 0 ? Math.round((mappedFields / totalFields) * 100) : 0;
              return (
                <Card key={scenario.id} className="hover:shadow-md transition-all duration-200 py-4 gap-3">
                  <CardHeader className="pb-0 px-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getPriorityDot(scenario.priority)}`} />
                        <CardTitle className="text-base">{scenario.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(scenario.priority)}`}>
                        {scenario.priority}优先级
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-2 space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{scenario.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        <Database size={12} /> {scenario.module}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-400">
                        <FileText size={12} /> {scenario.hisSystem}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded text-sky-700 dark:text-sky-400">
                        <Table2 size={12} /> {totalFields}个字段
                      </span>
                    </div>
                    {/* Progress indicator */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">字段映射进度</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{mappedFields}/{totalFields} ({progress}%)</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <button
                      onClick={() => { setSelectedScenario(scenario.id); setActiveTab('mapping'); }}
                      className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      查看字段映射 <ChevronRight size={12} />
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 2: Field Mapping Details with CRUD */}
        <TabsContent value="mapping">
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">选择业务场景:</span>
                <Select value={selectedScenario} onValueChange={(v) => { setSelectedScenario(v); setSelectedMappingIds(new Set()); }}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {businessScenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full inline-block ${getPriorityDot(s.priority)}`} />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Table2 size={14} />
                <span>共 {currentFields.length} 个字段映射</span>
              </div>
              {/* Search/Filter */}
              <div className="flex items-center gap-2 ml-auto">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="搜索字段名/HIS字段..."
                    value={mappingSearch}
                    onChange={(e) => setMappingSearch(e.target.value)}
                    className="w-[220px] h-8 text-xs pl-8"
                  />
                </div>
                {mappingSearch && (
                  <Button variant="ghost" size="sm" onClick={() => setMappingSearch('')} className="h-8 w-8 p-0">
                    <X size={14} />
                  </Button>
                )}
                <Button
                  onClick={() => setAddMappingOpen(true)}
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus size={14} className="mr-1" />
                  新增字段映射
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV()}
                  className="h-8 text-xs"
                >
                  <Download size={14} className="mr-1" />
                  导出CSV
                </Button>
              </div>
            </div>

            {/* Batch action bar */}
            {selectedMappingIds.size > 0 && (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  已选择 {selectedMappingIds.size} 项
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchToggleStatus(true)}
                  disabled={batchProcessing}
                  className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                >
                  批量启用
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchToggleStatus(false)}
                  disabled={batchProcessing}
                  className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                >
                  批量禁用
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV(selectedMappingIds)}
                  disabled={batchProcessing}
                  className="h-7 text-xs border-sky-300 text-sky-700 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400"
                >
                  <Download size={12} className="mr-1" />导出选中
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchDelete}
                  disabled={batchProcessing}
                  className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                >
                  <Trash2 size={12} className="mr-1" />批量删除
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMappingIds(new Set())}
                  className="h-7 text-xs ml-auto"
                >
                  取消选择
                </Button>
              </div>
            )}

            {filteredFields.length === 0 ? (
              <Card className="py-8">
                <CardContent className="text-center text-slate-500 dark:text-slate-400 text-sm">
                  {mappingSearch ? '未找到匹配的字段映射' : '暂无字段映射数据'}
                </CardContent>
              </Card>
            ) : (
              <Card className="py-4 gap-0">
                <ScrollArea className="w-full">
                  <div className="min-w-[1400px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableHead className="w-[40px] text-xs font-semibold text-center">
                            <input
                              type="checkbox"
                              checked={filteredFields.length > 0 && filteredFields.every(f => selectedMappingIds.has(f.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMappingIds(new Set([...selectedMappingIds, ...filteredFields.map(f => f.id)]));
                                } else {
                                  const newSet = new Set(selectedMappingIds);
                                  filteredFields.forEach(f => newSet.delete(f.id));
                                  setSelectedMappingIds(newSet);
                                }
                              }}
                              className="rounded border-slate-300 dark:border-slate-600"
                            />
                          </TableHead>
                          <TableHead className="w-[120px] text-xs font-semibold">系统字段</TableHead>
                          <TableHead className="w-[100px] text-xs font-semibold">中文名称</TableHead>
                          <TableHead className="w-[80px] text-xs font-semibold">数据类型</TableHead>
                          <TableHead className="w-[60px] text-xs font-semibold text-center">长度</TableHead>
                          <TableHead className="w-[60px] text-xs font-semibold text-center">必填</TableHead>
                          <TableHead className="w-[130px] text-xs font-semibold">HIS字段</TableHead>
                          <TableHead className="w-[120px] text-xs font-semibold">HIS表</TableHead>
                          <TableHead className="w-[200px] text-xs font-semibold">转换规则</TableHead>
                          <TableHead className="w-[180px] text-xs font-semibold">特殊逻辑</TableHead>
                          <TableHead className="w-[150px] text-xs font-semibold">校验规则</TableHead>
                          <TableHead className="w-[200px] text-xs font-semibold">一致性风险</TableHead>
                          <TableHead className="w-[80px] text-xs font-semibold text-center">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFields.map((field, idx) => (
                          <TableRow
                            key={field.id}
                            className={`cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'} ${selectedMappingIds.has(field.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                            onClick={() => setEditMapping(field)}
                          >
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selectedMappingIds.has(field.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedMappingIds);
                                  if (e.target.checked) newSet.add(field.id);
                                  else newSet.delete(field.id);
                                  setSelectedMappingIds(newSet);
                                }}
                                className="rounded border-slate-300 dark:border-slate-600"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">{field.systemField}</TableCell>
                            <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">{field.systemLabel}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getDataTypeColor(field.dataType)}`}>
                                {field.dataType}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-center text-slate-600 dark:text-slate-400">{field.length}</TableCell>
                            <TableCell className="text-center">
                              {field.required ? (
                                <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                              ) : (
                                <XCircle size={16} className="text-slate-300 dark:text-slate-600 mx-auto" />
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-purple-700 dark:text-purple-400">{field.hisField || '-'}</TableCell>
                            <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">{field.hisTable || '-'}</TableCell>
                            <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px]">
                              <span className="line-clamp-2">{field.transformRule || '-'}</span>
                            </TableCell>
                            <TableCell className="text-xs text-amber-700 dark:text-amber-400 max-w-[180px]">
                              <span className="line-clamp-2">{field.specialLogic || '-'}</span>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[150px]">
                              <span className="line-clamp-2">{field.validationRule || '-'}</span>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              {field.consistencyRisk ? (
                                <div className="flex items-start gap-1">
                                  <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                  <span className="text-xs text-amber-700 dark:text-amber-400 line-clamp-2">{field.consistencyRisk}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => setEditMapping(field)} className="h-7 w-7 p-0">
                                  <Pencil size={13} className="text-slate-500 hover:text-emerald-600" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setDeleteMapping(field)} className="h-7 w-7 p-0">
                                  <Trash2 size={13} className="text-slate-500 hover:text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab 2b: Mapping Diagram */}
        <TabsContent value="mapping-diagram">
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">选择业务场景:</span>
                <Select value={selectedScenario} onValueChange={(v) => { setSelectedScenario(v); setSelectedMappingIds(new Set()); }}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {businessScenarios.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full inline-block ${getPriorityDot(s.priority)}`} />
                          {s.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-emerald-500" />已映射</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-amber-500" />有风险</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-slate-300 dark:bg-slate-600" />未映射</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-500" />必填未映射</div>
              </div>
            </div>

            {/* Per-scenario mapping stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {businessScenarios.map((scenario) => {
                const fields = fieldMappings[scenario.id] || [];
                const total = fields.length;
                const mapped = fields.filter(f => f.hisField).length;
                const withRisk = fields.filter(f => f.consistencyRisk).length;
                const requiredUnmapped = fields.filter(f => f.required && !f.hisField).length;
                const pct = total > 0 ? Math.round((mapped / total) * 100) : 0;
                return (
                  <Card
                    key={scenario.id}
                    className={`py-3 gap-2 cursor-pointer transition-all hover:shadow-md ${selectedScenario === scenario.id ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : ''}`}
                    onClick={() => { setSelectedScenario(scenario.id); setSelectedMappingIds(new Set()); }}
                  >
                    <CardContent className="p-3 pt-0">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{scenario.name}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{pct}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        <span className="text-emerald-600 dark:text-emerald-400">{mapped}/{total} 映射</span>
                        {withRisk > 0 && <span className="text-amber-600 dark:text-amber-400">{withRisk} 风险</span>}
                        {requiredUnmapped > 0 && <span className="text-red-600 dark:text-red-400">{requiredUnmapped} 必填未映射</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* SVG Mapping Diagram */}
            <Card className="py-4 gap-3">
              <CardHeader className="pb-0 px-4">
                <div className="flex items-center gap-2">
                  <Network size={18} className="text-emerald-600 dark:text-emerald-400" />
                  <CardTitle className="text-base">字段映射关系图 - {businessScenarios.find(s => s.id === selectedScenario)?.name}</CardTitle>
                </div>
                <CardDescription>系统字段与HIS字段的映射关系可视化</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-2">
                <ScrollArea className="w-full">
                  <MappingDiagram
                    fields={currentFields}
                    scenarioName={businessScenarios.find(s => s.id === selectedScenario)?.name || ''}
                    onFieldClick={(field) => setEditMapping(field)}
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Data Format Conversion with test button */}
        <TabsContent value="conversion">
          <div className="space-y-6">
            {['日期格式转换', '代码映射', '数据类型转换', '值域映射'].map((category) => {
              const rules = conversionRules.filter(r => r.category === category);
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-3">
                    {getCategoryIcon(category)}
                    <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{category}</h3>
                    <Badge variant="outline" className="text-xs">{rules.length}条规则</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {rules.map((rule, idx) => (
                      <Card key={idx} className="py-3 gap-2 hover:shadow-sm transition-shadow">
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-mono bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800">
                              {rule.sourceFormat}
                            </Badge>
                            <ArrowRight size={14} className="text-slate-400 shrink-0" />
                            <Badge variant="outline" className="text-xs font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                              {rule.targetFormat}
                            </Badge>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-800 rounded px-3 py-2">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">转换函数</div>
                            <code className="text-xs text-purple-700 dark:text-purple-400 break-all">{rule.conversionFunction}</code>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500 dark:text-slate-400">示例:</span>
                              <code className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded">{rule.example}</code>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTestConversion(rule)}
                              className="h-7 text-[11px] gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                            >
                              <TestTube size={12} />
                              测试
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab 4: Validation Rules Summary with filters */}
        <TabsContent value="validation">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="搜索表单/字段/规则..."
                  value={validationSearch}
                  onChange={(e) => setValidationSearch(e.target.value)}
                  className="w-[220px] h-8 text-xs pl-8"
                />
              </div>
              <Select value={validationRuleTypeFilter} onValueChange={setValidationRuleTypeFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="规则类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部类型</SelectItem>
                  <SelectItem value="required">必填</SelectItem>
                  <SelectItem value="format">格式</SelectItem>
                  <SelectItem value="range">范围</SelectItem>
                  <SelectItem value="cross-field">跨字段</SelectItem>
                  <SelectItem value="business">业务逻辑</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                显示 {filteredValidation.length}/{validationRules.length} 条规则
              </span>
            </div>
            <Card className="py-4 gap-0">
              <ScrollArea className="w-full">
                <div className="min-w-[1000px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                        <TableHead className="text-xs font-semibold">表单名称</TableHead>
                        <TableHead className="text-xs font-semibold">字段</TableHead>
                        <TableHead className="text-xs font-semibold">规则类型</TableHead>
                        <TableHead className="text-xs font-semibold">规则描述</TableHead>
                        <TableHead className="text-xs font-semibold">错误提示</TableHead>
                        <TableHead className="text-xs font-semibold text-center">严重程度</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredValidation.map((rule, idx) => (
                        <TableRow key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                          <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{rule.form}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">{rule.field}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getRuleTypeBadge(rule.ruleType)}`}>
                              {getRuleTypeLabel(rule.ruleType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[250px]">
                            <span className="line-clamp-2">{rule.ruleDescription}</span>
                          </TableCell>
                          <TableCell className="text-xs text-red-600 dark:text-red-400 max-w-[200px]">
                            <span className="line-clamp-2">{rule.errorMessage}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getSeverityBadge(rule.severity)}`}>
                              {rule.severity}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 5: Consistency Issues with severity filter */}
        <TabsContent value="consistency">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={consistencyFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConsistencyFilter('all')}
                className={`h-7 text-xs ${consistencyFilter === 'all' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              >
                全部 ({consistencyIssues.length})
              </Button>
              {['高', '中', '低'].map((sev) => {
                const count = consistencyIssues.filter(i => i.severity === sev).length;
                return (
                  <Button
                    key={sev}
                    variant={consistencyFilter === sev ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConsistencyFilter(sev)}
                    className={`h-7 text-xs ${consistencyFilter === sev ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full mr-1.5 ${getSeverityColor(sev)}`} />
                    {sev}风险 ({count})
                  </Button>
                );
              })}
            </div>

            {filteredConsistency.length === 0 ? (
              <Card className="py-8">
                <CardContent className="text-center text-slate-500 dark:text-slate-400 text-sm">
                  没有符合条件的一致性问题
                </CardContent>
              </Card>
            ) : (
              filteredConsistency.map((issue, idx) => (
                <Card key={idx} className="py-3 gap-2 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getSeverityColor(issue.severity)}`} />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getSeverityBadge(issue.severity)}`}>
                            {issue.severity}风险
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {issue.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200">{issue.description}</p>
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">影响字段:</span>
                          <code className="text-xs font-mono text-sky-700 dark:text-sky-400">{issue.affectedFields}</code>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded px-3 py-2 flex items-start gap-2">
                          <Shield size={14} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-0.5">建议解决方案</div>
                            <div className="text-xs text-emerald-800 dark:text-emerald-300">{issue.solution}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tab 6: Temperature Chart Integration */}
        <TabsContent value="temperature">
          {tempLoading && !tempStats ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '总记录数', value: tempStats?.totalRecords ?? 0, icon: <Database size={16} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: '发热人数', value: tempStats?.feverCount ?? 0, icon: <Thermometer size={16} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: '异常体温', value: tempStats?.abnormalCount ?? 0, icon: <Activity size={16} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: '已上报症状监测', value: tempStats?.reportedCount ?? 0, icon: <CheckCircle2 size={16} />, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
                ].map((stat) => (
                  <IconStatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} bg={stat.bg} />
                ))}
              </div>

              <Card className="py-4 gap-3">
                <CardHeader className="pb-0 px-4">
                  <div className="flex items-center gap-2">
                    <Thermometer size={18} className="text-amber-600 dark:text-amber-400" />
                    <CardTitle className="text-base">智能预警规则</CardTitle>
                  </div>
                  <CardDescription>配置体温数据自动上报规则，当HIS推送数据满足条件时自动创建症状监测记录</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">自动上报症状监测</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">体温超过阈值时自动创建记录</div>
                      </div>
                      <Switch
                        checked={warningConfig.autoReportEnabled}
                        onCheckedChange={(checked) => setWarningConfig(prev => ({ ...prev, autoReportEnabled: checked }))}
                      />
                    </div>
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">发热阈值(℃)</div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="37.0"
                          max="42.0"
                          value={warningConfig.feverThreshold}
                          onChange={(e) => setWarningConfig(prev => ({ ...prev, feverThreshold: parseFloat(e.target.value) || 38.0 }))}
                          className="w-24"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400">℃</span>
                      </div>
                    </div>
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">触发上报发热分级</div>
                      <Select
                        value={warningConfig.reportFeverLevel}
                        onValueChange={(value) => setWarningConfig(prev => ({ ...prev, reportFeverLevel: value }))}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="低热">低热 (37.3-37.9℃)</SelectItem>
                          <SelectItem value="中度发热">中度发热 (38.0-38.9℃)</SelectItem>
                          <SelectItem value="高热">高热 (39.0-40.9℃)</SelectItem>
                          <SelectItem value="超高热">超高热 (≥41.0℃)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">目标科室（可选）</div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {ALL_DEPTS.map(dept => {
                          const isSelected = warningConfig.targetDepts.includes(dept);
                          return (
                            <button key={dept} onClick={() => {
                              setWarningConfig(prev => ({
                                ...prev,
                                targetDepts: isSelected ? prev.targetDepts.filter(d => d !== dept) : [...prev.targetDepts, dept],
                              }));
                            }} className={`px-2 py-0.5 rounded text-xs transition-colors ${
                              isSelected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                            }`}>{dept}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                    <Info size={16} className="text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-sky-700 dark:text-sky-300">当HIS推送的体温数据超过设定阈值时，系统将自动创建症状监测记录，无需手动新增</p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button onClick={saveWarningConfig} disabled={configSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {configSaving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                      保存配置
                    </Button>
                    <Button onClick={handleSync} variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                      <RefreshCw size={14} className="mr-1.5" /> 立即同步HIS数据
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="py-4 gap-3">
                <CardHeader className="pb-0 px-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <CardTitle className="text-base">近7日平均体温趋势</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-2">
                  {tempStats?.trend && tempStats.trend.length > 0 ? (
                    <TemperatureTrendChart trend={tempStats.trend} threshold={warningConfig.feverThreshold} />
                  ) : (
                    <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">暂无趋势数据</div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-emerald-500 dark:bg-emerald-400" /><span>平均体温</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-red-500 border-dashed" style={{ borderTop: '2px dashed', height: 0 }} /><span>发热阈值 ({warningConfig.feverThreshold}℃)</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="py-4 gap-3">
                <CardHeader className="pb-0 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-slate-600 dark:text-slate-400" />
                      <CardTitle className="text-base">体温数据列表</CardTitle>
                      <Badge variant="outline" className="text-xs">{tempRecords.length}条记录</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-2">
                  <ScrollArea className="w-full">
                    <div className="min-w-[900px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                            <TableHead className="text-xs font-semibold">患者姓名</TableHead>
                            <TableHead className="text-xs font-semibold">科室</TableHead>
                            <TableHead className="text-xs font-semibold">床号</TableHead>
                            <TableHead className="text-xs font-semibold">体温</TableHead>
                            <TableHead className="text-xs font-semibold">测量途径</TableHead>
                            <TableHead className="text-xs font-semibold">测量时间</TableHead>
                            <TableHead className="text-xs font-semibold">发热分级</TableHead>
                            <TableHead className="text-xs font-semibold">是否上报</TableHead>
                            <TableHead className="text-xs font-semibold">数据来源</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pagedRecords.map((record, idx) => (
                            <TableRow
                              key={record.id}
                              className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}
                              onClick={() => setDetailRecord(record)}
                            >
                              <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">{record.patientName}</TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{record.dept}</TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{record.bedNo}</TableCell>
                              <TableCell className={`text-xs ${getTempColor(record.temperature)}`}>{record.temperature}℃</TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{record.measureRoute}</TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {new Date(record.measureTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getFeverLevelBadge(record.feverLevel)}`}>{record.feverLevel}</Badge>
                              </TableCell>
                              <TableCell>
                                {record.isReported ? (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">已上报</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">未上报</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{record.dataSource}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        第 {(tempPage - 1) * tempPageSize + 1}-{Math.min(tempPage * tempPageSize, tempRecords.length)} 条，共 {tempRecords.length} 条
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setTempPage(p => Math.max(1, p - 1))} disabled={tempPage === 1} className="h-7 text-xs">上一页</Button>
                        <span className="text-xs text-slate-600 dark:text-slate-400">{tempPage}/{totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setTempPage(p => Math.min(totalPages, p + 1))} disabled={tempPage === totalPages} className="h-7 text-xs">下一页</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 7: Infectious Disease Lab Results Sync */}
        <TabsContent value="lab-results">
          {labLoading && !labStats ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: '总记录数', value: labStats?.totalCount ?? 0, icon: <Database size={16} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: '阳性结果', value: labStats?.positiveCount ?? 0, icon: <AlertTriangle size={16} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: '近7日阳性', value: labStats?.recentPositiveCount ?? 0, icon: <TrendingUp size={16} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: '触发预警', value: labStats?.warningTriggeredCount ?? 0, icon: <AlertOctagon size={16} />, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: '已自动上报', value: labStats?.autoReportedCount ?? 0, icon: <CheckCircle2 size={16} />, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
                ].map((stat) => (
                  <IconStatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} color={stat.color} bg={stat.bg} />
                ))}
              </div>

              {/* Auto-report config + Sync button */}
              <Card className="py-4 gap-3">
                <CardHeader className="pb-0 px-4">
                  <div className="flex items-center gap-2">
                    <FlaskConical size={18} className="text-rose-600 dark:text-rose-400" />
                    <CardTitle className="text-base">传染病检验对接配置</CardTitle>
                  </div>
                  <CardDescription>配置HIS/LIS传染病检验数据自动同步与上报规则</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">阳性结果自动上报</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">检出阳性时自动创建传染病病例</div>
                      </div>
                      <Switch checked={labAutoReport} onCheckedChange={setLabAutoReport} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">HIS/LIS数据源</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">从检验系统自动获取检验结果</div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                        <Wifi size={12} className="mr-1" /> 已连接
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button onClick={handleLabSync} disabled={labSyncing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {labSyncing ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
                      同步HIS检验数据
                    </Button>
                  </div>
                  {labSyncResult && (
                    <div className="grid grid-cols-4 gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <div className="text-center">
                        <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{labSyncResult.synced}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-500">同步记录</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-700 dark:text-red-400">{labSyncResult.positive}</div>
                        <div className="text-[10px] text-red-600 dark:text-red-500">阳性结果</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-700 dark:text-amber-400">{labSyncResult.warningsTriggered}</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-500">触发预警</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-sky-700 dark:text-sky-400">{labSyncResult.casesCreated}</div>
                        <div className="text-[10px] text-sky-600 dark:text-sky-500">创建病例</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lab results table */}
              <Card className="py-4 gap-3">
                <CardHeader className="pb-0 px-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-slate-600 dark:text-slate-400" />
                    <CardTitle className="text-base">近期检验结果</CardTitle>
                    <Badge variant="outline" className="text-xs">{labRecords.length}条</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-2">
                  <ScrollArea className="w-full">
                    <div className="min-w-[1000px]">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                            <TableHead className="text-xs font-semibold">患者</TableHead>
                            <TableHead className="text-xs font-semibold">科室</TableHead>
                            <TableHead className="text-xs font-semibold">检验项目</TableHead>
                            <TableHead className="text-xs font-semibold">结果</TableHead>
                            <TableHead className="text-xs font-semibold text-center">阳性</TableHead>
                            <TableHead className="text-xs font-semibold">关联传染病</TableHead>
                            <TableHead className="text-xs font-semibold text-center">同步状态</TableHead>
                            <TableHead className="text-xs font-semibold text-center">预警</TableHead>
                            <TableHead className="text-xs font-semibold text-center">已上报</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {labRecords.map((record, idx) => (
                            <TableRow key={record.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}>
                              <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">{record.patientName || record.patientId}</TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{record.dept || '-'}</TableCell>
                              <TableCell className="text-xs text-slate-700 dark:text-slate-300 max-w-[200px]"><span className="line-clamp-1">{record.testItemName}</span></TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${record.isPositive ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                  {record.resultValue || '-'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {record.isPositive ? (
                                  <AlertTriangle size={14} className="text-red-500 mx-auto" />
                                ) : (
                                  <CheckCircle2 size={14} className="text-slate-300 dark:text-slate-600 mx-auto" />
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{record.diseaseName || '-'}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getSyncStatusBadge(record.syncStatus)}`}>{record.syncStatus}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {record.warningTriggered ? <AlertTriangle size={14} className="text-amber-500 mx-auto" /> : <span className="text-xs text-slate-400">-</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                {record.autoReported ? <CheckCircle2 size={14} className="text-emerald-500 mx-auto" /> : <span className="text-xs text-slate-400">-</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 8: Sync Logs */}
        <TabsContent value="sync-logs">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">同步日志</span>
            </div>
            {syncLogLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
              </div>
            ) : filteredSyncLogs.length === 0 ? (
              <Card className="py-8">
                <CardContent className="text-center text-slate-500 dark:text-slate-400 text-sm">
                  <Clock size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="mt-2">暂无同步日志记录</p>
                  <p className="text-xs mt-1">预警引擎触发后将在此显示同步记录</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredSyncLogs.map((log: SyncLogRecord) => (
                  <Card key={log.id} className="py-3 gap-1">
                    <CardContent className="p-4 pt-0">
                      <div className="text-sm font-medium">{log.ruleName}</div>
                      <div className="text-xs text-slate-500 mt-1">{log.triggerSource} - {log.status}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Field Mapping Dialog */}
      <Dialog open={!!editMapping} onOpenChange={(open) => !open && setEditMapping(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={18} className="text-emerald-600" />
              编辑字段映射
            </DialogTitle>
            <DialogDescription>修改HIS字段映射配置，保存后将更新数据库</DialogDescription>
          </DialogHeader>
          {editMapping && (
            <FieldMappingForm
              mapping={editMapping}
              onSave={(data) => handleSaveMapping(data, false)}
              onCancel={() => setEditMapping(null)}
              saving={mappingSaving}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Field Mapping Dialog */}
      <Dialog open={addMappingOpen} onOpenChange={setAddMappingOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus size={18} className="text-emerald-600" />
              新增字段映射
            </DialogTitle>
            <DialogDescription>为当前业务场景添加新的字段映射配置</DialogDescription>
          </DialogHeader>
          <FieldMappingForm
            mapping={{ id: '', systemField: '', systemLabel: '', dataType: 'String', length: 50, required: false, hisField: '', hisTable: '', transformRule: '', specialLogic: '', validationRule: '', consistencyRisk: '' }}
            onSave={(data) => handleSaveMapping(data, true)}
            onCancel={() => setAddMappingOpen(false)}
            saving={mappingSaving}
            isNew
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteMapping} onOpenChange={(open) => !open && setDeleteMapping(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 size={18} />
              确认删除
            </DialogTitle>
            <DialogDescription>此操作将删除该字段映射配置，删除后不可恢复</DialogDescription>
          </DialogHeader>
          {deleteMapping && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-sm font-medium text-red-800 dark:text-red-300">字段: {deleteMapping.systemLabel} ({deleteMapping.systemField})</div>
                <div className="text-xs text-red-600 dark:text-red-400 mt-1">HIS字段: {deleteMapping.hisField || '未配置'}</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteMapping(null)}>取消</Button>
                <Button variant="destructive" onClick={() => handleDeleteMapping(deleteMapping.id)}>确认删除</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conversion Test Dialog */}
      <Dialog open={!!conversionTest} onOpenChange={(open) => !open && setConversionTest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TestTube size={18} className="text-emerald-600" />
              测试转换规则
            </DialogTitle>
            <DialogDescription>
              {conversionTest ? `${conversionTest.sourceFormat} → ${conversionTest.targetFormat}` : ''}
            </DialogDescription>
          </DialogHeader>
          {conversionTest && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 rounded px-3 py-2">
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">转换函数</div>
                <code className="text-xs text-purple-700 dark:text-purple-400 break-all">{conversionTest.conversionFunction}</code>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">输入值</Label>
                <Input
                  value={conversionTestInput}
                  onChange={(e) => setConversionTestInput(e.target.value)}
                  placeholder="输入测试值..."
                  onKeyDown={(e) => e.key === 'Enter' && runConversionTest()}
                />
              </div>
              <Button onClick={runConversionTest} disabled={!conversionTestInput} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                <Play size={14} className="mr-1.5" /> 执行转换
              </Button>
              {conversionTestOutput && (
                <div className="space-y-1">
                  <Label className="text-sm">输出结果</Label>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <code className="text-sm text-emerald-700 dark:text-emerald-400">{conversionTestOutput}</code>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Temperature Record Detail Dialog */}
      <Dialog open={!!detailRecord} onOpenChange={(open) => !open && setDetailRecord(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Thermometer size={18} className="text-amber-600" />
              体温记录详情
            </DialogTitle>
            <DialogDescription>查看体温测量详细信息和发热判定结果</DialogDescription>
          </DialogHeader>
          {detailRecord && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">患者姓名</div>
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{detailRecord.patientName}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">患者编号</div>
                  <div className="text-sm font-mono text-slate-700 dark:text-slate-300">{detailRecord.patientId}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">科室</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{detailRecord.dept}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">床号</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{detailRecord.bedNo}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">体温</div>
                  <div className={`text-lg font-bold ${getTempColor(detailRecord.temperature)}`}>{detailRecord.temperature}℃</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">测量途径</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{detailRecord.measureRoute}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">测量时间</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{new Date(detailRecord.measureTime).toLocaleString('zh-CN')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">数据来源</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{detailRecord.dataSource}</div>
                </div>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">发热分级:</span>
                  <Badge variant="outline" className={`text-xs ${getFeverLevelBadge(detailRecord.feverLevel)}`}>{detailRecord.feverLevel}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">异常体温:</span>
                  <Badge variant="outline" className={`text-xs ${detailRecord.isAbnormal ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                    {detailRecord.isAbnormal ? '是' : '否'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">症状监测上报:</span>
                  {detailRecord.isReported ? (
                    <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">已上报</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">未上报</Badge>
                  )}
                </div>
              </div>
              {!detailRecord.isReported && detailRecord.isFever && warningConfig.autoReportEnabled && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">该患者体温达到发热标准但尚未上报症状监测，建议尽快处理</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* HIS Data Sync Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw size={18} className={syncing ? 'animate-spin text-emerald-500' : 'text-emerald-600'} />
              同步HIS体温数据
            </DialogTitle>
            <DialogDescription>从HIS护理系统获取最新体温数据</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {syncing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Loader2 size={16} className="animate-spin text-emerald-500" />
                  正在从HIS护理系统同步数据...
                </div>
                <Progress value={syncProgress} className="h-2" />
                <div className="text-xs text-slate-500 dark:text-slate-400 text-right">{syncProgress}%</div>
              </div>
            ) : syncResult ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 size={18} /> 同步完成
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-sky-700 dark:text-sky-400">{syncResult.syncedRecords}</div>
                    <div className="text-xs text-sky-600 dark:text-sky-500">同步记录数</div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{syncResult.warningsTriggered}</div>
                    <div className="text-xs text-amber-600 dark:text-amber-500">触发预警数</div>
                  </div>
                </div>
                {syncResult.warningsTriggered > 0 && (
                  <Button onClick={() => { setSyncDialogOpen(false); setActiveMenu('id-symptom-surveillance'); }} variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400">
                    <Eye size={14} className="mr-1.5" /> 查看症状监测
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Health Check Dialog */}
      <Dialog open={healthCheckOpen} onOpenChange={setHealthCheckOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart size={18} className="text-rose-600" />
              映射健康检查
            </DialogTitle>
            <DialogDescription>分析所有字段映射的完整性和风险状况</DialogDescription>
          </DialogHeader>
          {healthCheckLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-emerald-500" />
            </div>
          ) : healthCheckResult ? (
            <div className="space-y-4">
              {/* Score indicator */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <div className="relative">
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-slate-700" />
                    <circle cx="40" cy="40" r="35" fill="none" strokeWidth="6" strokeLinecap="round"
                      className={healthCheckResult.score >= 80 ? 'text-emerald-500' : healthCheckResult.score >= 60 ? 'text-amber-500' : 'text-red-500'}
                      stroke="currentColor"
                      strokeDasharray={`${(healthCheckResult.score / 100) * 220} 220`}
                      transform="rotate(-90 40 40)"
                    />
                    <text x="40" y="45" textAnchor="middle" className={`text-lg font-bold ${healthCheckResult.score >= 80 ? 'fill-emerald-600 dark:fill-emerald-400' : healthCheckResult.score >= 60 ? 'fill-amber-600 dark:fill-amber-400' : 'fill-red-600 dark:fill-red-400'}`}>
                      {healthCheckResult.score}
                    </text>
                  </svg>
                </div>
                <div>
                  <div className={`text-lg font-bold ${healthCheckResult.score >= 80 ? 'text-emerald-700 dark:text-emerald-400' : healthCheckResult.score >= 60 ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'}`}>
                    {healthCheckResult.score >= 80 ? '健康状态良好' : healthCheckResult.score >= 60 ? '需要关注' : '存在严重问题'}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    发现 {healthCheckResult.issues.length} 个问题
                    （高 {healthCheckResult.issues.filter(i => i.severity === '高').length}
                    / 中 {healthCheckResult.issues.filter(i => i.severity === '中').length}
                    / 低 {healthCheckResult.issues.filter(i => i.severity === '低').length}）
                  </div>
                </div>
              </div>

              {/* Issues grouped by severity */}
              {['高', '中', '低'].map(severity => {
                const severityIssues = healthCheckResult.issues.filter(i => i.severity === severity);
                if (severityIssues.length === 0) return null;
                return (
                  <div key={severity}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={`text-xs ${getSeverityBadge(severity)}`}>
                        {severity}风险 ({severityIssues.length})
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {severityIssues.map((issue, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getSeverityColor(issue.severity)}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {issue.category}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400">
                                {issue.scenario}
                              </Badge>
                              <code className="text-[10px] text-slate-500 dark:text-slate-400">{issue.field}</code>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">{issue.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {healthCheckResult.issues.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                  <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500" />
                  所有字段映射状态正常，未发现问题
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Mapping Diagram Component
function MappingDiagram({
  fields,
  scenarioName,
  onFieldClick,
}: {
  fields: FieldMapping[];
  scenarioName: string;
  onFieldClick: (field: FieldMapping) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgWidth = 900;
  const rowHeight = 32;
  const headerHeight = 40;
  const leftX = 10;
  const rightX = svgWidth - 10;
  const midX = svgWidth / 2;
  const fieldBoxWidth = 180;
  const svgHeight = Math.max(300, headerHeight + fields.length * rowHeight + 20);

  const getLineColor = (field: FieldMapping) => {
    if (field.required && !field.hisField) return '#ef4444'; // red for required unmapped
    if (!field.hisField) return '#cbd5e1'; // gray for unmapped
    if (field.consistencyRisk) return '#f59e0b'; // amber for risk
    return '#10b981'; // emerald for mapped
  };

  const getLineColorDark = (field: FieldMapping) => {
    if (field.required && !field.hisField) return '#f87171';
    if (!field.hisField) return '#475569';
    if (field.consistencyRisk) return '#fbbf24';
    return '#34d399';
  };

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ minWidth: svgWidth }}>
      {/* Background */}
      <rect x="0" y="0" width={svgWidth} height={svgHeight} rx="8" className="fill-white dark:fill-slate-900" />

      {/* Headers */}
      <rect x={leftX} y="5" width={fieldBoxWidth} height="28" rx="4" className="fill-emerald-100 dark:fill-emerald-900/40" />
      <text x={leftX + fieldBoxWidth / 2} y="24" textAnchor="middle" className="text-xs font-semibold fill-emerald-700 dark:fill-emerald-400">系统字段</text>

      <rect x={rightX - fieldBoxWidth} y="5" width={fieldBoxWidth} height="28" rx="4" className="fill-purple-100 dark:fill-purple-900/40" />
      <text x={rightX - fieldBoxWidth / 2} y="24" textAnchor="middle" className="text-xs font-semibold fill-purple-700 dark:fill-purple-400">HIS字段</text>

      {/* Center label */}
      <text x={midX} y="24" textAnchor="middle" className="text-[10px] fill-slate-400 dark:fill-slate-500">{scenarioName}</text>

      {/* Connection lines */}
      {fields.map((field, idx) => {
        const y = headerHeight + idx * rowHeight + rowHeight / 2;
        const leftEdge = leftX + fieldBoxWidth;
        const rightEdge = rightX - fieldBoxWidth;
        const isHovered = hoveredIdx === idx;
        const lineColor = typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? getLineColorDark(field) : getLineColor(field);
        return (
          <g key={`line-${field.id}`}>
            <path
              d={`M ${leftEdge} ${y} C ${leftEdge + 80} ${y}, ${rightEdge - 80} ${y}, ${rightEdge} ${y}`}
              fill="none"
              stroke={lineColor}
              strokeWidth={isHovered ? 2.5 : 1.5}
              strokeDasharray={field.hisField ? 'none' : '4,3'}
              opacity={isHovered ? 1 : 0.7}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onFieldClick(field)}
            />
            {isHovered && field.transformRule && (
              <g>
                <rect x={midX - 70} y={y - 22} width="140" height="18" rx="4" className="fill-slate-800 dark:fill-slate-200" />
                <text x={midX} y={y - 10} textAnchor="middle" className="text-[9px] fill-white dark:fill-slate-900">
                  {field.transformRule.length > 16 ? field.transformRule.substring(0, 16) + '...' : field.transformRule}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* System field labels */}
      {fields.map((field, idx) => {
        const y = headerHeight + idx * rowHeight + rowHeight / 2;
        const isHovered = hoveredIdx === idx;
        const hasIssue = field.required && !field.hisField;
        return (
          <g key={`sys-${field.id}`} className="cursor-pointer" onClick={() => onFieldClick(field)} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
            <rect x={leftX} y={y - 12} width={fieldBoxWidth} height="24" rx="4"
              className={isHovered ? 'fill-emerald-50 dark:fill-emerald-900/30' : hasIssue ? 'fill-red-50 dark:fill-red-900/20' : 'fill-slate-50 dark:fill-slate-800/50'}
              stroke={isHovered ? '#10b981' : hasIssue ? '#ef4444' : '#e2e8f0'}
              strokeWidth="0.5"
            />
            <text x={leftX + 8} y={y + 1} className="text-[10px] font-medium fill-slate-700 dark:fill-slate-300">
              {field.systemLabel}
            </text>
            <text x={leftX + 8} y={y + 10} className="text-[8px] font-mono fill-slate-400 dark:fill-slate-500">
              {field.systemField}
            </text>
            {field.required && (
              <circle cx={leftX + fieldBoxWidth - 8} cy={y} r="3" fill="#ef4444" />
            )}
          </g>
        );
      })}

      {/* HIS field labels */}
      {fields.map((field, idx) => {
        const y = headerHeight + idx * rowHeight + rowHeight / 2;
        const isHovered = hoveredIdx === idx;
        const isMapped = !!field.hisField;
        return (
          <g key={`his-${field.id}`} className="cursor-pointer" onClick={() => onFieldClick(field)} onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}>
            <rect x={rightX - fieldBoxWidth} y={y - 12} width={fieldBoxWidth} height="24" rx="4"
              className={isHovered ? 'fill-purple-50 dark:fill-purple-900/30' : isMapped ? 'fill-slate-50 dark:fill-slate-800/50' : 'fill-slate-100/50 dark:fill-slate-800/20'}
              stroke={isHovered ? '#8b5cf6' : '#e2e8f0'}
              strokeWidth="0.5"
            />
            {isMapped ? (
              <>
                <text x={rightX - fieldBoxWidth + 8} y={y + 1} className="text-[10px] font-medium fill-purple-700 dark:fill-purple-400">
                  {field.hisField}
                </text>
                {field.hisTable && (
                  <text x={rightX - fieldBoxWidth + 8} y={y + 10} className="text-[8px] font-mono fill-slate-400 dark:fill-slate-500">
                    {field.hisTable}
                  </text>
                )}
              </>
            ) : (
              <text x={rightX - fieldBoxWidth + 8} y={y + 3} className="text-[10px] fill-slate-400 dark:fill-slate-600 italic">
                未映射
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// Field Mapping Form Component
function FieldMappingForm({
  mapping,
  onSave,
  onCancel,
  saving,
  isNew = false,
}: {
  mapping: FieldMapping;
  onSave: (data: Partial<FieldMapping>) => void;
  onCancel: () => void;
  saving: boolean;
  isNew?: boolean;
}) {
  const [form, setForm] = useState<Partial<FieldMapping>>({ ...mapping });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">系统字段名</Label>
          <Input
            value={form.systemField || ''}
            onChange={(e) => setForm(prev => ({ ...prev, systemField: e.target.value }))}
            disabled={!isNew}
            className="h-8 text-sm"
            placeholder="如: patientName"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">中文名称</Label>
          <Input
            value={form.systemLabel || ''}
            onChange={(e) => setForm(prev => ({ ...prev, systemLabel: e.target.value }))}
            className="h-8 text-sm"
            placeholder="如: 患者姓名"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">数据类型</Label>
          <Select value={form.dataType || 'String'} onValueChange={(v) => setForm(prev => ({ ...prev, dataType: v }))}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="String">String</SelectItem>
              <SelectItem value="Int">Int</SelectItem>
              <SelectItem value="Float">Float</SelectItem>
              <SelectItem value="DateTime">DateTime</SelectItem>
              <SelectItem value="Enum">Enum</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">长度</Label>
          <Input
            type="number"
            value={form.length ?? 50}
            onChange={(e) => setForm(prev => ({ ...prev, length: parseInt(e.target.value) || 50 }))}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">HIS字段</Label>
          <Input
            value={form.hisField || ''}
            onChange={(e) => setForm(prev => ({ ...prev, hisField: e.target.value }))}
            className="h-8 text-sm font-mono"
            placeholder="如: PAT_NAME"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">HIS表</Label>
          <Input
            value={form.hisTable || ''}
            onChange={(e) => setForm(prev => ({ ...prev, hisTable: e.target.value }))}
            className="h-8 text-sm font-mono"
            placeholder="如: PAT_INFO"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">转换规则</Label>
        <Textarea
          value={form.transformRule || ''}
          onChange={(e) => setForm(prev => ({ ...prev, transformRule: e.target.value }))}
          className="text-sm min-h-[60px]"
          placeholder="描述数据转换规则..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium">特殊逻辑</Label>
        <Textarea
          value={form.specialLogic || ''}
          onChange={(e) => setForm(prev => ({ ...prev, specialLogic: e.target.value }))}
          className="text-sm min-h-[60px]"
          placeholder="描述特殊处理逻辑..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium">校验规则</Label>
          <Input
            value={form.validationRule || ''}
            onChange={(e) => setForm(prev => ({ ...prev, validationRule: e.target.value }))}
            className="h-8 text-sm"
            placeholder="如: 非空校验"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-medium">一致性风险</Label>
          <Input
            value={form.consistencyRisk || ''}
            onChange={(e) => setForm(prev => ({ ...prev, consistencyRisk: e.target.value }))}
            className="h-8 text-sm"
            placeholder="如: HIS与系统编码不一致"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div>
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">必填字段</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">该字段为系统必填项</div>
        </div>
        <Switch
          checked={form.required ?? false}
          onCheckedChange={(checked) => setForm(prev => ({ ...prev, required: checked }))}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>取消</Button>
        <Button onClick={() => onSave(form)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
          保存
        </Button>
      </DialogFooter>
    </div>
  );
}
