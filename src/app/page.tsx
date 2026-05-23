'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/app-store';
import { useDataStore } from '@/store/data-store';
import type { MenuItem, DashboardStats, InfectionCase, WarningRecord, User as UserType, Role, Permission } from '@/types';

// ============ Icon Mapping ============
const iconMap: Record<string, React.ReactNode> = {};
function getIcon(name?: string, size = 18) {
  if (!name) return null;
  const icons: Record<string, string> = {
    LayoutDashboard: '📊', Activity: '🔬', FileText: '📄', AlertTriangle: '⚠️',
    Target: '🎯', BarChart3: '📈', PieChart: '🥧', FileSpreadsheet: '📋',
    ShieldCheck: '🛡️', Droplets: '💧', Flame: '🔥', HardHat: '⛑️',
    ShieldAlert: '🚨', Hand: '🤲', Pill: '💊', Settings: '⚙️',
    Users: '👥', UserCog: '👤', Menu: '📑', KeyRound: '🔑',
    ChevronRight: '▶', ChevronDown: '🔽', ChevronLeft: '◀',
    Plus: '➕', Edit: '✏️', Trash2: '🗑️', Search: '🔍',
    RefreshCw: '🔄', X: '✕', Check: '✓', Filter: '🔽',
    Home: '🏠', Bell: '🔔', LogOut: '🚪', Moon: '🌙',
    Sun: '☀️', User: '👤', Lock: '🔒', Eye: '👁️',
    Save: '💾', Download: '📥', Upload: '📤',
  };
  return <span style={{ fontSize: size }}>{icons[name] || '📄'}</span>;
}

