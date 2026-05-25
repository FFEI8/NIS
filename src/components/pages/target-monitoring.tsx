'use client';

import { Target, Syringe, Hospital, Stethoscope, Bug, ClipboardList } from 'lucide-react';

export default function TargetMonitoringPage() {
  const items = [
    { title: '手术部位感染监测', icon: <Syringe size={24} />, desc: 'SSI监测，含切口分类、风险分级', rate: '2.3%', color: 'border-rose-200 bg-rose-50 dark:bg-rose-900/20 dark:border-rose-800' },
    { title: 'ICU感染监测', icon: <Hospital size={24} />, desc: 'VAP/CLABSI/CAUTI监测', rate: '4.8%', color: 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800' },
    { title: '新生儿感染监测', icon: <Stethoscope size={24} />, desc: '新生儿病房专项监测', rate: '1.2%', color: 'border-cyan-200 bg-cyan-50 dark:bg-cyan-900/20 dark:border-cyan-800' },
    { title: '多重耐药菌监测', icon: <Bug size={24} />, desc: 'MDRO检出率与分布监测', rate: '8.5%', color: 'border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800' },
    { title: '重点科室监测', icon: <ClipboardList size={24} />, desc: '血液科/烧伤科/肿瘤科', rate: '3.6%', color: 'border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800' },
    { title: '导管相关监测', icon: <Syringe size={24} />, desc: '中心静脉/导尿管/呼吸机', rate: '5.1%', color: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Target size={22} className="text-emerald-500" /> 目标性监测
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <div key={i} className={`p-5 rounded-xl border ${item.color} transition-all hover:shadow-md cursor-pointer group`}>
            <div className="text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-110 transition-transform">{item.icon}</div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{item.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{item.desc}</p>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{item.rate}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">感染发病率</div>
          </div>
        ))}
      </div>
    </div>
  );
}
