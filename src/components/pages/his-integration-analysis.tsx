'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GitMerge, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  Database, FileText, Shield, Table2, AlertOctagon, Info, Loader2,
  ChevronRight, ArrowLeftRight, Calendar, Code2, Binary, SlidersHorizontal,
  Thermometer, RefreshCw, Save, Users, Activity, TrendingUp, Eye
} from 'lucide-react';
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
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
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

// Warning config type
interface WarningConfig {
  autoReportEnabled: boolean;
  feverThreshold: number;
  reportFeverLevel: string;
  targetDepts: string[];
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

// Data type badge color
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

// Severity color
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

// Rule type badge
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

// Category icon
function getCategoryIcon(category: string) {
  switch (category) {
    case '日期格式转换': return <Calendar size={16} className="text-purple-500" />;
    case '代码映射': return <Code2 size={16} className="text-emerald-500" />;
    case '数据类型转换': return <Binary size={16} className="text-sky-500" />;
    case '值域映射': return <SlidersHorizontal size={16} className="text-amber-500" />;
    default: return <ArrowLeftRight size={16} className="text-slate-500" />;
  }
}

// Temperature color
function getTempColor(temp: number) {
  if (temp >= 39) return 'text-red-600 dark:text-red-400 font-bold';
  if (temp >= 38) return 'text-orange-600 dark:text-orange-400 font-semibold';
  if (temp >= 37.3) return 'text-amber-600 dark:text-amber-400 font-medium';
  return 'text-slate-700 dark:text-slate-300';
}

// Fever level badge
function getFeverLevelBadge(level: string) {
  switch (level) {
    case '高热': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    case '超高热': return 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-300 border-red-300 dark:border-red-700';
    case '中度发热': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    case '低热': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
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

  // Y-axis labels
  const yLabels = [36.0, 36.5, 37.0, 37.5, 38.0, 38.5, 39.0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: '240px' }}>
      {/* Background */}
      <rect x={padding.left} y={padding.top} width={chartW} height={chartH}
        className="fill-slate-50 dark:fill-slate-800/50" rx="2" />

      {/* Grid lines */}
      {yLabels.map(temp => (
        <line key={temp} x1={padding.left} y1={scaleY(temp)} x2={width - padding.right} y2={scaleY(temp)}
          className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}

      {/* Y-axis labels */}
      {yLabels.map(temp => (
        <text key={temp} x={padding.left - 5} y={scaleY(temp) + 3} textAnchor="end"
          className="fill-slate-500 dark:fill-slate-400 text-[10px]">
          {temp.toFixed(1)}℃
        </text>
      ))}

      {/* X-axis labels */}
      {trend.map((d, i) => (
        <text key={d.date} x={scaleX(i)} y={height - 5} textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400 text-[10px]">
          {d.date}
        </text>
      ))}

      {/* Fever threshold line */}
      <line x1={padding.left} y1={thresholdY} x2={width - padding.right} y2={thresholdY}
        className="stroke-red-500" strokeWidth="1.5" strokeDasharray="6,3" />
      <text x={width - padding.right + 3} y={thresholdY + 3}
        className="fill-red-500 dark:fill-red-400 text-[9px] font-medium">
        {threshold}℃
      </text>

      {/* Area fill */}
      <polygon points={areaPoints} className="fill-emerald-100 dark:fill-emerald-900/20" />

      {/* Line */}
      <polyline points={points} className="fill-none stroke-emerald-500 dark:stroke-emerald-400" strokeWidth="2" />

      {/* Data points */}
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

// Department list fallback
const ALL_DEPTS_FALLBACK = ['ICU', '呼吸科', '神经外科', '肝胆外科', '骨科', '肿瘤科', '血液科', '肾内科', '心内科', '普外科'];

export default function HISIntegrationAnalysisPage() {
  const { getDeptNames, getSystemConfig } = useConfigStore();
  const ALL_DEPTS = getDeptNames().length > 0 ? getDeptNames() : ALL_DEPTS_FALLBACK;
  const [data, setData] = useState<HISMappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState('infection-case');
  const [activeTab, setActiveTab] = useState('overview');

  // Temperature tab state
  const [tempStats, setTempStats] = useState<TemperatureStats | null>(null);
  const [tempLoading, setTempLoading] = useState(false);
  const [tempRecords, setTempRecords] = useState<TempRecord[]>([]);
  const [tempPage, setTempPage] = useState(1);
  const tempPageSize = 10;

  // Load warning config from localStorage
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
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      autoReportEnabled: true,
      feverThreshold: 38.0,
      reportFeverLevel: '中度发热',
      targetDepts: [],
    };
  });

  const [configSaving, setConfigSaving] = useState(false);

  // Sync dialog
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{ syncedRecords: number; warningsTriggered: number } | null>(null);

  // Detail dialog
  const [detailRecord, setDetailRecord] = useState<TempRecord | null>(null);

  // Store
  const setActiveMenu = useAppStore(s => s.setActiveMenu);

  // Fetch main data
  useEffect(() => {
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

  // Save warning config
  const saveWarningConfig = async () => {
    setConfigSaving(true);
    await new Promise(r => setTimeout(r, 500));
    localStorage.setItem('hims-temperature-warning-config', JSON.stringify(warningConfig));
    setConfigSaving(false);
  };

  // Sync HIS data
  const handleSync = async () => {
    setSyncDialogOpen(true);
    setSyncing(true);
    setSyncProgress(0);
    setSyncResult(null);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 300);

    try {
      const res = await fetch('/api/temperature-records/sync', { method: 'POST' });
      const result = await res.json();
      clearInterval(progressInterval);
      setSyncProgress(100);
      setSyncResult({ syncedRecords: result.syncedRecords, warningsTriggered: result.warningsTriggered });
      setSyncing(false);
      // Refresh stats
      fetchTempStats();
    } catch {
      clearInterval(progressInterval);
      setSyncProgress(100);
      setSyncResult({ syncedRecords: 0, warningsTriggered: 0 });
      setSyncing(false);
    }
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

  // Temperature pagination
  const totalPages = Math.ceil(tempRecords.length / tempPageSize);
  const pagedRecords = tempRecords.slice((tempPage - 1) * tempPageSize, tempPage * tempPageSize);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
          <GitMerge size={22} className="text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">HIS对接分析</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">医院信息系统集成映射配置与数据一致性分析</p>
        </div>
      </div>

      {/* Summary Stats Bar */}
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
          <Card key={stat.label} className="py-3 gap-2">
            <CardContent className="p-3 pt-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">业务场景总览</TabsTrigger>
          <TabsTrigger value="mapping" className="text-xs sm:text-sm">字段映射详情</TabsTrigger>
          <TabsTrigger value="conversion" className="text-xs sm:text-sm">数据格式转换</TabsTrigger>
          <TabsTrigger value="validation" className="text-xs sm:text-sm">校验规则汇总</TabsTrigger>
          <TabsTrigger value="consistency" className="text-xs sm:text-sm">一致性问题</TabsTrigger>
          <TabsTrigger value="temperature" className="text-xs sm:text-sm">
            <Thermometer size={14} className="mr-1" />
            体温表对接
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Business Scenario Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {businessScenarios.map((scenario) => (
              <Card key={scenario.id} className="hover:shadow-md transition-shadow py-4 gap-3">
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
                <CardContent className="px-4 pb-2 space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">{scenario.description}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                      <Database size={12} /> {scenario.module}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-emerald-700 dark:text-emerald-400">
                      <FileText size={12} /> {scenario.hisSystem}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-sky-50 dark:bg-sky-900/20 px-2 py-0.5 rounded text-sky-700 dark:text-sky-400">
                      <Table2 size={12} /> {(fieldMappings[scenario.id] || []).length}个字段
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedScenario(scenario.id); setActiveTab('mapping'); }}
                    className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                  >
                    查看字段映射 <ChevronRight size={12} />
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Field Mapping Details */}
        <TabsContent value="mapping">
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">选择业务场景:</span>
                <Select value={selectedScenario} onValueChange={setSelectedScenario}>
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
            </div>

            <Card className="py-4 gap-0">
              <ScrollArea className="w-full">
                <div className="min-w-[1200px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentFields.map((field, idx) => (
                        <TableRow key={field.systemField} className={idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
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
                          <TableCell className="font-mono text-xs text-purple-700 dark:text-purple-400">{field.hisField}</TableCell>
                          <TableCell className="font-mono text-xs text-slate-600 dark:text-slate-400">{field.hisTable}</TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[200px]">
                            <span className="line-clamp-2">{field.transformRule}</span>
                          </TableCell>
                          <TableCell className="text-xs text-amber-700 dark:text-amber-400 max-w-[180px]">
                            <span className="line-clamp-2">{field.specialLogic || '-'}</span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 dark:text-slate-400 max-w-[150px]">
                            <span className="line-clamp-2">{field.validationRule}</span>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Data Format Conversion */}
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
                      <Card key={idx} className="py-3 gap-2">
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
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">示例:</span>
                            <code className="bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded">{rule.example}</code>
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

        {/* Tab 4: Validation Rules Summary */}
        <TabsContent value="validation">
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
                    {validationRules.map((rule, idx) => (
                      <TableRow key={idx} className={idx % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/30'}>
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
        </TabsContent>

        {/* Tab 5: Consistency Issues */}
        <TabsContent value="consistency">
          <div className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              {['高', '中', '低'].map((sev) => {
                const count = consistencyIssues.filter(i => i.severity === sev).length;
                return (
                  <div key={sev} className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(sev)}`} />
                    <span className="text-slate-600 dark:text-slate-400">{sev}风险: {count}项</span>
                  </div>
                );
              })}
            </div>

            {consistencyIssues.map((issue, idx) => (
              <Card key={idx} className="py-3 gap-2">
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
            ))}
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
              {/* A. Temperature Data Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '总记录数', value: tempStats?.totalRecords ?? 0, icon: <Database size={16} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: '发热人数', value: tempStats?.feverCount ?? 0, icon: <Thermometer size={16} />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: '异常体温', value: tempStats?.abnormalCount ?? 0, icon: <Activity size={16} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: '已上报症状监测', value: tempStats?.reportedCount ?? 0, icon: <CheckCircle2 size={16} />, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' },
                ].map((stat) => (
                  <Card key={stat.label} className="py-3 gap-2">
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                          <span className={stat.color}>{stat.icon}</span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span>
                      </div>
                      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{stat.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* B. Smart Warning Rule Configuration */}
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
                    {/* Auto-report toggle */}
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

                    {/* Fever threshold */}
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

                    {/* Fever level for reporting */}
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">触发上报发热分级</div>
                      <Select
                        value={warningConfig.reportFeverLevel}
                        onValueChange={(value) => setWarningConfig(prev => ({ ...prev, reportFeverLevel: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="低热">低热 (37.3-37.9℃)</SelectItem>
                          <SelectItem value="中度发热">中度发热 (38.0-38.9℃)</SelectItem>
                          <SelectItem value="高热">高热 (39.0-40.9℃)</SelectItem>
                          <SelectItem value="超高热">超高热 (≥41.0℃)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Target departments */}
                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">目标科室（可选）</div>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_DEPTS.map(dept => {
                          const isSelected = warningConfig.targetDepts.includes(dept);
                          return (
                            <button
                              key={dept}
                              onClick={() => {
                                setWarningConfig(prev => ({
                                  ...prev,
                                  targetDepts: isSelected
                                    ? prev.targetDepts.filter(d => d !== dept)
                                    : [...prev.targetDepts, dept],
                                }));
                              }}
                              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                isSelected
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                              }`}
                            >
                              {dept}
                            </button>
                          );
                        })}
                      </div>
                      {warningConfig.targetDepts.length > 0 && (
                        <button
                          onClick={() => setWarningConfig(prev => ({ ...prev, targetDepts: [] }))}
                          className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
                        >
                          清除选择
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Info text */}
                  <div className="flex items-start gap-2 p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                    <Info size={16} className="text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-sky-700 dark:text-sky-300">
                      当HIS推送的体温数据超过设定阈值时，系统将自动创建症状监测记录，无需手动新增
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Button
                      onClick={saveWarningConfig}
                      disabled={configSaving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {configSaving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
                      保存配置
                    </Button>
                    <Button
                      onClick={handleSync}
                      variant="outline"
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
                    >
                      <RefreshCw size={14} className="mr-1.5" />
                      立即同步HIS数据
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* D. Temperature Trend Chart */}
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
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 bg-emerald-500 dark:bg-emerald-400" />
                      <span>平均体温</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-0.5 bg-red-500 border-dashed" style={{ borderTop: '2px dashed', height: 0 }} />
                      <span>发热阈值 ({warningConfig.feverThreshold}℃)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* C. Temperature Data Table */}
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
                              <TableCell className={`text-xs ${getTempColor(record.temperature)}`}>
                                {record.temperature}℃
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{record.measureRoute}</TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {new Date(record.measureTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getFeverLevelBadge(record.feverLevel)}`}>
                                  {record.feverLevel}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {record.isReported ? (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                                    已上报
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                    未上报
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 dark:text-slate-400">{record.dataSource}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </ScrollArea>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        第 {(tempPage - 1) * tempPageSize + 1}-{Math.min(tempPage * tempPageSize, tempRecords.length)} 条，共 {tempRecords.length} 条
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTempPage(p => Math.max(1, p - 1))}
                          disabled={tempPage === 1}
                          className="h-7 text-xs"
                        >
                          上一页
                        </Button>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {tempPage}/{totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setTempPage(p => Math.min(totalPages, p + 1))}
                          disabled={tempPage === totalPages}
                          className="h-7 text-xs"
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                  <div className={`text-lg font-bold ${getTempColor(detailRecord.temperature)}`}>
                    {detailRecord.temperature}℃
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">测量途径</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{detailRecord.measureRoute}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">测量时间</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    {new Date(detailRecord.measureTime).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 dark:text-slate-400">数据来源</div>
                  <div className="text-sm text-slate-700 dark:text-slate-300">{detailRecord.dataSource}</div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400">发热分级:</span>
                  <Badge variant="outline" className={`text-xs ${getFeverLevelBadge(detailRecord.feverLevel)}`}>
                    {detailRecord.feverLevel}
                  </Badge>
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
                    <Badge className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                      已上报
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      未上报
                    </Badge>
                  )}
                </div>
              </div>

              {!detailRecord.isReported && detailRecord.isFever && warningConfig.autoReportEnabled && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    该患者体温达到发热标准但尚未上报症状监测，建议尽快处理
                  </div>
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
                  <CheckCircle2 size={18} />
                  同步完成
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
                  <Button
                    onClick={() => {
                      setSyncDialogOpen(false);
                      setActiveMenu('id-symptom-surveillance');
                    }}
                    variant="outline"
                    className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-400 dark:text-emerald-400"
                  >
                    <Eye size={14} className="mr-1.5" />
                    查看症状监测
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
