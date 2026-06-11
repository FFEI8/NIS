'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { AnimatedCounter, CircularProgress } from '@/components/shared/animated';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable, Pagination } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  ArrowRightLeft, Plus, Save, RefreshCw, Search, Eye, Info,
  Database, AlertTriangle, CheckCircle2, XCircle, Download, Upload,
  ChevronDown, ChevronRight, Sparkles, Trash2, Power, PowerOff,
  Layers, GitBranch, FileDown, FileUp, Play, Zap, Minus,
  ChevronUp, Copy, BarChart3, Loader2, Inbox,
} from 'lucide-react';

// ============ Data type color mapping ============
const DATA_TYPE_MAP: Record<string, { label: string; color: string }> = {
  'String': { label: 'String', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  'Int': { label: 'Int', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  'Float': { label: 'Float', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  'DateTime': { label: 'DateTime', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  'Enum': { label: 'Enum', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const DATA_TYPE_OPTIONS = ['String', 'Int', 'Float', 'DateTime', 'Enum'];

// ============ Name Similarity Matcher ============
function calculateSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.toLowerCase().replace(/[_\-\s]/g, '');
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  // Levenshtein-based similarity
  const matrix: number[][] = [];
  for (let i = 0; i <= na.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= nb.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= na.length; i++) {
    for (let j = 1; j <= nb.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (na[i - 1] === nb[j - 1] ? 0 : 1)
      );
    }
  }
  const maxLen = Math.max(na.length, nb.length);
  return maxLen === 0 ? 1 : 1 - matrix[na.length][nb.length] / maxLen;
}

function suggestHISField(systemField: string, existingMappings: any[]): string[] {
  // Convert camelCase to UPPER_SNAKE_CASE patterns
  const patterns: string[] = [];
  // Pattern 1: direct uppercase
  patterns.push(systemField.toUpperCase());
  // Pattern 2: camelCase → UPPER_SNAKE_CASE
  const snake = systemField.replace(/([A-Z])/g, '_$1').toUpperCase().replace(/^_/, '');
  patterns.push(snake);
  // Pattern 3: with common prefixes
  patterns.push('PAT_' + snake);
  patterns.push('V_' + snake);
  // Collect all HIS fields from existing mappings
  const allHISFields = existingMappings.map(m => m.hisField).filter(Boolean) as string[];
  // Score each candidate
  const scored: { field: string; score: number }[] = [];
  for (const pattern of patterns) {
    for (const his of allHISFields) {
      const score = calculateSimilarity(pattern, his);
      if (score > 0.4) scored.push({ field: his, score });
    }
    // Also add the pattern itself as a suggestion
    scored.push({ field: pattern, score: 0.5 });
  }
  // Deduplicate and sort
  const seen = new Set<string>();
  const results: string[] = [];
  scored.sort((a, b) => b.score - a.score);
  for (const s of scored) {
    if (!seen.has(s.field) && s.field !== systemField) {
      seen.add(s.field);
      results.push(s.field);
    }
  }
  return results.slice(0, 5);
}

// ============ Mapping Detail Dialog ============
function MappingDetailDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: any }) {
  if (!item) return null;

  const sections = [
    {
      title: '系统字段信息', icon: <Database size={14} className="text-emerald-500" />, fields: [
        { label: '系统字段名', value: item.systemField },
        { label: '系统字段标签', value: item.systemLabel },
        { label: '数据类型', value: item.dataType, badge: DATA_TYPE_MAP[item.dataType] },
        { label: '字段长度', value: item.length },
        { label: '是否必填', value: item.required === 1 ? '是' : '否', badge: item.required === 1 ? { color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' } : null },
      ]
    },
    {
      title: 'HIS对应信息', icon: <ArrowRightLeft size={14} className="text-sky-500" />, fields: [
        { label: 'HIS字段名', value: item.hisField || '-' },
        { label: 'HIS表名', value: item.hisTable || '-' },
      ]
    },
    {
      title: '规则配置', icon: <Info size={14} className="text-amber-500" />, fields: [
        { label: '转换规则', value: item.transformRule || '-' },
        { label: '特殊处理逻辑', value: item.specialLogic || '-' },
        { label: '校验规则', value: item.validationRule || '-' },
      ]
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye size={20} className="text-emerald-500" /> 字段映射详情
          </DialogTitle>
          <DialogDescription>查看HIS字段映射的完整配置信息</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{item.systemLabel}</div>
              <div className="text-xs text-slate-500 mt-0.5">字段: {item.systemField} · 场景: {item.scenarioId}</div>
            </div>
            <div className="flex gap-2">
              <Badge className={item.status === 1 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}>
                {item.status === 1 ? '已启用' : '已禁用'}
              </Badge>
            </div>
          </div>
          {sections.map((section, si) => (
            <div key={si} className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                {section.icon} {section.title}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {section.fields.map((field, fi) => (
                  <div key={fi} className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
                    <div className="text-[10px] text-slate-400 mb-1">{field.label}</div>
                    {field.badge ? (
                      <Badge className={`text-[10px] ${field.badge.color}`}>{field.value}</Badge>
                    ) : (
                      <span className="text-sm text-slate-700 dark:text-slate-300">{field.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {item.consistencyRisk && (
            <div className="p-3 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">一致性风险</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">{item.consistencyRisk}</p>
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

// ============ Form Dialog ============
function MappingForm({ item, scenarios, allMappings, onSave, onClose }: {
  item?: any; scenarios: any[]; allMappings: any[]; onSave: (data: any) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    scenarioId: item?.scenarioId || '',
    systemField: item?.systemField || '',
    systemLabel: item?.systemLabel || '',
    dataType: item?.dataType || 'String',
    length: item?.length ?? 50,
    required: item?.required ?? 0,
    hisField: item?.hisField || '',
    hisTable: item?.hisTable || '',
    transformRule: item?.transformRule || '',
    specialLogic: item?.specialLogic || '',
    validationRule: item?.validationRule || '',
    consistencyRisk: item?.consistencyRisk || '',
    sort: item?.sort ?? 0,
    status: item?.status ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const updateField = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSuggest = () => {
    if (!form.systemField.trim()) return;
    const results = suggestHISField(form.systemField, allMappings);
    setSuggestions(results);
    setShowSuggestions(true);
  };

  const applySuggestion = (suggestion: string) => {
    updateField('hisField', suggestion);
    setShowSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!form.systemField.trim()) { setError('系统字段名不能为空'); return; }
    if (!form.systemLabel.trim()) { setError('系统字段标签不能为空'); return; }
    if (!form.scenarioId) { setError('请选择关联场景'); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-emerald-500" />
            {item ? '编辑字段映射' : '新建字段映射'}
          </DialogTitle>
          <DialogDescription>{item ? '修改HIS字段映射配置' : '配置系统字段与HIS字段的映射关系'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <XCircle size={14} /> {error}
            </div>
          )}

          {/* System field info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Database size={14} className="text-emerald-500" /> 系统字段信息
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">关联场景 <span className="text-red-500">*</span></label>
                <select value={form.scenarioId} onChange={e => updateField('scenarioId', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300" disabled={!!item}>
                  <option value="">请选择场景</option>
                  {scenarios.map(s => <option key={s.scenarioId} value={s.scenarioId}>{s.name} ({s.scenarioId})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">系统字段名 <span className="text-red-500">*</span></label>
                <Input value={form.systemField} onChange={e => updateField('systemField', e.target.value)}
                  placeholder="如: patientId" disabled={!!item} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">系统字段标签 <span className="text-red-500">*</span></label>
                <Input value={form.systemLabel} onChange={e => updateField('systemLabel', e.target.value)}
                  placeholder="如: 患者ID" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">数据类型</label>
                <select value={form.dataType} onChange={e => updateField('dataType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {DATA_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">字段长度</label>
                <Input type="number" value={form.length} onChange={e => updateField('length', parseInt(e.target.value) || 50)} min={1} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">是否必填</label>
                <select value={form.required} onChange={e => updateField('required', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <option value={0}>否</option>
                  <option value={1}>是</option>
                </select>
              </div>
            </div>
          </div>

          {/* HIS mapping info with suggestions */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ArrowRightLeft size={14} className="text-sky-500" /> HIS对应信息
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">HIS字段名</label>
                <div className="flex gap-1.5">
                  <Input value={form.hisField} onChange={e => updateField('hisField', e.target.value)}
                    placeholder="如: PATIENT_ID" className="flex-1" />
                  <Button type="button" variant="outline" size="sm" onClick={handleSuggest}
                    className="gap-1 text-amber-600 hover:text-amber-500 border-amber-200 dark:border-amber-800 shrink-0"
                    title="智能推荐HIS字段">
                    <Sparkles size={14} /> 推荐
                  </Button>
                </div>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => applySuggestion(s)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <Sparkles size={12} className="text-amber-500 shrink-0" />
                        <span className="font-mono">{s}</span>
                      </button>
                    ))}
                    <button type="button" onClick={() => setShowSuggestions(false)}
                      className="w-full text-center px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">关闭</button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">HIS表名</label>
                <Input value={form.hisTable} onChange={e => updateField('hisTable', e.target.value)}
                  placeholder="如: PAT_INFO" />
              </div>
            </div>
          </div>

          {/* Rules config */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info size={14} className="text-amber-500" /> 规则与风险配置
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">转换规则</label>
                <Input value={form.transformRule} onChange={e => updateField('transformRule', e.target.value)}
                  placeholder="如: 日期格式转换 yyyyMMdd→yyyy-MM-dd" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">校验规则</label>
                <Input value={form.validationRule} onChange={e => updateField('validationRule', e.target.value)}
                  placeholder="如: 非空校验、长度校验" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">特殊处理逻辑</label>
              <textarea value={form.specialLogic} onChange={e => updateField('specialLogic', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[48px]"
                placeholder="如: 科室代码映射、性别编码转换" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">一致性风险说明</label>
              <textarea value={form.consistencyRisk} onChange={e => updateField('consistencyRisk', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[48px]"
                placeholder="如: HIS编码与系统编码不一致的风险说明" />
            </div>
          </div>

          {/* Other */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">排序</label>
              <Input type="number" value={form.sort} onChange={e => updateField('sort', parseInt(e.target.value) || 0)} min={0} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">状态</label>
              <select value={form.status} onChange={e => updateField('status', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.systemField.trim() || !form.systemLabel.trim() || !form.scenarioId}
            className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Visual Mapping Diagram ============
function MappingDiagramDialog({ open, onClose, data, scenarios }: {
  open: boolean; onClose: () => void; data: any[]; scenarios: any[];
}) {
  // Group by scenario
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of data) {
      if (!map.has(item.scenarioId)) map.set(item.scenarioId, []);
      map.get(item.scenarioId)!.push(item);
    }
    return Array.from(map.entries()).map(([scenarioId, items]) => {
      const s = scenarios.find(sc => sc.scenarioId === scenarioId);
      return {
        scenarioId,
        name: s ? s.name : scenarioId,
        items: items.sort((a, b) => a.sort - b.sort),
      };
    });
  }, [data, scenarios]);

  const [selectedScenario, setSelectedScenario] = useState<string>(grouped[0]?.scenarioId || '');
  const currentGroup = grouped.find(g => g.scenarioId === selectedScenario);
  const items = currentGroup?.items || [];

  const mapped = items.filter(i => i.hisField);
  const unmapped = items.filter(i => !i.hisField);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch size={20} className="text-emerald-500" /> 映射关系图
          </DialogTitle>
          <DialogDescription>系统字段与HIS字段的映射关系可视化</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Scenario selector */}
          <div className="flex gap-2 flex-wrap">
            {grouped.map(g => (
              <button key={g.scenarioId} onClick={() => setSelectedScenario(g.scenarioId)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedScenario === g.scenarioId
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}>
                {g.name}
                <span className="ml-1.5 text-xs opacity-70">({g.items.length})</span>
              </button>
            ))}
          </div>

          {/* Diagram */}
          {items.length > 0 && (
            <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 overflow-x-auto">
              <svg width="100%" height={Math.max(items.length * 44 + 60, 200)} className="min-w-[600px]">
                {/* Headers */}
                <text x="100" y="24" textAnchor="middle" className="fill-emerald-600 dark:fill-emerald-400 text-sm font-semibold" fontSize="13">系统字段</text>
                <text x="500" y="24" textAnchor="middle" className="fill-sky-600 dark:fill-sky-400 text-sm font-semibold" fontSize="13">HIS字段</text>
                <line x1="50" y1="34" x2="200" y2="34" stroke="currentColor" className="text-emerald-300 dark:text-emerald-700" strokeWidth="1" />
                <line x1="400" y1="34" x2="600" y2="34" stroke="currentColor" className="text-sky-300 dark:text-sky-700" strokeWidth="1" />

                {items.map((item, index) => {
                  const y = 56 + index * 44;
                  const isMapped = !!item.hisField;
                  const isRequired = item.required === 1;
                  return (
                    <g key={item.id}>
                      {/* System field box */}
                      <rect x="30" y={y - 14} width="160" height="28" rx="6"
                        fill={isMapped ? 'rgb(16,185,129)' : isRequired ? 'rgb(239,68,68)' : 'rgb(245,158,11)'}
                        fillOpacity={0.12}
                        stroke={isMapped ? 'rgb(16,185,129)' : isRequired ? 'rgb(239,68,68)' : 'rgb(245,158,11)'}
                        strokeWidth="1.5" />
                      <text x="110" y={y + 4} textAnchor="middle" fontSize="11"
                        className="fill-slate-700 dark:fill-slate-300" fontFamily="monospace">
                        {item.systemField}
                      </text>
                      <text x="110" y={y - 20} textAnchor="middle" fontSize="9" className="fill-slate-400 dark:fill-slate-500">
                        {item.systemLabel}
                      </text>

                      {/* HIS field box */}
                      <rect x="400" y={y - 14} width="180" height="28" rx="6"
                        fill={isMapped ? 'rgb(14,165,233)' : 'transparent'}
                        fillOpacity={isMapped ? 0.12 : 0}
                        stroke={isMapped ? 'rgb(14,165,233)' : 'rgb(203,213,225)'}
                        strokeWidth={isMapped ? 1.5 : 1}
                        strokeDasharray={isMapped ? undefined : '4,3'} />
                      <text x="490" y={y + 4} textAnchor="middle" fontSize="11"
                        className={isMapped ? 'fill-sky-700 dark:fill-sky-300' : 'fill-slate-300 dark:fill-slate-600'}
                        fontFamily="monospace">
                        {isMapped ? item.hisField : '未映射'}
                      </text>

                      {/* Connection line */}
                      {isMapped ? (
                        <path d={`M 190 ${y} C 280 ${y}, 320 ${y}, 400 ${y}`}
                          stroke="rgb(16,185,129)" strokeWidth="1.5" fill="none" strokeOpacity="0.6" />
                      ) : (
                        <path d={`M 190 ${y} C 260 ${y}, 260 ${y + 10}, 260 ${y + 10} C 260 ${y + 10}, 260 ${y}, 400 ${y}`}
                          stroke="rgb(203,213,225)" strokeWidth="1" fill="none" strokeDasharray="3,3" strokeOpacity="0.5" />
                      )}

                      {/* Mapping indicator dot */}
                      <circle cx="295" cy={y} r="4"
                        fill={isMapped ? 'rgb(16,185,129)' : isRequired ? 'rgb(239,68,68)' : 'rgb(245,158,11)'} />

                      {/* Required indicator */}
                      {isRequired && (
                        <text x="20" y={y + 4} fontSize="9" className="fill-red-500">*</text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="flex gap-4 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> 已映射</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> 未映射(必填)</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> 未映射(可选)</span>
              </div>
            </div>
          )}

          {/* Stats summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{mapped.length}</div>
              <div className="text-xs text-slate-500">已映射</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{unmapped.filter(i => i.required === 1).length}</div>
              <div className="text-xs text-slate-500">未映射(必填)</div>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{unmapped.filter(i => i.required !== 1).length}</div>
              <div className="text-xs text-slate-500">未映射(可选)</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Mapping Test/Preview Dialog ============
function MappingPreviewDialog({ open, onClose, data, scenarios }: {
  open: boolean; onClose: () => void; data: any[]; scenarios: any[];
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of data) {
      if (!map.has(item.scenarioId)) map.set(item.scenarioId, []);
      map.get(item.scenarioId)!.push(item);
    }
    return Array.from(map.entries()).map(([scenarioId, items]) => {
      const s = scenarios.find(sc => sc.scenarioId === scenarioId);
      return {
        scenarioId,
        name: s ? s.name : scenarioId,
        items,
      };
    });
  }, [data, scenarios]);

  const [selectedScenario, setSelectedScenario] = useState(grouped[0]?.scenarioId || '');
  const currentGroup = grouped.find(g => g.scenarioId === selectedScenario);
  const items = currentGroup?.items || [];

  // Generate sample HIS data and transformed output
  const sampleHISData = useMemo(() => {
    const row: Record<string, string> = {};
    for (const item of items) {
      if (item.hisField) {
        // Generate sample value based on data type
        switch (item.dataType) {
          case 'String': row[item.hisField] = `SAMPLE_${item.systemField.toUpperCase()}`; break;
          case 'Int': row[item.hisField] = '12345'; break;
          case 'Float': row[item.hisField] = '98.6'; break;
          case 'DateTime': row[item.hisField] = '20240115'; break;
          case 'Enum': row[item.hisField] = '1'; break;
          default: row[item.hisField] = 'sample';
        }
      }
    }
    return row;
  }, [items]);

  const transformedData = useMemo(() => {
    const row: Record<string, { value: string; source: string; transformed: boolean }> = {};
    for (const item of items) {
      if (item.hisField && sampleHISData[item.hisField] !== undefined) {
        let value = sampleHISData[item.hisField];
        // Apply simple transform preview
        if (item.transformRule?.includes('日期格式转换')) {
          if (value.length === 8) {
            value = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
          }
        }
        row[item.systemField] = {
          value,
          source: item.hisField,
          transformed: !!item.transformRule,
        };
      } else {
        row[item.systemField] = {
          value: item.required === 1 ? '⚠️ 缺失' : '—',
          source: item.hisField || '(未映射)',
          transformed: false,
        };
      }
    }
    return row;
  }, [items, sampleHISData]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play size={20} className="text-emerald-500" /> 映射测试预览
          </DialogTitle>
          <DialogDescription>查看示例数据经过映射转换后的结果</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Scenario selector */}
          <div className="flex gap-2 flex-wrap">
            {grouped.map(g => (
              <button key={g.scenarioId} onClick={() => setSelectedScenario(g.scenarioId)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedScenario === g.scenarioId
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                }`}>
                {g.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sample HIS Data */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Database size={14} className="text-sky-500" /> 原始HIS数据（示例）
              </h4>
              <div className="bg-sky-50 dark:bg-sky-900/10 rounded-lg border border-sky-200 dark:border-sky-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-sky-100 dark:bg-sky-900/30">
                      <th className="px-3 py-2 text-left text-sky-700 dark:text-sky-400 text-xs font-semibold">HIS字段</th>
                      <th className="px-3 py-2 text-left text-sky-700 dark:text-sky-400 text-xs font-semibold">示例值</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sampleHISData).map(([key, val]) => (
                      <tr key={key} className="border-t border-sky-100 dark:border-sky-800/50">
                        <td className="px-3 py-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">{key}</td>
                        <td className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400">{val}</td>
                      </tr>
                    ))}
                    {Object.keys(sampleHISData).length === 0 && (
                      <tr><td colSpan={2} className="px-3 py-4 text-center text-slate-400 text-xs">暂无已映射字段</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transformed Output */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <Zap size={14} className="text-emerald-500" /> 转换后系统数据
              </h4>
              <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-emerald-100 dark:bg-emerald-900/30">
                      <th className="px-3 py-2 text-left text-emerald-700 dark:text-emerald-400 text-xs font-semibold">系统字段</th>
                      <th className="px-3 py-2 text-left text-emerald-700 dark:text-emerald-400 text-xs font-semibold">转换值</th>
                      <th className="px-3 py-2 text-left text-emerald-700 dark:text-emerald-400 text-xs font-semibold">来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(transformedData).map(([key, info]) => (
                      <tr key={key} className="border-t border-emerald-100 dark:border-emerald-800/50">
                        <td className="px-3 py-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">{key}</td>
                        <td className={`px-3 py-1.5 text-xs ${
                          info.value.includes('缺失') ? 'text-red-600 dark:text-red-400 font-medium' :
                          info.value === '—' ? 'text-slate-400' :
                          info.transformed ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {info.value}
                          {info.transformed && <span className="ml-1 text-[9px] text-amber-500">(已转换)</span>}
                        </td>
                        <td className="px-3 py-1.5 text-[10px] text-slate-400">{info.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Grouped Scenario View ============
function GroupedScenarioView({ data, scenarios, onEdit, onDelete, onToggleStatus, onDetail, selectedIds, onToggleSelect, onToggleSelectAll, allSelected }: {
  data: any[]; scenarios: any[];
  onEdit: (row: any) => void; onDelete: (row: any) => void;
  onToggleStatus: (row: any) => void; onDetail: (row: any) => void;
  selectedIds: Set<string>; onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void; allSelected: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const item of data) {
      if (!map.has(item.scenarioId)) map.set(item.scenarioId, []);
      map.get(item.scenarioId)!.push(item);
    }
    return Array.from(map.entries()).map(([scenarioId, items]) => {
      const s = scenarios.find(sc => sc.scenarioId === scenarioId);
      return {
        scenarioId,
        name: s ? s.name : scenarioId,
        items,
        mapped: items.filter(i => i.hisField).length,
        total: items.length,
        required: items.filter(i => i.required === 1).length,
        enabled: items.filter(i => i.status === 1).length,
      };
    });
  }, [data, scenarios]);

  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set(grouped.map(g => g.scenarioId)));

  const toggleExpand = (scenarioId: string) => {
    setExpandedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(scenarioId)) next.delete(scenarioId); else next.add(scenarioId);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {grouped.map(group => {
        const percent = group.total > 0 ? Math.round((group.mapped / group.total) * 100) : 0;
        const isExpanded = expandedScenarios.has(group.scenarioId);
        const groupIds = group.items.map(i => i.id);
        const groupAllSelected = groupIds.length > 0 && groupIds.every(id => selectedIds.has(id));

        return (
          <div key={group.scenarioId} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-shadow hover:shadow-md">
            {/* Header */}
            <button onClick={() => toggleExpand(group.scenarioId)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-3">
                {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{group.name}</span>
                <Badge variant="outline" className="text-[10px]">{group.scenarioId}</Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400">{group.mapped}/{group.total} 已映射</span>
                  <span className="text-sky-600 dark:text-sky-400">{group.enabled} 启用</span>
                  {group.required > 0 && <span className="text-amber-600 dark:text-amber-400">{group.required} 必填</span>}
                </div>
                <div className="w-24 flex items-center gap-2">
                  <Progress value={percent} className="h-2 flex-1 [&>div]:bg-emerald-500" />
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8">{percent}%</span>
                </div>
              </div>
            </button>

            {/* Content */}
            {isExpanded && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                      <th className="px-4 py-2 text-left w-10">
                        <Checkbox checked={groupAllSelected} onCheckedChange={() => onToggleSelectAll(groupIds)} />
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">系统字段</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">数据类型</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">必填</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">HIS字段</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">风险</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">状态</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((row, i) => (
                      <tr key={row.id} className={`border-t border-slate-100 dark:border-slate-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors ${i % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}>
                        <td className="px-4 py-2.5">
                          <Checkbox checked={selectedIds.has(row.id)} onCheckedChange={() => onToggleSelect(row.id)} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{row.systemLabel}</div>
                          <div className="text-[10px] text-slate-400">{row.systemField}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          {(() => {
                            const dt = DATA_TYPE_MAP[row.dataType];
                            return dt ? <Badge className={`text-[10px] ${dt.color}`}>{dt.label}</Badge> : <span className="text-xs">{row.dataType}</span>;
                          })()}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.required === 1
                            ? <span className="text-rose-600 dark:text-rose-400 text-xs font-medium">是</span>
                            : <span className="text-slate-400 text-xs">否</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.hisField ? (
                            <span className="text-xs text-sky-700 dark:text-sky-400 font-mono bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 rounded">{row.hisField}</span>
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-slate-600">未映射</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {row.consistencyRisk ? (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs"><AlertTriangle size={12} /> 有</span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-500 text-xs"><CheckCircle2 size={12} /> 无</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={row.status === 1 ? '已启用' : '已禁用'} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => onDetail(row)} className="h-7 text-xs gap-1 text-sky-600 hover:text-sky-500">
                              <Eye size={12} /> 详情
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onEdit(row)} className="h-7 text-xs gap-1">
                              <Copy size={12} /> 编辑
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onToggleStatus(row)}
                              className={`h-7 text-xs gap-1 ${row.status === 1 ? 'text-amber-600 hover:text-amber-500' : 'text-emerald-600 hover:text-emerald-500'}`}>
                              {row.status === 1 ? <><XCircle size={12} /> 禁用</> : <><CheckCircle2 size={12} /> 启用</>}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============ Main Page ============
export default function HisFieldMappingPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ scenarioId: '', dataType: '', status: '', keyword: '' });
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [scenarios, setScenarios] = useState<any[]>([]);
  // New state for enhancements
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('flat');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDiagram, setShowDiagram] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch scenarios
  useEffect(() => {
    fetch('/api/his-business-scenarios')
      .then(r => r.json())
      .then(d => { if (d.success) setScenarios(d.data); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', ...filter });
    try {
      const res = await fetch(`/api/his-field-mappings?${params}`);
      const d = await res.json();
      if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    try {
      if (editItem) {
        const res = await fetch(`/api/his-field-mappings/${editItem.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
        const d = await res.json();
        if (!d.success) { toast.error(d.message || '保存失败'); return; }
        toast.success('字段映射更新成功');
      } else {
        const res = await fetch('/api/his-field-mappings', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
        const d = await res.json();
        if (!d.success) { toast.error(d.message || '创建失败'); return; }
        toast.success('字段映射创建成功');
      }
      setShowForm(false); setEditItem(null); void fetchData();
    } catch {
      toast.error('操作失败，请重试');
    }
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`确认删除字段映射 [${row.systemLabel}]？`)) return;
    try {
      const res = await fetch(`/api/his-field-mappings/${row.id}`, { method: 'DELETE' });
      const d = await res.json();
      if (!d.success) { toast.error(d.message || '删除失败'); return; }
      toast.success('删除成功');
      setSelectedIds(prev => { const n = new Set(prev); n.delete(row.id); return n; });
      void fetchData();
    } catch {
      toast.error('删除失败');
    }
  };

  const handleToggleStatus = async (row: any) => {
    const newStatus = row.status === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/his-field-mappings/${row.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const d = await res.json();
      if (!d.success) { toast.error(d.message || '操作失败'); return; }
      toast.success(newStatus === 1 ? '已启用' : '已禁用');
      void fetchData();
    } catch {
      toast.error('操作失败');
    }
  };

  const getScenarioName = (scenarioId: string) => {
    const s = scenarios.find(sc => sc.scenarioId === scenarioId);
    return s ? s.name : scenarioId;
  };

  // Stats
  const enabledCount = data.filter(d => d.status === 1).length;
  const requiredCount = data.filter(d => d.required === 1).length;
  const mappedCount = data.filter(d => d.hisField).length;
  const mappingRate = total > 0 ? Math.round((mappedCount / total) * 100) : 0;

  // Batch operations
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(d => d.id)));
    }
  };

  const handleToggleSelectAllGroup = (ids: string[]) => {
    const allSelected = ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) { ids.forEach(id => next.delete(id)); }
      else { ids.forEach(id => next.add(id)); }
      return next;
    });
  };

  const handleBatchToggleStatus = async (enable: boolean) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) { toast.error('请先选择要操作的映射'); return; }
    if (!confirm(`确认${enable ? '启用' : '禁用'}选中的 ${ids.length} 条映射？`)) return;
    try {
      let successCount = 0;
      await Promise.all(ids.map(id =>
        fetch(`/api/his-field-mappings/${id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: enable ? 1 : 0 }),
        }).then(r => r.json()).then(d => { if (d.success) successCount++; })
      ));
      toast.success(`成功${enable ? '启用' : '禁用'} ${successCount} 条映射`);
      setSelectedIds(new Set());
      void fetchData();
    } catch {
      toast.error('批量操作失败');
    }
  };

  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) { toast.error('请先选择要删除的映射'); return; }
    if (!confirm(`确认删除选中的 ${ids.length} 条映射？此操作不可撤销！`)) return;
    try {
      let successCount = 0;
      await Promise.all(ids.map(id =>
        fetch(`/api/his-field-mappings/${id}`, { method: 'DELETE' })
          .then(r => r.json()).then(d => { if (d.success) successCount++; })
      ));
      toast.success(`成功删除 ${successCount} 条映射`);
      setSelectedIds(new Set());
      void fetchData();
    } catch {
      toast.error('批量删除失败');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['场景ID', '场景名称', '系统字段', '系统标签', '数据类型', '长度', '必填', 'HIS字段', 'HIS表名', '转换规则', '特殊处理逻辑', '校验规则', '一致性风险', '排序', '状态'];
    const rows = data.map(row => [
      row.scenarioId, getScenarioName(row.scenarioId), row.systemField, row.systemLabel,
      row.dataType, row.length, row.required === 1 ? '是' : '否',
      row.hisField || '', row.hisTable || '', row.transformRule || '',
      row.specialLogic || '', row.validationRule || '', row.consistencyRisk || '',
      row.sort, row.status === 1 ? '启用' : '禁用',
    ]);
    const BOM = '\uFEFF';
    const csv = BOM + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `his-field-mappings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV导出成功');
  };

  // CSV Import
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV文件内容为空'); setImporting(false); return; }

      // Parse header
      const headerLine = lines[0].replace(/^\uFEFF/, '');
      const headers = parseCSVLine(headerLine);
      const headerMap: Record<string, number> = {};
      headers.forEach((h, i) => { headerMap[h.trim()] = i; });

      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const scenarioId = values[headerMap['场景ID'] || 0]?.trim();
        const systemField = values[headerMap['系统字段'] || 2]?.trim();
        const systemLabel = values[headerMap['系统标签'] || 3]?.trim();

        if (!scenarioId || !systemField || !systemLabel) {
          failedCount++;
          errors.push(`第${i + 1}行: 缺少必填字段(场景ID/系统字段/系统标签)`);
          continue;
        }

        try {
          const res = await fetch('/api/his-field-mappings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scenarioId,
              systemField,
              systemLabel,
              dataType: values[headerMap['数据类型'] || 4]?.trim() || 'String',
              length: parseInt(values[headerMap['长度'] || 5]) || 50,
              required: values[headerMap['必填'] || 6]?.trim() === '是' ? 1 : 0,
              hisField: values[headerMap['HIS字段'] || 7]?.trim() || null,
              hisTable: values[headerMap['HIS表名'] || 8]?.trim() || null,
              transformRule: values[headerMap['转换规则'] || 9]?.trim() || null,
              specialLogic: values[headerMap['特殊处理逻辑'] || 10]?.trim() || null,
              validationRule: values[headerMap['校验规则'] || 11]?.trim() || null,
              consistencyRisk: values[headerMap['一致性风险'] || 12]?.trim() || null,
              sort: parseInt(values[headerMap['排序'] || 13]) || 0,
              status: values[headerMap['状态'] || 14]?.trim() === '禁用' ? 0 : 1,
            }),
          });
          const d = await res.json();
          if (d.success) successCount++;
          else { failedCount++; errors.push(`第${i + 1}行: ${d.message}`); }
        } catch (err) {
          failedCount++;
          errors.push(`第${i + 1}行: 请求失败`);
        }
      }

      setImportResult({ success: successCount, failed: failedCount, errors: errors.slice(0, 10) });
      if (successCount > 0) { void fetchData(); }
      toast.success(`导入完成：成功 ${successCount}，失败 ${failedCount}`);
    } catch {
      toast.error('导入失败，请检查文件格式');
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"'; i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current); current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  };

  // All-selected check
  const allSelected = data.length > 0 && data.every(d => selectedIds.has(d.id));

  // Columns for flat view
  const columns = [
    {
      key: 'systemLabel', label: '系统字段',
      render: (v: string, row: any) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-200">{v}</div>
          <div className="text-[10px] text-slate-400">{row.systemField}</div>
        </div>
      ),
    },
    {
      key: 'scenarioId', label: '所属场景',
      render: (v: string) => (
        <Badge variant="outline" className="text-[10px]">{getScenarioName(v)}</Badge>
      ),
    },
    {
      key: 'dataType', label: '数据类型',
      render: (v: string) => {
        const dt = DATA_TYPE_MAP[v];
        return dt ? <Badge className={`text-[10px] ${dt.color}`}>{dt.label}</Badge> : <span className="text-xs">{v}</span>;
      },
    },
    {
      key: 'required', label: '必填',
      render: (v: number) => v === 1
        ? <span className="text-rose-600 dark:text-rose-400 text-xs font-medium">是</span>
        : <span className="text-slate-400 text-xs">否</span>,
    },
    {
      key: 'hisField', label: 'HIS字段',
      render: (v: string, row: any) => v ? (
        <span className="text-xs text-sky-700 dark:text-sky-400 font-mono bg-sky-50 dark:bg-sky-900/20 px-1.5 py-0.5 rounded">{v}</span>
      ) : (
        <span className={`text-xs ${row.required === 1 ? 'text-red-400 dark:text-red-500' : 'text-amber-400 dark:text-amber-500'}`}>
          {row.required === 1 ? '⚠ 未映射' : '未映射'}
        </span>
      ),
    },
    {
      key: 'consistencyRisk', label: '风险',
      render: (v: string) => v ? (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs">
          <AlertTriangle size={12} /> 有
        </span>
      ) : (
        <span className="flex items-center gap-1 text-emerald-500 text-xs">
          <CheckCircle2 size={12} /> 无
        </span>
      ),
    },
    {
      key: 'status', label: '状态',
      render: (v: number, row: any) => {
        // Color-coded: green=mapped+enabled, red=unmapped required, amber=unmapped optional
        const isMapped = !!row.hisField;
        const isRequired = row.required === 1;
        const isEnabled = v === 1;
        let colorClass = '';
        if (!isMapped && isRequired && isEnabled) colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
        else if (!isMapped && isEnabled) colorClass = 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
        else if (isMapped && isEnabled) colorClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
        else colorClass = 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400';
        return <Badge className={`text-[10px] ${colorClass}`}>{isEnabled ? '已启用' : '已禁用'}</Badge>;
      },
    },
    {
      key: 'id', label: '操作',
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => { setDetailItem(row); setShowDetail(true); }} className="h-7 text-xs gap-1 text-sky-600 hover:text-sky-500">
            <Eye size={12} /> 详情
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(row)} className={`h-7 text-xs gap-1 ${row.status === 1 ? 'text-amber-600 hover:text-amber-500' : 'text-emerald-600 hover:text-emerald-500'}`}>
            {row.status === 1 ? <><XCircle size={12} /> 禁用</> : <><CheckCircle2 size={12} /> 启用</>}
          </Button>
        </div>
      ),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-emerald-500 mx-auto mb-3" />
          <div className="text-slate-500 text-sm">加载字段映射数据...</div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && data.length === 0 && total === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-sm">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Inbox size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">暂无字段映射数据</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">点击下方按钮创建第一个字段映射，配置系统字段与HIS字段的对应关系</p>
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            <Plus size={16} /> 新建映射
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ArrowRightLeft size={22} className="text-emerald-500" /> HIS字段映射管理
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowDiagram(true)} className="gap-1.5">
            <GitBranch size={14} /> 映射图
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="gap-1.5">
            <Play size={14} /> 测试预览
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <FileDown size={14} /> 导出CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
            <FileUp size={14} /> 导入CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            <Plus size={16} /> 新建映射
          </Button>
        </div>
      </div>

      {/* Mapping Completeness + Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '总映射数', value: total, icon: <Database size={16} />, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-700' },
          { label: '已启用', value: enabledCount, icon: <CheckCircle2 size={16} />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: '必填字段', value: requiredCount, icon: <AlertTriangle size={16} />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: '已映射HIS', value: mappedCount, icon: <ArrowRightLeft size={16} />, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20' },
        ].map((stat, i) => (
          <Card key={i} className="py-3 gap-2 transition-shadow hover:shadow-md">
            <CardContent className="px-4 py-0 flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>{stat.icon}</div>
              <div>
                <div className="text-xl font-bold text-slate-800 dark:text-slate-200">
                  <AnimatedCounter target={stat.value} />
                </div>
                <div className="text-[10px] text-slate-400 font-medium">{stat.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Mapping completeness card */}
        <Card className="py-3 gap-2 transition-shadow hover:shadow-md">
          <CardContent className="px-4 py-0 flex items-center gap-3">
            <div className="relative">
              <CircularProgress value={mappingRate} size={48} strokeWidth={4} color={mappingRate >= 80 ? '#10b981' : mappingRate >= 50 ? '#f59e0b' : '#ef4444'} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{mappingRate}%</span>
              </div>
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-200">{mappingRate}%</div>
              <div className="text-[10px] text-slate-400 font-medium">映射完成率</div>
              <Progress value={mappingRate} className="h-1.5 w-20 mt-1 [&>div]:bg-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Batch operations bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            已选择 {selectedIds.size} 项
          </span>
          <div className="h-4 w-px bg-emerald-200 dark:bg-emerald-700" />
          <Button variant="outline" size="sm" onClick={() => handleBatchToggleStatus(true)}
            className="gap-1 text-emerald-600 hover:text-emerald-500 border-emerald-200 dark:border-emerald-800 h-7 text-xs">
            <Power size={12} /> 批量启用
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleBatchToggleStatus(false)}
            className="gap-1 text-amber-600 hover:text-amber-500 border-amber-200 dark:border-amber-800 h-7 text-xs">
            <PowerOff size={12} /> 批量禁用
          </Button>
          <Button variant="outline" size="sm" onClick={handleBatchDelete}
            className="gap-1 text-red-600 hover:text-red-500 border-red-200 dark:border-red-800 h-7 text-xs">
            <Trash2 size={12} /> 批量删除
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}
            className="text-xs text-slate-500">
            取消选择
          </Button>
        </div>
      )}

      {/* Filters + View Mode Toggle */}
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap items-center">
        <select value={filter.scenarioId} onChange={e => setFilter(f => ({ ...f, scenarioId: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部场景</option>
          {scenarios.map(s => <option key={s.scenarioId} value={s.scenarioId}>{s.name}</option>)}
        </select>
        <select value={filter.dataType} onChange={e => setFilter(f => ({ ...f, dataType: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部类型</option>
          {DATA_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          <option value="1">已启用</option>
          <option value="0">已禁用</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input value={filter.keyword} onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
            placeholder="搜索字段名/标签/HIS字段" className="pl-8 h-8 text-sm" />
        </div>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>

        {/* View mode toggle */}
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-slate-200 dark:border-slate-600">
          <span className="text-xs text-slate-400">视图:</span>
          <button onClick={() => setViewMode('flat')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'flat'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}>
            <Layers size={12} className="inline mr-1" />列表
          </button>
          <button onClick={() => setViewMode('grouped')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}>
            <BarChart3 size={12} className="inline mr-1" />分组
          </button>
        </div>
      </div>

      {/* Data Table - Flat View */}
      {viewMode === 'flat' && (
        <>
          {/* Select all checkbox row */}
          {data.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-t-lg border border-b-0 border-slate-200 dark:border-slate-700">
              <Checkbox checked={allSelected} onCheckedChange={handleToggleSelectAll} />
              <span className="text-xs text-slate-500">{allSelected ? '取消全选' : '全选'}</span>
              {selectedIds.size > 0 && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">已选 {selectedIds.size} 项</span>
              )}
            </div>
          )}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left w-10">
                    <Checkbox checked={allSelected} onCheckedChange={handleToggleSelectAll} />
                  </th>
                  {columns.map(col => (
                    <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                      <td className="px-4 py-3"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                      {[...Array(columns.length)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : data.length === 0 ? (
                  <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Database size={32} className="text-slate-300 dark:text-slate-600" />
                      <span>暂无数据</span>
                    </div>
                  </td></tr>
                ) : data.map((row, i) => (
                  <tr key={row.id || i} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors duration-150 ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                    <td className="px-4 py-3">
                      <Checkbox checked={selectedIds.has(row.id)} onCheckedChange={() => handleToggleSelect(row.id)} />
                    </td>
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Data Table - Grouped View */}
      {viewMode === 'grouped' && (
        <>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
                  <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
                  <div className="space-y-2">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-8 bg-slate-100 dark:bg-slate-700 rounded" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <GroupedScenarioView
              data={data}
              scenarios={scenarios}
              onEdit={row => { setEditItem(row); setShowForm(true); }}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
              onDetail={row => { setDetailItem(row); setShowDetail(true); }}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAllGroup}
              allSelected={allSelected}
            />
          )}
          <Pagination page={page} total={total} onPageChange={setPage} />
        </>
      )}

      {/* Form Dialog */}
      {showForm && (
        <MappingForm
          item={editItem}
          scenarios={scenarios}
          allMappings={data}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditItem(null); }}
        />
      )}

      {/* Detail Dialog */}
      {showDetail && (
        <MappingDetailDialog
          open={showDetail}
          item={detailItem}
          onClose={() => { setShowDetail(false); setDetailItem(null); }}
        />
      )}

      {/* Mapping Diagram Dialog */}
      <MappingDiagramDialog
        open={showDiagram}
        onClose={() => setShowDiagram(false)}
        data={data}
        scenarios={scenarios}
      />

      {/* Mapping Preview Dialog */}
      <MappingPreviewDialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        data={data}
        scenarios={scenarios}
      />

      {/* Import Dialog */}
      <Dialog open={importing} onOpenChange={() => { if (!importing) setImporting(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw size={20} className="animate-spin text-emerald-500" /> 正在导入...
            </DialogTitle>
            <DialogDescription>请稍候，正在处理CSV文件</DialogDescription>
          </DialogHeader>
          <div className="py-8 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Result Dialog */}
      <Dialog open={!!importResult} onOpenChange={() => setImportResult(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp size={20} className="text-emerald-500" /> 导入结果
            </DialogTitle>
            <DialogDescription>CSV文件导入完成</DialogDescription>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{importResult.success}</div>
                  <div className="text-xs text-slate-500">成功</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{importResult.failed}</div>
                  <div className="text-xs text-slate-500">失败</div>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400">错误详情：</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded">{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportResult(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