// ============ Login Page ============
function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAppStore(s => s.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('用户名或密码错误');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mb-4">
              <span className="text-3xl">🏥</span>
            </div>
            <h1 className="text-2xl font-bold text-white">医院感染管理系统</h1>
            <p className="text-slate-400 mt-2 text-sm">Hospital Infection Management System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                placeholder="请输入密码"
              />
            </div>
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-emerald-600/30"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>
          <div className="mt-6 p-4 bg-white/5 rounded-xl">
            <p className="text-slate-400 text-xs text-center mb-2">演示账号</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-emerald-400 font-medium">管理员</div>
                <div className="text-slate-500">admin</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-emerald-400 font-medium">感控专员</div>
                <div className="text-slate-500">gkzj</div>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg">
                <div className="text-emerald-400 font-medium">临床医师</div>
                <div className="text-slate-500">doctor</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Sidebar ============
function Sidebar() {
  const { userMenus, sidebarCollapsed, toggleSidebar, activeMenu, setActiveMenu } = useAppStore();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['infection-monitor', 'data-analysis', 'env-monitor', 'occupational-safety', 'system']));

  const toggleExpand = (code: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleMenuClick = (menu: MenuItem) => {
    if (menu.type === 'directory') {
      toggleExpand(menu.code);
    } else {
      setActiveMenu(menu.code);
    }
  };

  const renderMenuItems = (items: MenuItem[], depth = 0) => {
    return items.filter(m => m.visible === 1 && m.status === 1).map(menu => {
      const isActive = activeMenu === menu.code;
      const isExpanded = expandedMenus.has(menu.code);
      const hasChildren = menu.children && menu.children.length > 0;

      return (
        <div key={menu.id}>
          <div
            className={`flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-200 group
              ${depth > 0 ? 'ml-' + (depth * 2) : ''}
              ${isActive
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => handleMenuClick(menu)}
          >
            <span className="text-base flex-shrink-0">{getIcon(menu.icon)}</span>
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-sm font-medium truncate">{menu.name}</span>
                {hasChildren && (
                  <span className={`text-xs transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                )}
              </>
            )}
          </div>
          {hasChildren && isExpanded && !sidebarCollapsed && (
            <div className="mt-0.5">
              {renderMenuItems(menu.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside className={`h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center h-14 px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xl">🏥</span>
            <span className="text-sm font-bold text-white truncate">感染管理系统</span>
          </div>
        )}
        <button onClick={toggleSidebar} className="ml-auto text-slate-400 hover:text-white p-1 rounded transition-colors">
          {sidebarCollapsed ? '▶' : '◀'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {renderMenuItems(userMenus)}
      </nav>
    </aside>
  );
}

// ============ Header ============
function Header() {
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 shadow-sm">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <button className="relative text-slate-500 hover:text-slate-700 transition-colors p-2 rounded-lg hover:bg-slate-100">
          <span className="text-lg">🔔</span>
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {currentUser?.name?.[0] || 'U'}
            </div>
            <span className="text-sm text-slate-700 font-medium">{currentUser?.name}</span>
            <span className="text-xs text-slate-400">▼</span>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-sm font-medium text-slate-800">{currentUser?.name}</div>
                <div className="text-xs text-slate-500">{currentUser?.dept} · {currentUser?.roles?.map(r => r.name).join(', ')}</div>
              </div>
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                🚪 退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ============ Dashboard ============
function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      if (d.success) setStats(d.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-slate-400 animate-pulse">加载中...</div></div>;
  if (!stats) return <div className="text-center text-slate-400 py-8">暂无数据</div>;

  const statCards = [
    { label: '累计感染病例', value: stats.totalInfections, icon: '🔬', color: 'bg-rose-50 text-rose-600 border-rose-200', trend: `本月+${stats.monthInfections}` },
    { label: '待处理预警', value: stats.pendingWarnings, icon: '⚠️', color: 'bg-amber-50 text-amber-600 border-amber-200', trend: '需及时处理' },
    { label: '多重耐药菌', value: stats.mdroCount, icon: '🦠', color: 'bg-purple-50 text-purple-600 border-purple-200', trend: '重点关注' },
    { label: '抗菌药物使用率', value: `${stats.antibioticUsageRate}%`, icon: '💊', color: 'bg-sky-50 text-sky-600 border-sky-200', trend: '持续监测' },
    { label: '手卫生依从率', value: `${stats.handHygieneRate}%`, icon: '🤲', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', trend: '稳步提升' },
    { label: '环境卫生合格率', value: `${stats.envHygieneRate}%`, icon: '🛡️', color: 'bg-teal-50 text-teal-600 border-teal-200', trend: '达标' },
    { label: '职业暴露事件', value: stats.exposureCount, icon: '⛑️', color: 'bg-orange-50 text-orange-600 border-orange-200', trend: '本年度累计' },
    { label: '本月新增感染', value: stats.monthInfections, icon: '📈', color: 'bg-red-50 text-red-600 border-red-200', trend: '同比-12%' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">感染监控概览</h2>
          <p className="text-sm text-slate-500 mt-1">实时监控医院感染相关指标</p>
        </div>
        <div className="text-sm text-slate-500">数据更新时间: {new Date().toLocaleString('zh-CN')}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`p-4 rounded-xl border ${card.color} transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs opacity-70">{card.trend}</span>
            </div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs opacity-80 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infection Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">📊 感染趋势（近12月）</h3>
          <div className="h-64 flex items-end gap-2">
            {stats.infectionTrend.map((item, i) => {
              const maxCount = Math.max(...stats.infectionTrend.map(t => t.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 font-medium">{item.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300 min-h-[4px]"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[10px] text-slate-400 -rotate-45 origin-center whitespace-nowrap">{item.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Site Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">🥧 感染部位分布</h3>
          <div className="space-y-3">
            {stats.siteDistribution.map((item, i) => {
              const maxCount = Math.max(...stats.siteDistribution.map(s => s.count), 1);
              const pct = (item.count / maxCount) * 100;
              const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500'];
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{item.site}</span>
                    <span className="text-sm font-semibold text-slate-800">{item.count}例</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dept Infection Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">📈 科室感染率</h3>
          <div className="space-y-4">
            {stats.deptInfectionRate.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-slate-700 w-16 text-right">{item.dept}</span>
                <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(item.rate * 5, 100)}%` }}
                  >
                    <span className="text-xs text-white font-bold">{item.rate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 mb-4">⚡ 快捷操作</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '新增感染病例', icon: '🔬', menu: 'infection-case' },
              { label: '处理预警', icon: '⚠️', menu: 'infection-warning' },
              { label: '环境监测录入', icon: '💧', menu: 'env-hygiene' },
              { label: '职业暴露上报', icon: '🚨', menu: 'occupational-exposure' },
              { label: '抗菌药物管理', icon: '💊', menu: 'antibiotic' },
              { label: '感染报告', icon: '📋', menu: 'data-report' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => useAppStore.getState().setActiveMenu(action.menu)}
                className="p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-left group"
              >
                <span className="text-lg">{action.icon}</span>
                <div className="text-sm text-slate-700 mt-1 group-hover:text-emerald-700">{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Generic Data Table ============
function DataTable({ columns, data, onEdit, onDelete, onAction }: {
  columns: { key: string; label: string; render?: (val: any, row: any) => React.ReactNode }[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onAction?: (row: any, action: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map(col => (
              <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 whitespace-nowrap">{col.label}</th>
            ))}
            {(onEdit || onDelete || onAction) && <th className="px-4 py-3 text-left font-semibold text-slate-700">操作</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-400">暂无数据</td></tr>
          ) : data.map((row, i) => (
            <tr key={row.id || i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {onAction && row.status === '待处理' && <button onClick={() => onAction(row, 'handle')} className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100">处理</button>}
                  {onAction && row.status === '待审核' && <button onClick={() => onAction(row, 'review')} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">审核</button>}
                  {onEdit && <button onClick={() => onEdit(row)} className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded hover:bg-slate-100">编辑</button>}
                  {onDelete && <button onClick={() => onDelete(row)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">删除</button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    '待审核': 'bg-amber-100 text-amber-700', '已确认': 'bg-emerald-100 text-emerald-700', '已排除': 'bg-slate-100 text-slate-600',
    '待处理': 'bg-red-100 text-red-700', '已处理': 'bg-emerald-100 text-emerald-700', '已确认': 'bg-blue-100 text-blue-700',
    '合格': 'bg-emerald-100 text-emerald-700', '不合格': 'bg-red-100 text-red-700',
    '已上报': 'bg-sky-100 text-sky-700', '评估中': 'bg-amber-100 text-amber-700', '随访中': 'bg-purple-100 text-purple-700', '已结案': 'bg-slate-100 text-slate-600',
    '草稿': 'bg-slate-100 text-slate-600', '已提交': 'bg-sky-100 text-sky-700',
    '已审核': 'bg-emerald-100 text-emerald-700', '退回': 'bg-red-100 text-red-700',
    '待检测': 'bg-amber-100 text-amber-700',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

// ============ Infection Cases Page ============
function InfectionCasesPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState({ dept: '', status: '', infectionSite: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', ...filter });
    const res = await fetch(`/api/infection-cases?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/infection-cases/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/infection-cases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    setShowForm(false); setEditItem(null); void fetchData();
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该感染病例？')) return;
    await fetch(`/api/infection-cases/${row.id}`, { method: 'DELETE' });
    void fetchData();
  };

  const columns = [
    { key: 'patientId', label: '患者ID' },
    { key: 'patientName', label: '患者姓名' },
    { key: 'gender', label: '性别' },
    { key: 'age', label: '年龄' },
    { key: 'dept', label: '科室' },
    { key: 'infectionSite', label: '感染部位' },
    { key: 'pathogen', label: '病原体', render: (v: string) => <span className="text-xs max-w-[120px] truncate block">{v || '-'}</span> },
    { key: 'infectionDate', label: '感染日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">🔬 感染病例管理</h2>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500 transition-colors shadow-sm">+ 新增病例</button>
      </div>
      <div className="flex gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <select value={filter.dept} onChange={e => setFilter(f => ({ ...f, dept: e.target.value }))} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm">
          <option value="">全部科室</option>
          {['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '血液科', '肿瘤科'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm">
          <option value="">全部状态</option>
          {['待审核', '已确认', '已排除'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.infectionSite} onChange={e => setFilter(f => ({ ...f, infectionSite: e.target.value }))} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm">
          <option value="">全部部位</option>
          {['手术部位', '呼吸道', '泌尿道', '血流', '皮肤软组织', '胃肠道', '中枢神经'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setPage(1)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">🔍 查询</button>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : (
        <DataTable columns={columns} data={data} onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} />
      )}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>共 {total} 条记录</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50">上一页</button>
          <span className="px-3 py-1">第 {page} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50">下一页</button>
        </div>
      </div>
      {showForm && <InfectionCaseForm item={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}

// ============ Infection Case Form ============
function InfectionCaseForm({ item, onSave, onClose }: { item?: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    patientId: item?.patientId || '', patientName: item?.patientName || '', gender: item?.gender || '男',
    age: item?.age || '', dept: item?.dept || '内科', infectionSite: item?.infectionSite || '',
    pathogen: item?.pathogen || '', infectionDate: item?.infectionDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    admissionDate: item?.admissionDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    status: item?.status || '待审核',
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{item ? '编辑感染病例' : '新增感染病例'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: '患者ID', key: 'patientId', type: 'text' },
              { label: '患者姓名', key: 'patientName', type: 'text' },
              { label: '性别', key: 'gender', type: 'select', options: ['男', '女'] },
              { label: '年龄', key: 'age', type: 'number' },
              { label: '科室', key: 'dept', type: 'select', options: ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科'] },
              { label: '感染部位', key: 'infectionSite', type: 'select', options: ['手术部位', '呼吸道', '泌尿道', '血流', '皮肤软组织', '胃肠道'] },
              { label: '病原体', key: 'pathogen', type: 'text' },
              { label: '状态', key: 'status', type: 'select', options: ['待审核', '已确认', '已排除'] },
            ].map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={field.type} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">取消</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500">保存</button>
        </div>
      </div>
    </div>
  );
}

// ============ Warnings Page ============
function WarningsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: '', level: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: '20', ...filter });
    const res = await fetch(`/api/warnings?${params}`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page, filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleAction = async (row: any, action: string) => {
    const statusMap: Record<string, string> = { handle: '已处理', confirm: '已确认', exclude: '已排除' };
    await fetch(`/api/warnings/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: statusMap[action], handler: useAppStore.getState().currentUser?.name }) });
    fetchData();
  };

  const columns = [
    { key: 'patientId', label: '患者ID' },
    { key: 'patientName', label: '患者姓名' },
    { key: 'dept', label: '科室' },
    { key: 'warningType', label: '预警类型', render: (v: string) => <span className={`text-xs px-2 py-0.5 rounded-full ${v === '暴发预警' ? 'bg-red-100 text-red-700' : v === '聚集预警' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>{v}</span> },
    { key: 'warningLevel', label: '预警级别', render: (v: string) => <span className={`text-xs font-bold ${v === '高' ? 'text-red-600' : v === '中' ? 'text-amber-600' : 'text-slate-500'}`}>{v}</span> },
    { key: 'description', label: '描述', render: (v: string) => <span className="text-xs max-w-[200px] truncate block" title={v}>{v}</span> },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">⚠️ 智能预警管理</h2>
      </div>
      <div className="flex gap-3 bg-white p-3 rounded-lg border border-slate-200">
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm">
          <option value="">全部类型</option>
          {['病例预警', '聚集预警', '暴发预警'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm">
          <option value="">全部状态</option>
          {['待处理', '已确认', '已排除', '已处理'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.level} onChange={e => setFilter(f => ({ ...f, level: e.target.value }))} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm">
          <option value="">全部级别</option>
          {['高', '中', '低'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button onClick={() => setPage(1)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">🔍 查询</button>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : (
        <DataTable columns={columns} data={data} onAction={handleAction} />
      )}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>共 {total} 条记录</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50">上一页</button>
          <span>第 {page} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50">下一页</button>
        </div>
      </div>
    </div>
  );
}

// ============ Target Monitoring Page ============
function TargetMonitoringPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">🎯 目标性监测</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: '手术部位感染监测', icon: '🔪', desc: 'SSI监测，含切口分类、风险分级', rate: '2.3%', color: 'border-rose-200 bg-rose-50' },
          { title: 'ICU感染监测', icon: '🏥', desc: 'VAP/CLABSI/CAUTI监测', rate: '4.8%', color: 'border-amber-200 bg-amber-50' },
          { title: '新生儿感染监测', icon: '👶', desc: '新生儿病房专项监测', rate: '1.2%', color: 'border-sky-200 bg-sky-50' },
          { title: '多重耐药菌监测', icon: '🦠', desc: 'MDRO检出率与分布监测', rate: '8.5%', color: 'border-purple-200 bg-purple-50' },
          { title: '重点科室监测', icon: '📋', desc: '血液科/烧伤科/肿瘤科', rate: '3.6%', color: 'border-teal-200 bg-teal-50' },
          { title: '导管相关监测', icon: '💉', desc: '中心静脉/导尿管/呼吸机', rate: '5.1%', color: 'border-emerald-200 bg-emerald-50' },
        ].map((item, i) => (
          <div key={i} className={`p-5 rounded-xl border ${item.color} transition-all hover:shadow-md cursor-pointer`}>
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
            <p className="text-xs text-slate-500 mb-3">{item.desc}</p>
            <div className="text-2xl font-bold text-slate-800">{item.rate}</div>
            <div className="text-xs text-slate-500 mt-1">感染发病率</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Environmental Monitor Page ============
function EnvironmentalMonitorPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/environmental-monitors?page=${page}&pageSize=20`);
    const d = await res.json();
    if (d.success) { setData(d.data.items); setTotal(d.data.total); }
    setLoading(false);
  }, [page]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    await fetch('/api/environmental-monitors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    setShowForm(false); fetchData();
  };

  const handleReview = async (row: any) => {
    await fetch(`/api/environmental-monitors/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reviewStatus: '已审核', reviewer: useAppStore.getState().currentUser?.name }) });
    fetchData();
  };

  const columns = [
    { key: 'dept', label: '科室' },
    { key: 'samplePoint', label: '采样点' },
    { key: 'sampleType', label: '采样类型' },
    { key: 'sampleDate', label: '采样日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'colonyCount', label: '菌落数' },
    { key: 'result', label: '结果', render: (v: string) => <StatusBadge status={v || '待出'} /> },
    { key: 'reviewStatus', label: '审核状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">💧 环境卫生学监测</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500 shadow-sm">+ 新增监测</button>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : (
        <DataTable columns={columns} data={data} onAction={handleReview} />
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">新增环境监测记录</h3>
            <EnvMonitorForm onSave={handleSave} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function EnvMonitorForm({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ dept: '', samplePoint: '', sampleType: '空气', sampleDate: new Date().toISOString().slice(0, 10), colonyCount: '', standardLimit: '', result: '' });
  return (
    <div className="space-y-3">
      {[
        { label: '科室', key: 'dept', type: 'select', options: ['手术室', 'ICU', '产房', '新生儿室', '供应室', '治疗室'] },
        { label: '采样点', key: 'samplePoint', type: 'text' },
        { label: '采样类型', key: 'sampleType', type: 'select', options: ['空气', '物体表面', '医务人员手'] },
        { label: '采样日期', key: 'sampleDate', type: 'date' },
        { label: '菌落数', key: 'colonyCount', type: 'number' },
        { label: '标准限值', key: 'standardLimit', type: 'number' },
        { label: '结果', key: 'result', type: 'select', options: ['合格', '不合格'] },
      ].map(f => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
          {f.type === 'select' ? (
            <select value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          )}
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">取消</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">保存</button>
      </div>
    </div>
  );
}

// ============ Sterilization Monitor Page ============
function SterilizationPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sterilization-monitors?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'batchNo', label: '批次号' },
    { key: 'sterilizer', label: '灭菌器' },
    { key: 'method', label: '灭菌方式' },
    { key: 'sterilizeDate', label: '灭菌日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'bioResult', label: '生物监测', render: (v: string) => <StatusBadge status={v || '待检测'} /> },
    { key: 'chemResult', label: '化学监测', render: (v: string) => <StatusBadge status={v || '待检测'} /> },
    { key: 'status', label: '综合状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">🔥 消毒灭菌效果监测</h2>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : <DataTable columns={columns} data={data} />}
    </div>
  );
}

// ============ Occupational Exposure Page ============
function OccupationalExposurePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch('/api/occupational-exposures?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (formData: any) => {
    await fetch('/api/occupational-exposures', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    setShowForm(false);
    fetch('/api/occupational-exposures?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); });
  };

  const columns = [
    { key: 'staffName', label: '暴露人员' },
    { key: 'staffDept', label: '科室' },
    { key: 'exposureType', label: '暴露类型' },
    { key: 'exposurePart', label: '暴露部位' },
    { key: 'exposureDate', label: '暴露日期', render: (v: string) => v?.slice(0, 10) },
    { key: 'riskLevel', label: '风险级别', render: (v: string) => <span className={`text-xs font-bold ${v === '高' ? 'text-red-600' : v === '中' ? 'text-amber-600' : 'text-slate-500'}`}>{v}</span> },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">🚨 职业暴露监测</h2>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500 shadow-sm">+ 上报暴露</button>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : <DataTable columns={columns} data={data} />}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">上报职业暴露</h3>
            <ExposureForm onSave={handleSave} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ExposureForm({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ staffName: '', staffDept: '', exposureType: '针刺伤', exposurePart: '', exposureDate: new Date().toISOString().slice(0, 10), emergencyAction: '', riskLevel: '中' });
  return (
    <div className="space-y-3">
      {[
        { label: '暴露人员', key: 'staffName', type: 'text' },
        { label: '科室', key: 'staffDept', type: 'select', options: ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科'] },
        { label: '暴露类型', key: 'exposureType', type: 'select', options: ['针刺伤', '血液体液暴露', '其他'] },
        { label: '暴露部位', key: 'exposurePart', type: 'text' },
        { label: '暴露日期', key: 'exposureDate', type: 'date' },
        { label: '紧急处理', key: 'emergencyAction', type: 'text' },
        { label: '风险级别', key: 'riskLevel', type: 'select', options: ['高', '中', '低'] },
      ].map(f => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
          {f.type === 'select' ? (
            <select value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          )}
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">取消</button>
        <button onClick={() => onSave(form)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">上报</button>
      </div>
    </div>
  );
}

// ============ Hand Hygiene Page ============
function HandHygienePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hand-hygienes?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'dept', label: '科室' },
    { key: 'month', label: '月份' },
    { key: 'totalOpportunities', label: '应执行次数' },
    { key: 'compliantActions', label: '实际执行次数' },
    { key: 'complianceRate', label: '依从率', render: (v: number) => <div className="flex items-center gap-2"><div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v}%` }} /></div><span className="text-xs font-medium">{v}%</span></div> },
    { key: 'beforeContact', label: '接触前', render: (v: number) => v ? `${v}%` : '-' },
    { key: 'afterContact', label: '接触后', render: (v: number) => v ? `${v}%` : '-' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">🤲 手卫生依从性监测</h2>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : <DataTable columns={columns} data={data} />}
    </div>
  );
}

// ============ Antibiotic Usage Page ============
function AntibioticUsagePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/antibiotic-usages?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'dept', label: '科室' },
    { key: 'month', label: '月份' },
    { key: 'totalPatients', label: '住院人数' },
    { key: 'antibioticPatients', label: '使用人数' },
    { key: 'usageRate', label: '使用率', render: (v: number) => <div className="flex items-center gap-2"><div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${v > 60 ? 'bg-red-500' : v > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(v, 100)}%` }} /></div><span className="text-xs font-medium">{v}%</span></div> },
    { key: 'ddd', label: 'DDD值', render: (v: number) => v ? v.toFixed(1) : '-' },
    { key: 'pathogenSendRate', label: '送检率', render: (v: number) => v ? `${v.toFixed(1)}%` : '-' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">💊 抗菌药物应用管理</h2>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : <DataTable columns={columns} data={data} />}
    </div>
  );
}

// ============ Infection Reports Page ============
function InfectionReportsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/infection-reports?page=1&pageSize=20').then(r => r.json()).then(d => { if (d.success) setData(d.data.items); }).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'title', label: '报告标题' },
    { key: 'type', label: '报告类型', render: (v: string) => <span className={`text-xs px-2 py-0.5 rounded-full ${v === '月报' ? 'bg-sky-100 text-sky-700' : v === '季报' ? 'bg-emerald-100 text-emerald-700' : v === '年报' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>{v}</span> },
    { key: 'period', label: '报告周期' },
    { key: 'author', label: '作者' },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', render: (v: string) => v?.slice(0, 10) },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800">📋 感染报告管理</h2>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : <DataTable columns={columns} data={data} />}
    </div>
  );
}

// ============ Statistics Page ============
function StatisticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">📈 统计分析中心</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">各科室感染率趋势</h3>
          <div className="h-48 flex items-end gap-3">
            {['ICU', '外科', '内科', '儿科', '妇产'].map((dept, i) => {
              const rates = [4.2, 2.8, 1.5, 1.1, 0.8];
              return (
                <div key={dept} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600">{rates[i]}%</span>
                  <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md" style={{ height: `${rates[i] * 30}px` }} />
                  <span className="text-xs text-slate-500">{dept}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">抗菌药物使用趋势</h3>
          <div className="h-48 flex items-end gap-2">
            {['7月', '8月', '9月', '10月', '11月', '12月'].map((m, i) => {
              const rate = 35 + Math.random() * 10;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600">{rate.toFixed(1)}%</span>
                  <div className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-md" style={{ height: `${rate * 2.5}px` }} />
                  <span className="text-xs text-slate-500">{m}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ User Management Page ============
function UserManagementPage() {
  const [data, setData] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/roles').then(r => r.json()),
    ]).then(([usersData, rolesData]) => {
      if (usersData.success) setData(usersData.data.items);
      if (rolesData.success) setRoles(rolesData.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/users/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (formData.roleIds) await fetch(`/api/users/${editItem.id}/roles`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roleIds: formData.roleIds }) });
    } else {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const d = await res.json();
      if (d.success && formData.roleIds) await fetch(`/api/users/${d.data.id}/roles`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roleIds: formData.roleIds }) });
    }
    setShowForm(false); setEditItem(null);
    const d = await (await fetch('/api/users')).json();
    if (d.success) setData(d.data.items);
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该用户？')) return;
    await fetch(`/api/users/${row.id}`, { method: 'DELETE' });
    const d = await (await fetch('/api/users')).json();
    if (d.success) setData(d.data.items);
  };

  const columns = [
    { key: 'username', label: '用户名' },
    { key: 'name', label: '姓名' },
    { key: 'dept', label: '科室' },
    { key: 'phone', label: '手机号' },
    { key: 'roles', label: '角色', render: (v: any[]) => v?.map(r => r.role?.name || r.name).join(', ') || '-' },
    { key: 'status', label: '状态', render: (v: number) => <StatusBadge status={v === 1 ? '已启用' : '已禁用'} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">👥 用户管理</h2>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500 shadow-sm">+ 新增用户</button>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : <DataTable columns={columns} data={data} onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} />}
      {showForm && <UserForm item={editItem} roles={roles} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}

function UserForm({ item, roles, onSave, onClose }: { item?: any; roles: any[]; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    username: item?.username || '', password: item ? '' : '', name: item?.name || '',
    phone: item?.phone || '', email: item?.email || '', dept: item?.dept || '',
    status: item?.status ?? 1,
    roleIds: item?.roles?.map((r: any) => r.role?.id || r.id) || [],
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{item ? '编辑用户' : '新增用户'}</h3>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">用户名</label><input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">密码{item ? '（留空不修改）' : ''}</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">姓名</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">科室</label><input value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">手机号</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">分配角色</label>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <label key={role.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${form.roleIds.includes(role.id) ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={e => {
                    setForm(f => ({ ...f, roleIds: e.target.checked ? [...f.roleIds, role.id] : f.roleIds.filter((id: string) => id !== role.id) }));
                  }} className="sr-only" />
                  <span className="text-sm">{role.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">取消</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">保存</button>
        </div>
      </div>
    </div>
  );
}

// ============ Role Management Page ============
function RoleManagementPage() {
  const [data, setData] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/roles').then(r => r.json()),
      fetch('/api/permissions').then(r => r.json()),
      fetch('/api/menus').then(r => r.json()),
    ]).then(([rolesData, permsData, menusData]) => {
      if (rolesData.success) setData(rolesData.data);
      if (permsData.success) setPermissions(permsData.data);
      if (menusData.success) setMenus(menusData.data.items);
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/roles/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: formData.code, name: formData.name, description: formData.description }) });
      if (formData.permissionIds) await fetch(`/api/roles/${editItem.id}/permissions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissionIds: formData.permissionIds }) });
      if (formData.menuIds) await fetch(`/api/roles/${editItem.id}/menus`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menuIds: formData.menuIds }) });
    } else {
      const res = await fetch('/api/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const d = await res.json();
      if (d.success) {
        if (formData.permissionIds) await fetch(`/api/roles/${d.data.id}/permissions`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permissionIds: formData.permissionIds }) });
        if (formData.menuIds) await fetch(`/api/roles/${d.data.id}/menus`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menuIds: formData.menuIds }) });
      }
    }
    setShowForm(false); setEditItem(null);
    const d = await (await fetch('/api/roles')).json();
    if (d.success) setData(d.data);
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该角色？')) return;
    await fetch(`/api/roles/${row.id}`, { method: 'DELETE' });
    const d = await (await fetch('/api/roles')).json();
    if (d.success) setData(d.data);
  };

  const columns = [
    { key: 'code', label: '角色编码' },
    { key: 'name', label: '角色名称' },
    { key: 'description', label: '描述' },
    { key: 'permissions', label: '权限数', render: (v: any[]) => v?.length || 0 },
    { key: 'menus', label: '菜单数', render: (v: any[]) => v?.length || 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">👤 角色管理</h2>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500 shadow-sm">+ 新增角色</button>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : <DataTable columns={columns} data={data} onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} />}
      {showForm && <RoleForm item={editItem} permissions={permissions} menus={menus} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}

function RoleForm({ item, permissions, menus, onSave, onClose }: { item?: any; permissions: any[]; menus: any[]; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    code: item?.code || '', name: item?.name || '', description: item?.description || '',
    permissionIds: item?.permissions?.map((p: any) => p.permission?.id || p.id) || [],
    menuIds: item?.menus?.map((m: any) => m.menu?.id || m.id) || [],
  });

  // Group permissions by module
  const permGroups = permissions.reduce((acc, p) => {
    const mod = p.module || '其他';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold">{item ? '编辑角色' : '新增角色'}</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">角色编码</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">角色名称</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          </div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">描述</label><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">分配权限</label>
            <div className="space-y-3 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
              {Object.entries(permGroups).map(([mod, perms]) => (
                <div key={mod}>
                  <div className="text-xs font-semibold text-slate-500 mb-1">{mod}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {perms.map(p => (
                      <label key={p.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border ${form.permissionIds.includes(p.id) ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                        <input type="checkbox" checked={form.permissionIds.includes(p.id)} onChange={e => {
                          setForm(f => ({ ...f, permissionIds: e.target.checked ? [...f.permissionIds, p.id] : f.permissionIds.filter((id: string) => id !== p.id) }));
                        }} className="sr-only" />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">分配菜单</label>
            <div className="flex flex-wrap gap-1.5 border border-slate-200 rounded-lg p-3 max-h-36 overflow-y-auto">
              {menus.map(m => (
                <label key={m.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border ${form.menuIds.includes(m.id) ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  <input type="checkbox" checked={form.menuIds.includes(m.id)} onChange={e => {
                    setForm(f => ({ ...f, menuIds: e.target.checked ? [...f.menuIds, m.id] : f.menuIds.filter((id: string) => id !== m.id) }));
                  }} className="sr-only" />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-slate-200">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">取消</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">保存</button>
        </div>
      </div>
    </div>
  );
}

// ============ Menu Management Page ============
function MenuManagementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/menus');
    const d = await res.json();
    if (d.success) { setItems(d.data.items); setTree(d.data.tree); }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void fetchData(); }, [fetchData]);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/menus/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/menus', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    setShowForm(false); setEditItem(null); fetchData();
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该菜单？子菜单也会一并删除。')) return;
    await fetch(`/api/menus/${row.id}`, { method: 'DELETE' });
    fetchData();
  };

  const renderTree = (nodes: any[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-slate-50 rounded-lg border-b border-slate-100 transition-colors" style={{ paddingLeft: `${12 + depth * 24}px` }}>
          <span className="text-base">{getIcon(node.icon)}</span>
          <span className="flex-1 text-sm text-slate-700 font-medium">{node.name}</span>
          <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-100 rounded">{node.type === 'directory' ? '目录' : node.type === 'button' ? '按钮' : '菜单'}</span>
          <span className="text-xs text-slate-400">{node.code}</span>
          {node.path && <span className="text-xs text-slate-400">{node.path}</span>}
          <span className="text-xs text-slate-400">排序:{node.sort}</span>
          <div className="flex gap-1">
            <button onClick={() => { setEditItem(node); setShowForm(true); }} className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded hover:bg-slate-100">编辑</button>
            <button onClick={() => handleDelete(node)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">删除</button>
          </div>
        </div>
        {node.children?.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">📑 菜单管理</h2>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500 shadow-sm">+ 新增菜单</button>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          {tree.length > 0 ? renderTree(tree) : <div className="text-center py-8 text-slate-400">暂无菜单</div>}
        </div>
      )}
      {showForm && <MenuForm item={editItem} menus={items} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />}
    </div>
  );
}

function MenuForm({ item, menus, onSave, onClose }: { item?: any; menus: any[]; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    parentId: item?.parentId || '', name: item?.name || '', code: item?.code || '',
    path: item?.path || '', icon: item?.icon || '', type: item?.type || 'menu',
    sort: item?.sort ?? 0, visible: item?.visible ?? 1, status: item?.status ?? 1,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{item ? '编辑菜单' : '新增菜单'}</h3>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">上级菜单</label>
            <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">无（顶级菜单）</option>
              {menus.filter(m => m.type === 'directory').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">菜单名称</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">菜单编码</label><input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">路由路径</label><input value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="/path" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">图标</label><input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="directory">目录</option>
                <option value="menu">菜单</option>
                <option value="button">按钮</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">排序</label><input type="number" value={form.sort} onChange={e => setForm(f => ({ ...f, sort: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">显示</label>
              <select value={form.visible} onChange={e => setForm(f => ({ ...f, visible: Number(e.target.value) }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value={1}>显示</option>
                <option value={0}>隐藏</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">取消</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">保存</button>
        </div>
      </div>
    </div>
  );
}

// ============ Permission Management Page ============
function PermissionManagementPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  useEffect(() => {
    fetch('/api/permissions').then(r => r.json()).then(d => { if (d.success) setData(d.data); }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (formData: any) => {
    if (editItem) {
      await fetch(`/api/permissions/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    } else {
      await fetch('/api/permissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    }
    setShowForm(false); setEditItem(null);
    const d = await (await fetch('/api/permissions')).json();
    if (d.success) setData(d.data);
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该权限？')) return;
    await fetch(`/api/permissions/${row.id}`, { method: 'DELETE' });
    const d = await (await fetch('/api/permissions')).json();
    if (d.success) setData(d.data);
  };

  // Group by module
  const grouped = data.reduce((acc, p) => {
    const mod = p.module || '其他';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">🔑 权限管理</h2>
        <button onClick={() => { setEditItem(null); setShowForm(true); }} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500 shadow-sm">+ 新增权限</button>
      </div>
      {loading ? <div className="text-center py-8 text-slate-400 animate-pulse">加载中...</div> : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([mod, perms]) => (
            <div key={mod} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">{mod}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-4 py-2 text-left text-slate-600">权限名称</th>
                    <th className="px-4 py-2 text-left text-slate-600">权限编码</th>
                    <th className="px-4 py-2 text-left text-slate-600">类型</th>
                    <th className="px-4 py-2 text-left text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {perms.map(p => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2 text-slate-700">{p.name}</td>
                      <td className="px-4 py-2 text-slate-500 font-mono text-xs">{p.code}</td>
                      <td className="px-4 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${p.type === 'menu' ? 'bg-sky-100 text-sky-700' : 'bg-purple-100 text-purple-700'}`}>{p.type === 'menu' ? '菜单' : '按钮'}</span></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditItem(p); setShowForm(true); }} className="text-xs px-2 py-1 bg-slate-50 text-slate-600 rounded hover:bg-slate-100">编辑</button>
                          <button onClick={() => handleDelete(p)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{editItem ? '编辑权限' : '新增权限'}</h3>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">权限名称</label><input value={editItem?.name || ''} onChange={e => setEditItem({ ...editItem, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">权限编码</label><input value={editItem?.code || ''} onChange={e => setEditItem({ ...editItem, code: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                  <select value={editItem?.type || 'button'} onChange={e => setEditItem({ ...editItem, type: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value="menu">菜单权限</option><option value="button">按钮权限</option><option value="api">接口权限</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">所属模块</label><input value={editItem?.module || ''} onChange={e => setEditItem({ ...editItem, module: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm">取消</button>
              <button onClick={() => handleSave(editItem)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Content Router ============
function ContentArea() {
  const activeMenu = useAppStore(s => s.activeMenu);

  const pages: Record<string, React.ReactNode> = {
    'dashboard': <DashboardPage />,
    'infection-case': <InfectionCasesPage />,
    'infection-warning': <WarningsPage />,
    'infection-target': <TargetMonitoringPage />,
    'data-statistics': <StatisticsPage />,
    'data-report': <InfectionReportsPage />,
    'env-hygiene': <EnvironmentalMonitorPage />,
    'env-sterilization': <SterilizationPage />,
    'occupational-exposure': <OccupationalExposurePage />,
    'hand-hygiene': <HandHygienePage />,
    'antibiotic': <AntibioticUsagePage />,
    'system-user': <UserManagementPage />,
    'system-role': <RoleManagementPage />,
    'system-menu': <MenuManagementPage />,
    'system-permission': <PermissionManagementPage />,
  };

  return (
    <div className="p-6">
      {pages[activeMenu] || <DashboardPage />}
    </div>
  );
}

// ============ Main App ============
function MainApp() {
  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <ContentArea />
        </main>
        <footer className="h-8 bg-white border-t border-slate-200 flex items-center justify-center text-xs text-slate-400">
          医院感染管理系统 v1.0 © 2024
        </footer>
      </div>
    </div>
  );
}

// ============ Root Page ============
export default function Home() {
  const currentUser = useAppStore(s => s.currentUser);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Seed database on first load
    fetch('/api/seed', { method: 'POST' }).then(r => r.json()).then(d => {
      console.log('Seed result:', d);
    }).catch(e => {
      console.log('Seed already done or error:', e);
    }).finally(() => setInitializing(false));
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏥</div>
          <div className="text-white text-lg">系统初始化中...</div>
          <div className="text-slate-400 text-sm mt-2">正在加载初始数据</div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <MainApp />;
}
