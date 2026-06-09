'use client';

import { useState, useEffect } from 'react';
import {
  GitMerge, AlertTriangle, CheckCircle2, XCircle, ArrowRight,
  Database, FileText, Shield, Table2, AlertOctagon, Info, Loader2,
  ChevronRight, ArrowLeftRight, Calendar, Code2, Binary, SlidersHorizontal
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

interface HISMappingData {
  businessScenarios: BusinessScenario[];
  fieldMappings: Record<string, FieldMapping[]>;
  conversionRules: ConversionRule[];
  validationRules: ValidationRule[];
  consistencyIssues: ConsistencyIssue[];
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

export default function HISIntegrationAnalysisPage() {
  const [data, setData] = useState<HISMappingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState('infection-case');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch('/api/his-mapping')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
                          {/* Source → Target */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-mono bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800">
                              {rule.sourceFormat}
                            </Badge>
                            <ArrowRight size={14} className="text-slate-400 shrink-0" />
                            <Badge variant="outline" className="text-xs font-mono bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                              {rule.targetFormat}
                            </Badge>
                          </div>
                          {/* Conversion function */}
                          <div className="bg-slate-50 dark:bg-slate-800 rounded px-3 py-2">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">转换函数</div>
                            <code className="text-xs text-purple-700 dark:text-purple-400 break-all">{rule.conversionFunction}</code>
                          </div>
                          {/* Example */}
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
            {/* Issue severity summary */}
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
                    {/* Severity indicator */}
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${getSeverityColor(issue.severity)}`} />

                    <div className="flex-1 space-y-2 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getSeverityBadge(issue.severity)}`}>
                          {issue.severity}风险
                        </Badge>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {issue.category}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-800 dark:text-slate-200">{issue.description}</p>

                      {/* Affected fields */}
                      <div className="flex items-start gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">影响字段:</span>
                        <code className="text-xs font-mono text-sky-700 dark:text-sky-400">{issue.affectedFields}</code>
                      </div>

                      {/* Solution */}
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
      </Tabs>
    </div>
  );
}
