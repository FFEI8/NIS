'use client';

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '待审核': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    '已确认': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    '已排除': 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
    '待处理': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '已处理': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    '合格': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    '不合格': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '已上报': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    '评估中': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    '随访中': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    '已结案': 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
    '草稿': 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
    '已提交': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    '已审核': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    '退回': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '待检测': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    '已启用': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    '已禁用': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '待出': 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
    '待核实': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    '已核实': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    '已预警': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '待确认': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    '已解除': 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
    '已转确诊': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    '处理中': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    '已关闭': 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
    '排除': 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400'}`}>{status}</span>;
}
