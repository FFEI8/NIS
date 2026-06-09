'use client';

import { useEffect } from 'react';
import { Target, Syringe, Hospital, Stethoscope, Bug, ClipboardList } from 'lucide-react';
import { useConfigStore } from '@/store/config-store';

const iconMap: Record<string, React.ReactNode> = {
  'Syringe': <Syringe size={24} />,
  'Hospital': <Hospital size={24} />,
  'Stethoscope': <Stethoscope size={24} />,
  'Bug': <Bug size={24} />,
  'ClipboardList': <ClipboardList size={24} />,
  'Target': <Target size={24} />,
};

const colorPalette = [
  'border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800',
  'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800',
  'border-cyan-200 bg-cyan-50 dark:bg-cyan-900/20 dark:border-cyan-800',
  'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800',
  'border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800',
  'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800',
];

export default function TargetMonitoringPage() {
  const { targetMonitoringItems, loaded, loadAllConfigs } = useConfigStore();

  useEffect(() => {
    if (!loaded) {
      loadAllConfigs();
    }
  }, [loaded, loadAllConfigs]);

  // Use DB data from targetMonitoringItems
  const items = targetMonitoringItems.map((item, i) => ({
    title: item.title,
    icon: item.icon || 'Target',
    desc: item.description || '',
    rate: item.currentRate > 0 ? `${item.currentRate}${item.rateUnit}` : `${item.targetRate}${item.rateUnit}`,
    color: colorPalette[i % colorPalette.length],
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Target size={22} className="text-emerald-500" /> 目标性监测
      </h2>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div key={i} className={`p-5 rounded-xl border ${item.color} transition-all hover:shadow-md cursor-pointer group`}>
              <div className="text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
                {iconMap[item.icon] || <Target size={24} />}
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{item.desc}</p>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{item.rate}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">感染发病率</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Target size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-400 dark:text-slate-500 text-sm">暂无监测项数据</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">请在系统配置中添加目标性监测项目</p>
        </div>
      )}
    </div>
  );
}
