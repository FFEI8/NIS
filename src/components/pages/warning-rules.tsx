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
  AlertTriangle, Search, Plus, Edit, Trash2, Settings2, Zap, Clock, Shield,
  TrendingUp, Activity, Eye, ToggleLeft, ToggleRight, Copy, Info, ChevronDown,
  Play, Bug, TestTube, Users, MapPin, Sparkles, FlaskConical,
} from 'lucide-react';

// ============ Rule type / category mapping ============
const RULE_TYPE_MAP: Record<string, { label: string; color: string }> = {
  '阈值预警': { label: '阈值预警', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  '趋势预警': { label: '趋势预警', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  '聚集预警': { label: '聚集预警', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  '时效预警': { label: '时效预警', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  '复合规则': { label: '复合规则', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
};

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  '感染监测': { label: '感染监测', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  '传染病管理': { label: '传染病管理', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  '环境监测': { label: '环境监测', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  '职业安全': { label: '职业安全', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  '症状监测': { label: '症状监测', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  '多重耐药菌': { label: '多重耐药菌', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const LEVEL_COLORS: Record<string, string> = {
  '高': 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  '中': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
  '低': 'text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50',
};

const OPERATOR_LABELS: Record<string, string> = {
  'gt': '大于', 'lt': '小于', 'eq': '等于', 'gte': '大于等于', 'lte': '小于等于',
  'contains': '包含', 'rising': '趋势上升', 'falling': '趋势下降', 'timeout': '超时',
};

const ACTION_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  'notify': { label: '发送通知', icon: <Zap size={12} /> },
  'escalate': { label: '预警升级', icon: <TrendingUp size={12} /> },
  'block': { label: '阻断操作', icon: <Shield size={12} /> },
};

// MDRO type options are now sourced from useConfigStore().mdroRuleTemplates

// ============ MDRO Quick Create Templates ============
const MDRO_TEMPLATES: Record<string, {
  name: string;
  bacteriaName: string;
  mdroType: string;
  description: string;
  conditionValue: string;
  timeWindow: number;
  warningLevel: string;
  targetDepts: string;
  cooldownMinutes: number;
  priority: number;
  color: string;
  icon: string;
  riskNote: string;
}> = {
  'CRAB': {
    name: '鲍曼不动杆菌(CRAB)检出预警',
    bacteriaName: '鲍曼不动杆菌',
    mdroType: 'CRAB',
    description: '监测微生物检验中鲍曼不动杆菌(CRAB)的检出情况，一旦检出即触发高级别预警，要求立即采取接触隔离措施。CRAB对碳青霉烯类耐药，传播力强，需重点关注ICU等重症科室。',
    conditionValue: '鲍曼不动杆菌',
    timeWindow: 24,
    warningLevel: '高',
    targetDepts: 'ICU,呼吸科,神经外科,烧伤科',
    cooldownMinutes: 120,
    priority: 10,
    color: 'bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800',
    icon: '🔴',
    riskNote: 'CRAB对碳青霉烯类抗生素耐药，极易在ICU等科室引起医院感染暴发',
  },
  'CRKP': {
    name: '肺炎克雷伯菌(CRKP)检出预警',
    bacteriaName: '肺炎克雷伯菌',
    mdroType: 'CRKP',
    description: '监测微生物检验中肺炎克雷伯菌(CRKP)的检出情况，CRKP对碳青霉烯类耐药，一旦检出即触发高级别预警，需立即隔离并追踪接触者。',
    conditionValue: '肺炎克雷伯菌',
    timeWindow: 24,
    warningLevel: '高',
    targetDepts: 'ICU,呼吸科,肝胆外科,血液科',
    cooldownMinutes: 120,
    priority: 10,
    color: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
    icon: '🟠',
    riskNote: 'CRKP碳青霉烯耐药性强，血流感染死亡率高达40-50%',
  },
  'MRSA': {
    name: '金黄色葡萄球菌(MRSA)检出预警',
    bacteriaName: '金黄色葡萄球菌',
    mdroType: 'MRSA',
    description: '监测微生物检验中耐甲氧西林金黄色葡萄球菌(MRSA)的检出情况，MRSA对β-内酰胺类抗生素耐药，检出后需执行接触隔离措施。',
    conditionValue: '金黄色葡萄球菌',
    timeWindow: 48,
    warningLevel: '中',
    targetDepts: 'ICU,外科,骨科,皮肤科',
    cooldownMinutes: 180,
    priority: 7,
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
    icon: '🟣',
    riskNote: 'MRSA是最常见的医院感染耐药菌之一，外科伤口感染风险高',
  },
  'VRE': {
    name: '屎肠球菌(VRE)检出预警',
    bacteriaName: '屎肠球菌',
    mdroType: 'VRE',
    description: '监测微生物检验中耐万古霉素屎肠球菌(VRE)的检出情况，VRE对万古霉素耐药，治疗选择极为有限，需立即启动接触隔离。',
    conditionValue: '屎肠球菌',
    timeWindow: 24,
    warningLevel: '高',
    targetDepts: 'ICU,血液科,肾内科,肿瘤科',
    cooldownMinutes: 120,
    priority: 10,
    color: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    icon: '🔴',
    riskNote: 'VRE对万古霉素耐药，治疗选择极为有限，常在免疫功能低下患者中引起严重感染',
  },
  'CRPA': {
    name: '铜绿假单胞菌(CRPA)检出预警',
    bacteriaName: '铜绿假单胞菌',
    mdroType: 'CRPA',
    description: '监测微生物检验中耐碳青霉烯铜绿假单胞菌(CRPA)的检出情况，CRPA可引起多种医院感染，需关注呼吸机相关性肺炎和血流感染。',
    conditionValue: '铜绿假单胞菌',
    timeWindow: 48,
    warningLevel: '中',
    targetDepts: 'ICU,呼吸科,烧伤科,肿瘤科',
    cooldownMinutes: 180,
    priority: 7,
    color: 'bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800',
    icon: '🟢',
    riskNote: 'CRPA常引起呼吸机相关性肺炎和血流感染，对多种抗生素天然耐药',
  },
};

// ============ Rule Test Result Dialog ============
function RuleTestResultDialog({ open, onClose, result }: { open: boolean; onClose: () => void; result: any }) {
  if (!result) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TestTube size={20} className="text-emerald-500" /> 规则测试结果
          </DialogTitle>
          <DialogDescription>{result.ruleName} ({result.ruleCode})</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Test outcome */}
          <div className={`p-4 rounded-lg border-2 ${result.wouldTrigger ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.wouldTrigger ? (
                <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400" />
              ) : (
                <Shield size={18} className="text-emerald-600 dark:text-emerald-400" />
              )}
              <span className={`font-semibold ${result.wouldTrigger ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                {result.wouldTrigger ? '规则将触发' : '规则未触发'}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{result.message}</p>
          </div>

          {/* Test details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-1">监测字段</div>
              <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{result.conditionField}</code>
            </div>
            <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-1">条件</div>
              <span className="text-sm">{OPERATOR_LABELS[result.conditionOperator] || result.conditionOperator} {result.conditionValue}</span>
            </div>
            <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-1">匹配记录数</div>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200">{result.matchCount}</span>
            </div>
            <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-1">触发预警级别</div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[result.warningLevel] || ''}`}>{result.warningLevel}</span>
            </div>
            <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-1">时间窗口</div>
              <span className="text-sm">{result.timeWindow}小时</span>
            </div>
            <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-1">触发动作</div>
              <span className="flex items-center gap-1 text-sm">{ACTION_LABELS[result.actionType]?.icon}{ACTION_LABELS[result.actionType]?.label}</span>
            </div>
          </div>

          {/* Affected patients */}
          {result.affectedPatients && result.affectedPatients.length > 0 && (
            <div className="p-3 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1"><Users size={12} /> 受影响患者</div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.affectedPatients.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 dark:bg-slate-800 rounded">
                    <span className="text-slate-700 dark:text-slate-300">{p.patientName || p.patientId}</span>
                    {p.mdroType && <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[9px]">{p.mdroType}</Badge>}
                    {p.dept && <span className="text-slate-400">{p.dept}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affected departments */}
          {result.affectedDepts && result.affectedDepts.length > 0 && (
            <div className="p-3 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-2 flex items-center gap-1"><MapPin size={12} /> 涉及科室</div>
              <div className="flex flex-wrap gap-1.5">
                {result.affectedDepts.map((d: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>
                ))}
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

// ============ Rule Detail Dialog ============
function RuleDetailDialog({ open, onClose, rule }: { open: boolean; onClose: () => void; rule: any }) {
  if (!rule) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 size={20} className="text-emerald-500" /> 规则详情
          </DialogTitle>
          <DialogDescription>查看预警规则的完整配置信息</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Header */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{rule.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">编码: {rule.code}</div>
            </div>
            <div className="flex gap-2">
              {rule.isSystem === 1 && <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-[10px]">系统内置</Badge>}
              <Badge className={rule.enabled === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>{rule.enabled === 1 ? '已启用' : '已禁用'}</Badge>
            </div>
          </div>

          {/* Rule info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '规则分类', value: rule.category, render: () => <Badge className={CATEGORY_MAP[rule.category]?.color || ''}>{rule.category}</Badge> },
              { label: '规则类型', value: rule.ruleType, render: () => <Badge className={RULE_TYPE_MAP[rule.ruleType]?.color || ''}>{rule.ruleType}</Badge> },
              { label: '预警级别', value: rule.warningLevel, render: () => <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[rule.warningLevel] || ''}`}>{rule.warningLevel}</span> },
              { label: '预警类型', value: rule.warningType, render: () => <span className="text-sm text-slate-700 dark:text-slate-300">{rule.warningType}</span> },
              { label: '监测字段', value: rule.conditionField, render: () => <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{rule.conditionField}</code> },
              { label: '条件运算', value: rule.conditionOperator, render: () => <span className="text-sm">{OPERATOR_LABELS[rule.conditionOperator] || rule.conditionOperator}</span> },
              { label: '条件阈值', value: rule.conditionValue, render: () => <span className="text-sm font-medium text-rose-600 dark:text-rose-400">{rule.conditionValue}</span> },
              { label: '时间窗口', value: `${rule.timeWindow}小时`, render: () => <span className="text-sm">{rule.timeWindow}小时</span> },
              { label: '触发动作', value: rule.actionType, render: () => <span className="flex items-center gap-1 text-sm">{ACTION_LABELS[rule.actionType]?.icon}{ACTION_LABELS[rule.actionType]?.label}</span> },
              { label: '冷却时间', value: `${rule.cooldownMinutes}分钟`, render: () => <span className="text-sm">{rule.cooldownMinutes}分钟</span> },
              { label: '优先级', value: rule.priority, render: () => <span className="text-sm font-medium">{rule.priority}</span> },
              { label: '累计触发', value: rule.triggerCount, render: () => <span className="text-sm font-medium text-amber-600">{rule.triggerCount}次</span> },
            ].map((item, i) => (
              <div key={i} className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
                <div className="text-[10px] text-slate-400 mb-1">{item.label}</div>
                {item.render()}
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
            <div className="text-[10px] text-slate-400 mb-1">规则描述</div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{rule.description}</p>
          </div>

          {/* Target scope */}
          {(rule.targetDepts || rule.targetSites || rule.targetDiseases) && (
            <div className="p-2.5 border border-slate-100 dark:border-slate-700 rounded-lg">
              <div className="text-[10px] text-slate-400 mb-1.5">适用范围</div>
              <div className="flex flex-wrap gap-1.5">
                {rule.targetDepts && rule.targetDepts.split(',').map((d: string) => (
                  <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                ))}
                {rule.targetSites && rule.targetSites.split(',').map((s: string) => (
                  <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                ))}
                {rule.targetDiseases && rule.targetDiseases.split(',').map((d: string) => (
                  <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Last triggered */}
          {rule.lastTriggeredAt && (
            <div className="text-xs text-slate-400">
              <Clock size={12} className="inline mr-1" />
              最后触发: {new Date(rule.lastTriggeredAt).toLocaleString('zh-CN')}
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

// ============ Rule Form Dialog ============
function WarningRuleForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', code: '', category: '感染监测', ruleType: '阈值预警', description: '',
    conditionType: '大于', conditionField: 'infectionRate', conditionOperator: 'gt',
    conditionValue: '', timeWindow: 24, warningLevel: '中', warningType: '病例预警',
    targetDepts: '', targetSites: '', targetDiseases: '',
    actionType: 'notify', cooldownMinutes: 60, priority: 0,
    mdroTypes: '',  // Comma-separated MDRO types for monitoring
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '', code: item.code || '', category: item.category || '感染监测',
        ruleType: item.ruleType || '阈值预警', description: item.description || '',
        conditionType: item.conditionType || '大于', conditionField: item.conditionField || 'infectionRate',
        conditionOperator: item.conditionOperator || 'gt', conditionValue: item.conditionValue || '',
        timeWindow: item.timeWindow || 24, warningLevel: item.warningLevel || '中',
        warningType: item.warningType || '病例预警', targetDepts: item.targetDepts || '',
        targetSites: item.targetSites || '', targetDiseases: item.targetDiseases || '',
        actionType: item.actionType || 'notify', cooldownMinutes: item.cooldownMinutes || 60,
        priority: item.priority || 0, mdroTypes: item.mdroTypes || '',
      });
    } else {
      // Auto-generate code
      setForm(f => ({ ...f, code: `WR${Date.now().toString(36).toUpperCase()}` }));
    }
  }, [item]);

  const handleSubmit = async () => {
    if (!form.name || !form.code || !form.conditionValue) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 size={20} /> {item ? '编辑预警规则' : '新建预警规则'}
          </DialogTitle>
          <DialogDescription>{item ? '修改预警规则配置' : '配置智能预警规则参数'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Info size={14} className="text-emerald-500" /> 基本信息
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">规则名称 <span className="text-red-500">*</span></label>
                <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="如：ICU感染率超标预警" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">规则编码 <span className="text-red-500">*</span></label>
                <Input value={form.code} onChange={e => updateField('code', e.target.value)} placeholder="系统自动生成" disabled={!!item} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">规则分类</label>
                <select value={form.category} onChange={e => updateField('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {useConfigStore.getState().getDictNames('rule_category').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">规则类型</label>
                <select value={form.ruleType} onChange={e => updateField('ruleType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {useConfigStore.getState().getDictNames('rule_type').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">规则描述</label>
              <textarea value={form.description} onChange={e => updateField('description', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[60px]"
                placeholder="描述此预警规则的用途和触发场景" />
            </div>
          </div>

          {/* MDRO monitoring config - show when category is MDRO */}
          {form.category === '多重耐药菌' && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Bug size={14} className="text-rose-500" /> 监测菌种配置
              </h4>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">监测菌种（多选，用逗号分隔）</label>
                <div className="flex flex-wrap gap-2 p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                  {useConfigStore.getState().mdroRuleTemplates.map(t => ({ value: t.mdroType, label: `${t.mdroType} - ${t.bacteriaName}` })).map(opt => {
                    const isSelected = form.mdroTypes.split(',').filter(Boolean).includes(opt.value);
                    return (
                      <label key={opt.value} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                        isSelected ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-300 dark:border-rose-700' : 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                      }`}>
                        <input type="checkbox" className="hidden" checked={isSelected}
                          onChange={() => {
                            const types = form.mdroTypes.split(',').filter(Boolean);
                            const newTypes = isSelected ? types.filter(t => t !== opt.value) : [...types, opt.value];
                            updateField('mdroTypes', newTypes.join(','));
                          }} />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Trigger Condition */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-500" /> 触发条件
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">监测字段</label>
                <select value={form.conditionField} onChange={e => updateField('conditionField', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <optgroup label="多重耐药菌">
                    <option value="mdroDetection">MDRO检出</option>
                    <option value="mdroCount">MDRO检出数量</option>
                  </optgroup>
                  <optgroup label="感染监测">
                    <option value="infectionRate">感染发病率(%)</option>
                    <option value="caseCount">新增病例数</option>
                    <option value="mdroCount">多重耐药菌数</option>
                  </optgroup>
                  <optgroup label="传染病管理">
                    <option value="notifiableDisease">法定传染病报告</option>
                    <option value="clusterCount">聚集性病例数</option>
                    <option value="idCaseCount">传染病新增病例</option>
                  </optgroup>
                  <optgroup label="环境监测">
                    <option value="colonyCount">菌落数</option>
                    <option value="envUnqualifiedRate">环境不合格率(%)</option>
                    <option value="sterilizationFail">灭菌不合格</option>
                  </optgroup>
                  <optgroup label="职业安全">
                    <option value="exposureCount">职业暴露次数</option>
                    <option value="handHygieneRate">手卫生依从率(%)</option>
                  </optgroup>
                  <optgroup label="症状监测">
                    <option value="feverCount">发热人数</option>
                    <option value="diarrheaCount">腹泻人数</option>
                    <option value="rashCount">皮疹人数</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">运算符</label>
                <select value={form.conditionOperator} onChange={e => updateField('conditionOperator', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {Object.entries(OPERATOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">阈值 <span className="text-red-500">*</span></label>
                <Input value={form.conditionValue} onChange={e => updateField('conditionValue', e.target.value)} placeholder="如: 5, 10%" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">时间窗口（小时）</label>
                <Input type="number" value={form.timeWindow} onChange={e => updateField('timeWindow', parseInt(e.target.value) || 24)} min={1} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">条件类型</label>
                <select value={form.conditionType} onChange={e => updateField('conditionType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {['大于', '小于', '等于', '包含', '趋势上升', '趋势下降', '时间超限'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Warning Config */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-500" /> 预警配置
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">预警级别</label>
                <select value={form.warningLevel} onChange={e => updateField('warningLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {getDictNames('warning_level').map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">预警类型</label>
                <select value={form.warningType} onChange={e => updateField('warningType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {getDictNames('warning_type').map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">触发动作</label>
                <select value={form.actionType} onChange={e => updateField('actionType', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Scope */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity size={14} className="text-sky-500" /> 适用范围（留空则适用全部）
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">适用科室</label>
                <Input value={form.targetDepts} onChange={e => updateField('targetDepts', e.target.value)} placeholder="如: ICU,外科" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">适用感染部位</label>
                <Input value={form.targetSites} onChange={e => updateField('targetSites', e.target.value)} placeholder="如: 呼吸道,泌尿道" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">适用传染病</label>
                <Input value={form.targetDiseases} onChange={e => updateField('targetDiseases', e.target.value)} placeholder="如: 新冠,肺结核" />
              </div>
            </div>
          </div>

          {/* Other */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">冷却时间（分钟）</label>
              <Input type="number" value={form.cooldownMinutes} onChange={e => updateField('cooldownMinutes', parseInt(e.target.value) || 60)} min={0} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">优先级</label>
              <Input type="number" value={form.priority} onChange={e => updateField('priority', parseInt(e.target.value) || 0)} min={0} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.name || !form.conditionValue} className="bg-emerald-600 hover:bg-emerald-500">
            {saving ? '保存中...' : '保存规则'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Quick Create MDRO Rule Dialog ============
function QuickCreateMDRODialog({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (data: any) => void }) {
  const [creating, setCreating] = useState<string | null>(null);
  const [created, setCreated] = useState<Set<string>>(new Set());

  const handleQuickCreate = async (type: string) => {
    const template = MDRO_TEMPLATES[type];
    if (!template) return;

    setCreating(type);
    const formData = {
      name: template.name,
      code: `MDRO_${type}_${Date.now().toString(36).toUpperCase()}`,
      category: '多重耐药菌',
      ruleType: '阈值预警',
      description: template.description,
      conditionType: '包含',
      conditionField: 'mdroDetection',
      conditionOperator: 'contains',
      conditionValue: template.conditionValue,
      timeWindow: template.timeWindow,
      warningLevel: template.warningLevel,
      warningType: 'MDRO预警',
      targetDepts: template.targetDepts,
      targetSites: '',
      targetDiseases: '',
      actionType: 'notify',
      cooldownMinutes: template.cooldownMinutes,
      priority: template.priority,
      mdroTypes: template.mdroType,
    };

    await onSave(formData);
    setCreated(prev => new Set(prev).add(type));
    setCreating(null);
  };

  const handleCreateAll = async () => {
    for (const type of Object.keys(MDRO_TEMPLATES)) {
      if (!created.has(type)) {
        await handleQuickCreate(type);
      }
    }
  };

  const allCreated = created.size === Object.keys(MDRO_TEMPLATES).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" /> 快速创建MDRO规则
          </DialogTitle>
          <DialogDescription>一键创建5种多重耐药菌的预警规则，每种菌配有推荐默认参数</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* Summary header */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical size={14} className="text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">5种重点MDRO监测菌种</span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              根据国家卫健委《多重耐药菌医院感染预防与控制指南》，以下5种多重耐药菌为医院感染重点监测对象。点击各菌种卡片可快速创建对应预警规则。
            </p>
          </div>

          {/* MDRO template cards */}
          {Object.entries(MDRO_TEMPLATES).map(([type, template]) => (
            <div key={type} className={`p-4 rounded-lg border-2 transition-all ${template.color} ${created.has(type) ? 'opacity-60' : 'hover:shadow-md'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{template.icon}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{template.name}</span>
                    <Badge className={`text-[9px] ${LEVEL_COLORS[template.warningLevel]}`}>{template.warningLevel}级别</Badge>
                    {created.has(type) && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[9px]">已创建</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{template.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={10} /> 时间窗口: {template.timeWindow}h</span>
                    <span className="flex items-center gap-1"><MapPin size={10} /> 重点科室: {template.targetDepts}</span>
                    <span className="flex items-center gap-1"><Zap size={10} /> 冷却: {template.cooldownMinutes}min</span>
                    <span className="flex items-center gap-1"><Shield size={10} /> 优先级: {template.priority}</span>
                  </div>
                  <div className="mt-1.5 text-[10px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle size={10} /> {template.riskNote}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleQuickCreate(type)}
                  disabled={creating === type || created.has(type)}
                  className={`shrink-0 gap-1 ${created.has(type)
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  {creating === type ? (
                    <><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> 创建中</>
                  ) : created.has(type) ? (
                    <><Shield size={12} /> 已创建</>
                  ) : (
                    <><Plus size={12} /> 创建</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose} className="gap-1">
            关闭
          </Button>
          <Button
            onClick={handleCreateAll}
            disabled={allCreated}
            className="gap-1.5 bg-amber-600 hover:bg-amber-500 text-white"
          >
            <Sparkles size={14} />
            {allCreated ? '全部已创建' : '一键创建全部5条规则'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Main Page ============
export default function WarningRulesPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', ruleType: '', enabled: '', keyword: '' });
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showTestResult, setShowTestResult] = useState(false);
  const [showQuickMDRO, setShowQuickMDRO] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const currentUser = useAppStore(s => s.currentUser);
  const { getDictNames } = useConfigStore();
  const categoryOptions = getDictNames('rule_category');
  const ruleTypeOptions = getDictNames('rule_type');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', ...filter });
    try {
      const res = await fetch(`/api/warning-rules?${params}`);
      const d = await res.json();
      if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    const url = editItem ? `/api/warning-rules/${editItem.id}` : '/api/warning-rules';
    const method = editItem ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, createdBy: currentUser?.name }) });
    if (res.ok) { setShowForm(false); setEditItem(null); fetchData(); }
  };

  const handleEdit = (row: any) => { setEditItem(row); setShowForm(true); };

  const handleDelete = async (row: any) => {
    if (row.isSystem === 1) { alert('系统内置规则不可删除'); return; }
    if (!confirm('确定要删除此预警规则吗？')) return;
    await fetch(`/api/warning-rules/${row.id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleToggle = async (row: any) => {
    const newEnabled = row.enabled === 1 ? 0 : 1;
    await fetch(`/api/warning-rules/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: newEnabled }) });
    fetchData();
  };

  const handleDuplicate = async (row: any) => {
    const { id, createdAt, updatedAt, triggerCount, lastTriggeredAt, ...rest } = row;
    await fetch('/api/warning-rules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rest, name: `${rest.name} (副本)`, code: `WR${Date.now().toString(36).toUpperCase()}`, triggerCount: 0, lastTriggeredAt: null, isSystem: 0 }),
    });
    fetchData();
  };

  const handleViewDetail = (row: any) => { setDetailItem(row); setShowDetail(true); };

  const handleTestRule = async (row: any) => {
    setTesting(row.id);
    try {
      const res = await fetch('/api/warning-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', ruleId: row.id }),
      });
      const d = await res.json();
      if (d.success) {
        setTestResult(d.data);
        setShowTestResult(true);
      } else {
        setToast({ message: d.message || '测试失败', type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: '测试请求失败: ' + e.message, type: 'error' });
    }
    setTesting(null);
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
      } else {
        setToast({ message: d.message || '执行失败', type: 'error' });
      }
    } catch (e: any) {
      setToast({ message: '执行失败: ' + e.message, type: 'error' });
    }
    setEvaluating(false);
    setTimeout(() => setToast(null), 5000);
  };

  const columns = [
    {
      key: 'name', label: '规则名称',
      render: (v: string, row: any) => (
        <div>
          <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            {v}
            {row.isSystem === 1 && <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 text-[9px] py-0">内置</Badge>}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{row.code}</div>
        </div>
      ),
    },
    {
      key: 'category', label: '分类',
      render: (v: string) => <Badge className={CATEGORY_MAP[v]?.color || 'bg-slate-100 text-slate-600'}>{v}</Badge>,
    },
    {
      key: 'ruleType', label: '类型',
      render: (v: string) => <Badge className={RULE_TYPE_MAP[v]?.color || 'bg-slate-100 text-slate-600'}>{v}</Badge>,
    },
    {
      key: 'condition', label: '触发条件',
      render: (_: any, row: any) => (
        <div className="text-xs text-slate-600 dark:text-slate-400">
          <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-[10px]">{row.conditionField}</code>
          {' '}{OPERATOR_LABELS[row.conditionOperator] || row.conditionOperator}{' '}
          <span className="font-medium text-rose-600 dark:text-rose-400">{row.conditionValue}</span>
          <span className="text-slate-400 ml-1">({row.timeWindow}h)</span>
        </div>
      ),
    },
    {
      key: 'warningLevel', label: '预警级别',
      render: (v: string) => <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[v] || ''}`}>{v}</span>,
    },
    {
      key: 'enabled', label: '状态',
      render: (v: number) => <StatusBadge status={v === 1 ? '已启用' : '已禁用'} />,
    },
    {
      key: 'triggerCount', label: '触发次数',
      render: (v: number) => <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{v}</span>,
    },
  ];

  // Stats
  const enabledCount = data.filter(r => r.enabled === 1).length;
  const systemCount = data.filter(r => r.isSystem === 1).length;
  const totalTriggers = data.reduce((s: number, r: any) => s + (r.triggerCount || 0), 0);

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

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Settings2 size={22} className="text-emerald-500" /> 智能预警规则
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEvaluate} disabled={evaluating} className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-900/20">
            <Play size={14} /> {evaluating ? '执行中...' : '执行引擎'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowQuickMDRO(true)} className="gap-1.5 text-rose-600 border-rose-300 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-700 dark:hover:bg-rose-900/20">
            <Sparkles size={14} /> 快速创建MDRO规则
          </Button>
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            <Plus size={16} /> 新建规则
          </Button>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">配置智能预警触发规则，实现自动监测与实时预警</p>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '总规则数', value: data.length, icon: <Settings2 size={16} className="text-slate-500" />, color: 'bg-slate-50 dark:bg-slate-800' },
          { label: '已启用', value: enabledCount, icon: <ToggleRight size={16} className="text-emerald-500" />, color: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: '系统内置', value: systemCount, icon: <Shield size={16} className="text-sky-500" />, color: 'bg-sky-50 dark:bg-sky-900/20' },
          { label: '累计触发', value: totalTriggers, icon: <Zap size={16} className="text-amber-500" />, color: 'bg-amber-50 dark:bg-amber-900/20' },
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

      {/* Filters */}
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <Input placeholder="搜索规则名称/编码" value={filter.keyword} onChange={e => setFilter(f => ({ ...f, keyword: e.target.value }))}
          className="w-48" />
        <select value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部分类</option>
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filter.ruleType} onChange={e => setFilter(f => ({ ...f, ruleType: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部类型</option>
          {ruleTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.enabled} onChange={e => setFilter(f => ({ ...f, enabled: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          <option value="1">已启用</option>
          <option value="0">已禁用</option>
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>

      {/* Table with custom actions */}
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
                    <div className="flex flex-col items-center gap-2"><Settings2 size={32} className="text-slate-300 dark:text-slate-600" /><span>暂无预警规则</span></div>
                  </td></tr>
                ) : data.map((row, i) => (
                  <tr key={row.id || i} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(row)} className="h-7 text-xs gap-1 text-slate-600"><Eye size={12} />详情</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleTestRule(row)} disabled={testing === row.id} className="h-7 text-xs gap-1 text-sky-600">
                          <TestTube size={12} />{testing === row.id ? '...' : '测试'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(row)} className={`h-7 text-xs gap-1 ${row.enabled === 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {row.enabled === 1 ? <><ToggleLeft size={12} />禁用</> : <><ToggleRight size={12} />启用</>}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} className="h-7 text-xs gap-1"><Edit size={12} />编辑</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDuplicate(row)} className="h-7 text-xs gap-1 text-sky-600"><Copy size={12} />复制</Button>
                        {row.isSystem !== 1 && (
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="h-7 text-xs gap-1 text-red-600"><Trash2 size={12} />删除</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} onPageChange={setPage} />
      </div>

      {/* Dialogs */}
      {showForm && <WarningRuleForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
      {showDetail && <RuleDetailDialog open={showDetail} rule={detailItem} onClose={() => { setShowDetail(false); setDetailItem(null); }} />}
      {showTestResult && <RuleTestResultDialog open={showTestResult} result={testResult} onClose={() => { setShowTestResult(false); setTestResult(null); }} />}
      {showQuickMDRO && <QuickCreateMDRODialog open={showQuickMDRO} onClose={() => setShowQuickMDRO(false)} onSave={handleSave} />}
    </div>
  );
}
