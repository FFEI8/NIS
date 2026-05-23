'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import type { MenuItem, DashboardStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  LayoutDashboard, Activity, FileText, AlertTriangle, Target, BarChart3, PieChart,
  FileSpreadsheet, ShieldCheck, Droplets, Flame, HardHat, ShieldAlert, Hand,
  Pill, Settings, Users, UserCog, Menu as MenuIcon, KeyRound, ChevronRight,
  ChevronDown, ChevronLeft, Plus, Edit, Trash2, Search, RefreshCw, X, Check,
  Home as HomeIcon, Bell, LogOut, Moon, Sun, User, Lock, Eye, EyeOff, Save, Download,
  Upload, Hospital, Stethoscope, Bug, Syringe, Microscope, Thermometer,
  ClipboardList, Shield, Zap, Clock, ChevronUp, AlertCircle, CheckCircle2,
  Info, XCircle, FileBarChart, TrendingUp, TrendingDown, RotateCcw,
  UserPlus, ShieldHalf, Network, Key, MoreHorizontal, ArrowLeft, ArrowRight,
} from 'lucide-react';

// ============ Icon Mapping (Lucide React) ============
const lucideIconMap: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  LayoutDashboard, Activity, FileText, AlertTriangle, Target, BarChart3, PieChart,
  FileSpreadsheet, ShieldCheck, Droplets, Flame, HardHat, ShieldAlert, Hand,
  Pill, Settings, Users, UserCog, Menu: MenuIcon, KeyRound, ChevronRight,
  ChevronDown, ChevronLeft, Plus, Edit, Trash2, Search, RefreshCw, X, Check,
  Home, Bell, LogOut, Moon, Sun, User, Lock, Eye, Save, Download, Upload,
  Hospital, Stethoscope, Bug, Syringe, Microscope, Thermometer,
  ClipboardList, Shield, Zap,
};

function LucideIcon({ name, size = 18, className }: { name?: string; size?: number; className?: string }) {
  if (!name) return null;
  const IconComponent = lucideIconMap[name];
  if (!IconComponent) return <FileText size={size} className={className} />;
  return <IconComponent size={size} className={className} />;
}

// ============ Dark Mode Hook ============
function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('hims-dark-mode');
    if (saved === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);
  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem('hims-dark-mode', String(next));
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  }, []);
  return { dark, toggle };
}

// ============ Animated Counter ============
function AnimatedCounter({ target, duration = 1200, suffix = '' }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return <span>{count}{suffix}</span>;
}

// ============ Circular Progress ============
function CircularProgress({ value, size = 64, strokeWidth = 5, color = '#10b981' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
    </svg>
  );
}

// ============ Real-time Clock ============
function RealTimeClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      <Clock size={13} />
      <span>{time.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
    </div>
  );
}

// ============ Enhanced Login Page ============
function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const login = useAppStore(s => s.login);

  useEffect(() => {
    const saved = localStorage.getItem('hims-remember');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUsername(data.username || '');
        setPassword(data.password || '');
        setRemember(true);
      } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('用户名或密码错误');
    } else if (remember) {
      localStorage.setItem('hims-remember', JSON.stringify({ username, password }));
    } else {
      localStorage.removeItem('hims-remember');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-teal-300/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        {/* Floating medical crosses */}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="absolute animate-ping text-emerald-500/10" style={{
            left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 30}%`,
            animationDuration: `${3 + i}s`, animationDelay: `${i * 0.5}s`,
          }}>
            <Plus size={20 + i * 4} />
          </div>
        ))}
      </div>

      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mb-4">
              <Hospital size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">医院感染管理系统</h1>
            <p className="text-slate-400 mt-2 text-sm">Hospital Infection Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <span className="flex items-center gap-1.5"><User size={14} /> 用户名</span>
              </label>
              <div className="relative">
                <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all pr-10"
                  placeholder="请输入用户名" />
                <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <span className="flex items-center gap-1.5"><Lock size={14} /> 密码</span>
              </label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all pr-10"
                  placeholder="请输入密码" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setRemember(!remember)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${remember ? 'bg-emerald-600 border-emerald-500' : 'bg-white/10 border-white/30'}`}>
                {remember && <Check size={12} className="text-white" />}
              </button>
              <span className="text-sm text-slate-400">记住密码</span>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>登 录</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 p-4 bg-white/5 rounded-xl">
            <p className="text-slate-400 text-xs text-center mb-2">演示账号</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: '管理员', user: 'admin', pass: 'admin123' },
                { label: '感控专员', user: 'gkzj', pass: 'gkzj123' },
                { label: '临床医师', user: 'doctor', pass: 'doctor123' },
              ].map(d => (
                <button key={d.user} type="button" onClick={() => { setUsername(d.user); setPassword(d.pass); }}
                  className="text-center p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-emerald-400 font-medium">{d.label}</div>
                  <div className="text-slate-500">{d.user}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Notification Center ============
interface Notification {
  id: string; type: 'warning' | 'approval' | 'system'; title: string; message: string; time: string; read: boolean;
}

function NotificationCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const notifications: Notification[] = useMemo(() => [
    { id: '1', type: 'warning', title: '暴发预警', message: 'ICU病房检测到疑似感染暴发趋势，请及时处理', time: '5分钟前', read: false },
    { id: '2', type: 'approval', title: '待审核病例', message: '新增3例感染病例待审核确认', time: '15分钟前', read: false },
    { id: '3', type: 'warning', title: '环境监测异常', message: '手术室空气菌落数超标，需重新监测', time: '1小时前', read: false },
    { id: '4', type: 'system', title: '系统更新', message: '系统已升级至v1.1版本，新增数据导出功能', time: '2小时前', read: true },
    { id: '5', type: 'approval', title: '报告审批', message: '12月份感染月报待审批', time: '3小时前', read: true },
  ], []);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'approval': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'system': return <Info size={16} className="text-sky-500" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-14 right-24 w-96 max-h-[500px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bell size={18} /> 通知中心
            <Badge variant="secondary" className="text-xs">{notifications.filter(n => !n.read).length} 未读</Badge>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X size={18} /></button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map(n => (
            <div key={n.id} className={`px-4 py-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!n.read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex-shrink-0">{typeIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</span>
                    {!n.read && <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1">{n.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 text-center border-t border-slate-200 dark:border-slate-700">
          <button className="text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 font-medium">查看全部通知</button>
        </div>
      </div>
    </div>
  );
}

// ============ User Profile Dialog ============
function UserProfileDialog({ open, onClose, currentUser }: { open: boolean; onClose: () => void; currentUser: any }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', dept: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && currentUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ name: currentUser.name || '', phone: currentUser.phone || '', email: currentUser.email || '', dept: currentUser.dept || '' });
    }
  }, [open, currentUser]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User size={20} /> 个人信息</DialogTitle>
          <DialogDescription>修改您的个人资料信息</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
              {currentUser?.name?.[0] || 'U'}
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">{currentUser?.name}</div>
              <div className="text-sm text-slate-500">{currentUser?.roles?.map((r: any) => r.name).join(', ')}</div>
            </div>
          </div>
          {[
            { label: '姓名', key: 'name', icon: <User size={14} /> },
            { label: '科室', key: 'dept', icon: <Hospital size={14} /> },
            { label: '手机号', key: 'phone', icon: <PhoneIcon width={14} height={14} /> },
            { label: '邮箱', key: 'email', icon: <MailIcon width={14} height={14} /> },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                {f.icon} {f.label}
              </label>
              <Input value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.width || 14} height={props.height || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={props.width || 14} height={props.height || 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}

// ============ Breadcrumb ============
function BreadcrumbNav() {
  const { activeMenu, userMenus } = useAppStore();

  const getBreadcrumb = useCallback(() => {
    const crumbs: { label: string; code: string }[] = [{ label: '首页', code: 'dashboard' }];
    const findMenu = (menus: MenuItem[], target: string, path: MenuItem[] = []): MenuItem[] | null => {
      for (const m of menus) {
        if (m.code === target) return [...path, m];
        if (m.children?.length) {
          const found = findMenu(m.children, target, [...path, m]);
          if (found) return found;
        }
      }
      return null;
    };
    const found = findMenu(userMenus, activeMenu);
    if (found) {
      found.forEach(m => crumbs.push({ label: m.name, code: m.code }));
    }
    return crumbs;
  }, [activeMenu, userMenus]);

  const crumbs = getBreadcrumb();

  return (
    <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
      {crumbs.map((c, i) => (
        <span key={c.code} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />}
          <span className={i === crumbs.length - 1 ? 'text-slate-800 dark:text-slate-200 font-medium' : 'hover:text-emerald-600 cursor-pointer'}
            onClick={() => i < crumbs.length - 1 && useAppStore.getState().setActiveMenu(c.code)}>
            {i === 0 && <HomeIcon size={13} className="inline mr-0.5" />}
            {c.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

// ============ Sidebar ============
function Sidebar() {
  const { userMenus, sidebarCollapsed, toggleSidebar, activeMenu, setActiveMenu, currentUser } = useAppStore();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['infection-monitor', 'data-analysis', 'env-monitor', 'occupational-safety', 'system']));
  const [animating, setAnimating] = useState(false);

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

  const handleToggleSidebar = () => {
    setAnimating(true);
    toggleSidebar();
    setTimeout(() => setAnimating(false), 300);
  };

  const renderMenuItems = (items: MenuItem[], depth = 0) => {
    return items.filter(m => m.visible === 1 && m.status === 1).map(menu => {
      const isActive = activeMenu === menu.code;
      const isExpanded = expandedMenus.has(menu.code);
      const hasChildren = menu.children && menu.children.length > 0;

      return (
        <div key={menu.id}>
          <div
            className={`flex items-center gap-2.5 py-2.5 mx-2 rounded-lg cursor-pointer transition-all duration-200 group relative
              ${isActive && !hasChildren ? 'bg-emerald-600/15 text-emerald-400 dark:text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
            style={{ paddingLeft: `${12 + depth * 16}px`, paddingRight: '12px' }}
            onClick={() => handleMenuClick(menu)}
          >
            {/* Active left border indicator */}
            {isActive && !hasChildren && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-emerald-500 rounded-r-full" />
            )}
            <LucideIcon name={menu.icon} size={18} className={`flex-shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-sm font-medium truncate">{menu.name}</span>
                {hasChildren && (
                  <ChevronRight size={14} className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                )}
              </>
            )}
          </div>
          {/* Animated children container */}
          {hasChildren && !sidebarCollapsed && (
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              {renderMenuItems(menu.children, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside className={`h-full bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-60'}`}>
      <div className="flex items-center h-14 px-4 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <Hospital size={22} className="text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-bold text-white truncate">感染管理系统</span>
          </div>
        )}
        {sidebarCollapsed && <Hospital size={22} className="text-emerald-400 mx-auto" />}
        <button onClick={handleToggleSidebar}
          className={`${sidebarCollapsed ? 'mx-auto mt-1' : 'ml-auto'} text-slate-400 hover:text-white p-1 rounded transition-colors`}>
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {renderMenuItems(userMenus)}
      </nav>
      {/* User info at bottom of sidebar */}
      {currentUser && !sidebarCollapsed && (
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              {currentUser.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{currentUser.name}</div>
              <div className="text-xs text-slate-500 truncate">{currentUser.dept}</div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

// ============ Header ============
function Header() {
  const currentUser = useAppStore(s => s.currentUser);
  const logout = useAppStore(s => s.logout);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const { dark, toggle } = useDarkMode();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:px-6 shadow-sm z-40">
        <div className="flex-1 flex items-center gap-4">
          <BreadcrumbNav />
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <RealTimeClock />
          {/* Dark mode toggle */}
          <Button variant="ghost" size="icon" onClick={toggle} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {/* Notification bell */}
          <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">3</span>
          </Button>
          {/* User dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {currentUser?.name?.[0] || 'U'}
              </div>
              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium hidden sm:inline">{currentUser?.name}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{currentUser?.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{currentUser?.dept} · {currentUser?.roles?.map((r: any) => r.name).join(', ')}</div>
                </div>
                <button onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center gap-2">
                  <User size={15} /> 个人资料
                </button>
                <button onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2">
                  <LogOut size={15} /> 退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <NotificationCenter open={showNotifications} onClose={() => setShowNotifications(false)} />
      <UserProfileDialog open={showProfile} onClose={() => setShowProfile(false)} currentUser={currentUser} />
    </>
  );
}

// ============ Status Badge (Fixed duplicate key) ============
function StatusBadge({ status }: { status: string }) {
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
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400'}`}>{status}</span>;
}

// ============ Enhanced Data Table ============
function DataTable({ columns, data, onEdit, onDelete, onAction, loading, onExport }: {
  columns: { key: string; label: string; render?: (val: any, row: any) => React.ReactNode }[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onAction?: (row: any, action: string) => void;
  loading?: boolean;
  onExport?: () => void;
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{col.label}</th>
              ))}
              {(onEdit || onDelete || onAction) && <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">操作</th>}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-700">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                ))}
                {(onEdit || onDelete || onAction) && <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {onExport && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
            <Download size={14} /> 导出数据
          </Button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{col.label}</th>
              ))}
              {(onEdit || onDelete || onAction) && <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">操作</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                <div className="flex flex-col items-center gap-2">
                  <FileText size={32} className="text-slate-300 dark:text-slate-600" />
                  <span>暂无数据</span>
                </div>
              </td></tr>
            ) : data.map((row, i) => (
              <tr key={row.id || i} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {onAction && row.status === '待处理' && <Button variant="ghost" size="sm" onClick={() => onAction(row, 'handle')} className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-500"><Check size={12} />处理</Button>}
                    {onAction && row.status === '待审核' && <Button variant="ghost" size="sm" onClick={() => onAction(row, 'review')} className="h-7 text-xs gap-1 text-sky-600 hover:text-sky-500"><CheckCircle2 size={12} />审核</Button>}
                    {onEdit && <Button variant="ghost" size="sm" onClick={() => onEdit(row)} className="h-7 text-xs gap-1"><Edit size={12} />编辑</Button>}
                    {onDelete && <Button variant="ghost" size="sm" onClick={() => onDelete(row)} className="h-7 text-xs gap-1 text-red-600 hover:text-red-500"><Trash2 size={12} />删除</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ Pagination ============
function Pagination({ page, total, pageSize = 20, onPageChange }: { page: number; total: number; pageSize?: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
      <span>共 {total} 条记录</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
          className="gap-1"><ArrowLeft size={14} /> 上一页</Button>
        <span className="px-3">第 {page} / {totalPages || 1} 页</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="gap-1">下一页 <ArrowRight size={14} /></Button>
      </div>
    </div>
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

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );

  if (!stats) return <div className="text-center text-slate-400 py-8">暂无数据</div>;

  const statCards = [
    { label: '累计感染病例', value: stats.totalInfections, icon: <Activity size={22} />, color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800', trend: `本月+${stats.monthInfections}`, trendIcon: <TrendingUp size={12} /> },
    { label: '待处理预警', value: stats.pendingWarnings, icon: <AlertTriangle size={22} />, color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800', trend: '需及时处理', trendIcon: <Zap size={12} /> },
    { label: '多重耐药菌', value: stats.mdroCount, icon: <Bug size={22} />, color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800', trend: '重点关注', trendIcon: <AlertCircle size={12} /> },
    { label: '抗菌药物使用率', value: stats.antibioticUsageRate, suffix: '%', icon: <Pill size={22} />, color: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800', trend: '持续监测', trendIcon: <Activity size={12} /> },
    { label: '手卫生依从率', value: stats.handHygieneRate, suffix: '%', icon: <Hand size={22} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800', trend: '稳步提升', trendIcon: <TrendingUp size={12} /> },
    { label: '环境卫生合格率', value: stats.envHygieneRate, suffix: '%', icon: <ShieldCheck size={22} />, color: 'bg-cyan-50 text-cyan-600 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800', trend: '达标', trendIcon: <CheckCircle2 size={12} /> },
    { label: '职业暴露事件', value: stats.exposureCount, icon: <HardHat size={22} />, color: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800', trend: '本年度累计', trendIcon: <ShieldAlert size={12} /> },
    { label: '本月新增感染', value: stats.monthInfections, icon: <TrendingDown size={22} />, color: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800', trend: '同比-12%', trendIcon: <TrendingDown size={12} /> },
  ];

  // Circular progress data
  const circularData = [
    { label: '手卫生依从率', value: stats.handHygieneRate, color: '#10b981' },
    { label: '抗菌药物使用率', value: stats.antibioticUsageRate, color: '#f59e0b' },
    { label: '环境合格率', value: stats.envHygieneRate, color: '#06b6d4' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">感染监控概览</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">实时监控医院感染相关指标</p>
        </div>
        <RealTimeClock />
      </div>

      {/* Stat cards with animated counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={`p-4 rounded-xl border ${card.color} transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}>
            <div className="flex items-center justify-between mb-2">
              <div className="opacity-80">{card.icon}</div>
              <span className="text-[10px] opacity-60 flex items-center gap-0.5">{card.trendIcon}{card.trend}</span>
            </div>
            <div className="text-2xl font-bold">
              <AnimatedCounter target={card.value} suffix={card.suffix || ''} />
            </div>
            <div className="text-xs opacity-70 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Circular progress indicators */}
      <div className="grid grid-cols-3 gap-4">
        {circularData.map((item, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="relative">
              <CircularProgress value={item.value} size={56} strokeWidth={5} color={item.color} />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-800 dark:text-slate-200">{item.value}%</div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.label}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.value >= 80 ? '达标' : item.value >= 60 ? '待改善' : '需关注'}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infection Trend */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-500" /> 感染趋势（近12月）
          </h3>
          <div className="h-64 flex items-end gap-2">
            {stats.infectionTrend.map((item, i) => {
              const maxCount = Math.max(...stats.infectionTrend.map(t => t.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                  <div
                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300 min-h-[4px] group-hover:opacity-80"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 -rotate-45 origin-center whitespace-nowrap">{item.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Site Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <PieChart size={18} className="text-emerald-500" /> 感染部位分布
          </h3>
          <div className="space-y-3">
            {stats.siteDistribution.map((item, i) => {
              const maxCount = Math.max(...stats.siteDistribution.map(s => s.count), 1);
              const pct = (item.count / maxCount) * 100;
              const colors = ['bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-rose-500', 'bg-amber-500', 'bg-purple-500', 'bg-orange-500'];
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{item.site}</span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.count}例</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dept Infection Rate */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> 科室感染率
          </h3>
          <div className="space-y-4">
            {stats.deptInfectionRate.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm text-slate-700 dark:text-slate-300 w-16 text-right">{item.dept}</span>
                <div className="flex-1 h-8 bg-slate-50 dark:bg-slate-700 rounded-lg overflow-hidden relative">
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Zap size={18} className="text-emerald-500" /> 快捷操作
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '新增感染病例', icon: <Microscope size={20} />, menu: 'infection-case' },
              { label: '处理预警', icon: <AlertTriangle size={20} />, menu: 'infection-warning' },
              { label: '环境监测录入', icon: <Droplets size={20} />, menu: 'env-hygiene' },
              { label: '职业暴露上报', icon: <ShieldAlert size={20} />, menu: 'occupational-exposure' },
              { label: '抗菌药物管理', icon: <Pill size={20} />, menu: 'antibiotic' },
              { label: '感染报告', icon: <FileSpreadsheet size={20} />, menu: 'data-report' },
            ].map((action, i) => (
              <button key={i}
                onClick={() => useAppStore.getState().setActiveMenu(action.menu)}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-200 text-left group">
                <div className="text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform">{action.icon}</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{action.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ Form Field Component ============
function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
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

  const handleExport = () => {
    const csv = ['患者ID,患者姓名,性别,年龄,科室,感染部位,病原体,感染日期,状态',
      ...data.map(r => `${r.patientId},${r.patientName},${r.gender},${r.age},${r.dept},${r.infectionSite},${r.pathogen || ''},${r.infectionDate?.slice(0, 10)},${r.status}`)
    ].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = '感染病例数据.csv'; a.click();
    URL.revokeObjectURL(url);
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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Activity size={22} className="text-emerald-500" /> 感染病例管理
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增病例
        </Button>
      </div>
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <select value={filter.dept} onChange={e => setFilter(f => ({ ...f, dept: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部科室</option>
          {['ICU', '外科', '内科', '儿科', '妇产科', '急诊科', '血液科', '肿瘤科'].map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          {['待审核', '已确认', '已排除'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.infectionSite} onChange={e => setFilter(f => ({ ...f, infectionSite: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部部位</option>
          {['手术部位', '呼吸道', '泌尿道', '血流', '皮肤软组织', '胃肠道', '中枢神经'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} onExport={handleExport} />
      <Pagination page={page} total={total} onPageChange={setPage} />
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.patientId || !form.patientName) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" />
            {item ? '编辑感染病例' : '新增感染病例'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          {[
            { label: '患者ID', key: 'patientId', type: 'text', required: true },
            { label: '患者姓名', key: 'patientName', type: 'text', required: true },
            { label: '性别', key: 'gender', type: 'select', options: ['男', '女'] },
            { label: '年龄', key: 'age', type: 'number' },
            { label: '科室', key: 'dept', type: 'select', options: ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科'] },
            { label: '感染部位', key: 'infectionSite', type: 'select', options: ['手术部位', '呼吸道', '泌尿道', '血流', '皮肤软组织', '胃肠道'], required: true },
            { label: '病原体', key: 'pathogen', type: 'text' },
            { label: '状态', key: 'status', type: 'select', options: ['待审核', '已确认', '已排除'] },
          ].map(field => (
            <FormField key={field.key} label={field.label} required={field.required}>
              {field.type === 'select' ? (
                <select value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500">
                  {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input type={field.type} value={(form as any)[field.key]} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
              )}
            </FormField>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.patientId || !form.patientName} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    { key: 'warningType', label: '预警类型', render: (v: string) => <Badge variant={v === '暴发预警' ? 'destructive' : 'secondary'} className="text-xs">{v}</Badge> },
    { key: 'warningLevel', label: '预警级别', render: (v: string) => <span className={`text-xs font-bold ${v === '高' ? 'text-red-600' : v === '中' ? 'text-amber-600' : 'text-slate-500'}`}>{v}</span> },
    { key: 'description', label: '描述', render: (v: string) => <span className="text-xs max-w-[200px] truncate block" title={v}>{v}</span> },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <AlertTriangle size={22} className="text-amber-500" /> 智能预警管理
        </h2>
      </div>
      <div className="flex gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
        <select value={filter.type} onChange={e => setFilter(f => ({ ...f, type: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部类型</option>
          {['病例预警', '聚集预警', '暴发预警'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部状态</option>
          {['待处理', '已确认', '已排除', '已处理'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filter.level} onChange={e => setFilter(f => ({ ...f, level: e.target.value }))}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          <option value="">全部级别</option>
          {['高', '中', '低'].map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={() => setPage(1)} className="gap-1.5">
          <Search size={14} /> 查询
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onAction={handleAction} />
      <Pagination page={page} total={total} onPageChange={setPage} />
    </div>
  );
}

// ============ Target Monitoring Page ============
function TargetMonitoringPage() {
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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Droplets size={22} className="text-cyan-500" /> 环境卫生学监测
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增监测
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onAction={handleReview} />
      <Pagination page={page} total={total} onPageChange={setPage} />
      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Droplets size={20} className="text-cyan-500" /> 新增环境监测记录</DialogTitle>
            </DialogHeader>
            <EnvMonitorForm onSave={handleSave} onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function EnvMonitorForm({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ dept: '', samplePoint: '', sampleType: '空气', sampleDate: new Date().toISOString().slice(0, 10), colonyCount: '', standardLimit: '', result: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <>
      <div className="space-y-3 py-2">
        {[
          { label: '科室', key: 'dept', type: 'select', options: ['手术室', 'ICU', '产房', '新生儿室', '供应室', '治疗室'], required: true },
          { label: '采样点', key: 'samplePoint', type: 'text', required: true },
          { label: '采样类型', key: 'sampleType', type: 'select', options: ['空气', '物体表面', '医务人员手'] },
          { label: '采样日期', key: 'sampleDate', type: 'date' },
          { label: '菌落数', key: 'colonyCount', type: 'number' },
          { label: '标准限值', key: 'standardLimit', type: 'number' },
          { label: '结果', key: 'result', type: 'select', options: ['合格', '不合格'] },
        ].map(f => (
          <FormField key={f.key} label={f.label} required={f.required}>
            {f.type === 'select' ? (
              <select value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <Input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
            )}
          </FormField>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>取消</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? '保存中...' : '保存'}
        </Button>
      </DialogFooter>
    </>
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
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Flame size={22} className="text-orange-500" /> 消毒灭菌效果监测
      </h2>
      <DataTable columns={columns} data={data} loading={loading} />
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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ShieldAlert size={22} className="text-orange-500" /> 职业暴露监测
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 上报暴露
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} />
      {showForm && (
        <Dialog open onOpenChange={() => setShowForm(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ShieldAlert size={20} className="text-orange-500" /> 上报职业暴露</DialogTitle>
            </DialogHeader>
            <ExposureForm onSave={handleSave} onClose={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ExposureForm({ onSave, onClose }: { onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({ staffName: '', staffDept: '', exposureType: '针刺伤', exposurePart: '', exposureDate: new Date().toISOString().slice(0, 10), emergencyAction: '', riskLevel: '中' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.staffName || !form.exposurePart) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <>
      <div className="space-y-3 py-2">
        {[
          { label: '暴露人员', key: 'staffName', type: 'text', required: true },
          { label: '科室', key: 'staffDept', type: 'select', options: ['ICU', '外科', '内科', '儿科', '妇产科', '急诊科'] },
          { label: '暴露类型', key: 'exposureType', type: 'select', options: ['针刺伤', '血液体液暴露', '其他'] },
          { label: '暴露部位', key: 'exposurePart', type: 'text', required: true },
          { label: '暴露日期', key: 'exposureDate', type: 'date' },
          { label: '紧急处理', key: 'emergencyAction', type: 'text' },
          { label: '风险级别', key: 'riskLevel', type: 'select', options: ['高', '中', '低'] },
        ].map(f => (
          <FormField key={f.key} label={f.label} required={f.required}>
            {f.type === 'select' ? (
              <select value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <Input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))} />
            )}
          </FormField>
        ))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>取消</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
          {saving ? '提交中...' : '上报'}
        </Button>
      </DialogFooter>
    </>
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
    { key: 'complianceRate', label: '依从率', render: (v: number) => <div className="flex items-center gap-2"><div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${v >= 80 ? 'bg-emerald-500' : v >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v}%` }} /></div><span className="text-xs font-medium">{v}%</span></div> },
    { key: 'beforeContact', label: '接触前', render: (v: number) => v ? `${v}%` : '-' },
    { key: 'afterContact', label: '接触后', render: (v: number) => v ? `${v}%` : '-' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Hand size={22} className="text-emerald-500" /> 手卫生依从性监测
      </h2>
      <DataTable columns={columns} data={data} loading={loading} />
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
    { key: 'usageRate', label: '使用率', render: (v: number) => <div className="flex items-center gap-2"><div className="w-16 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full ${v > 60 ? 'bg-red-500' : v > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(v, 100)}%` }} /></div><span className="text-xs font-medium">{v}%</span></div> },
    { key: 'ddd', label: 'DDD值', render: (v: number) => v ? v.toFixed(1) : '-' },
    { key: 'pathogenSendRate', label: '送检率', render: (v: number) => v ? `${v.toFixed(1)}%` : '-' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Pill size={22} className="text-teal-500" /> 抗菌药物应用管理
      </h2>
      <DataTable columns={columns} data={data} loading={loading} />
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
    { key: 'type', label: '报告类型', render: (v: string) => <Badge variant="secondary" className="text-xs">{v}</Badge> },
    { key: 'period', label: '报告周期' },
    { key: 'author', label: '作者' },
    { key: 'status', label: '状态', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'createdAt', label: '创建时间', render: (v: string) => v?.slice(0, 10) },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <FileSpreadsheet size={22} className="text-emerald-500" /> 感染报告管理
      </h2>
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
}

// ============ Statistics Page ============
function StatisticsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <BarChart3 size={22} className="text-emerald-500" /> 统计分析中心
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">各科室感染率趋势</h3>
          <div className="h-48 flex items-end gap-3">
            {['ICU', '外科', '内科', '儿科', '妇产'].map((dept, i) => {
              const rates = [4.2, 2.8, 1.5, 1.1, 0.8];
              return (
                <div key={dept} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{rates[i]}%</span>
                  <div className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md" style={{ height: `${rates[i] * 30}px` }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{dept}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">抗菌药物使用趋势</h3>
          <div className="h-48 flex items-end gap-2">
            {['7月', '8月', '9月', '10月', '11月', '12月'].map((m, i) => {
              const rate = 35 + Math.random() * 10;
              return (
                <div key={m} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{rate.toFixed(1)}%</span>
                  <div className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-md" style={{ height: `${rate * 2.5}px` }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{m}</span>
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
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Users size={22} className="text-emerald-500" /> 用户管理
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <UserPlus size={16} /> 新增用户
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} />
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.username || !form.name) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserCog size={20} className="text-emerald-500" /> {item ? '编辑用户' : '新增用户'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <FormField label="用户名" required>
            <Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </FormField>
          <FormField label={`密码${item ? '（留空不修改）' : ''}`} required={!item}>
            <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </FormField>
          <FormField label="姓名" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="科室"><Input value={form.dept} onChange={e => setForm(f => ({ ...f, dept: e.target.value }))} /></FormField>
            <FormField label="手机号"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></FormField>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <ShieldHalf size={14} /> 分配角色
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map(role => (
                <label key={role.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all ${form.roleIds.includes(role.id) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}>
                  <input type="checkbox" checked={form.roleIds.includes(role.id)} onChange={e => {
                    setForm(f => ({ ...f, roleIds: e.target.checked ? [...f.roleIds, role.id] : f.roleIds.filter((id: string) => id !== role.id) }));
                  }} className="sr-only" />
                  <span className="text-sm">{role.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.username || !form.name} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    if (!confirm('确认删除该角色？此操作不可恢复。')) return;
    await fetch(`/api/roles/${row.id}`, { method: 'DELETE' });
    const d = await (await fetch('/api/roles')).json();
    if (d.success) setData(d.data);
  };

  const columns = [
    { key: 'code', label: '角色编码' },
    { key: 'name', label: '角色名称' },
    { key: 'description', label: '描述' },
    { key: 'permissions', label: '权限数', render: (v: any[]) => <Badge variant="secondary">{v?.length || 0}</Badge> },
    { key: 'menus', label: '菜单数', render: (v: any[]) => <Badge variant="secondary">{v?.length || 0}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ShieldHalf size={22} className="text-emerald-500" /> 角色管理
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增角色
        </Button>
      </div>
      <DataTable columns={columns} data={data} loading={loading}
        onEdit={row => { setEditItem(row); setShowForm(true); }} onDelete={handleDelete} />
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
  const [saving, setSaving] = useState(false);

  const permGroups = permissions.reduce((acc, p) => {
    const mod = p.module || '其他';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  const handleSave = async () => {
    if (!form.code || !form.name) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldHalf size={20} className="text-emerald-500" /> {item ? '编辑角色' : '新增角色'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="角色编码" required><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></FormField>
            <FormField label="角色名称" required><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
          </div>
          <FormField label="描述"><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></FormField>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Key size={14} /> 分配权限
            </label>
            <div className="space-y-3 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg p-3">
              {Object.entries(permGroups as Record<string, any[]>).map(([mod, perms]) => (
                <div key={mod}>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{mod}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {perms.map(p => (
                      <label key={p.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border transition-all ${form.permissionIds.includes(p.id) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <MenuIcon size={14} /> 分配菜单
            </label>
            <div className="flex flex-wrap gap-1.5 border border-slate-200 dark:border-slate-600 rounded-lg p-3 max-h-36 overflow-y-auto">
              {menus.map(m => (
                <label key={m.id} className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer border transition-all ${form.menuIds.includes(m.id) ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400' : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}>
                  <input type="checkbox" checked={form.menuIds.includes(m.id)} onChange={e => {
                    setForm(f => ({ ...f, menuIds: e.target.checked ? [...f.menuIds, m.id] : f.menuIds.filter((id: string) => id !== m.id) }));
                  }} className="sr-only" />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving || !form.code || !form.name} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
        <div className="flex items-center gap-3 py-2.5 px-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 rounded-lg border-b border-slate-100 dark:border-slate-700 transition-colors"
          style={{ paddingLeft: `${12 + depth * 24}px` }}>
          <LucideIcon name={node.icon} size={16} className="text-slate-500 dark:text-slate-400" />
          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 font-medium">{node.name}</span>
          <Badge variant="outline" className="text-[10px]">{node.type === 'directory' ? '目录' : node.type === 'button' ? '按钮' : '菜单'}</Badge>
          <span className="text-xs text-slate-400 dark:text-slate-500">{node.code}</span>
          {node.path && <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">{node.path}</span>}
          <span className="text-xs text-slate-400 dark:text-slate-500">排序:{node.sort}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setEditItem(node); setShowForm(true); }} className="h-7 text-xs gap-1"><Edit size={12} />编辑</Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(node)} className="h-7 text-xs gap-1 text-red-600 hover:text-red-500"><Trash2 size={12} />删除</Button>
          </div>
        </div>
        {node.children?.length > 0 && renderTree(node.children, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <MenuIcon size={22} className="text-emerald-500" /> 菜单管理
        </h2>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增菜单
        </Button>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
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
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MenuIcon size={20} className="text-emerald-500" /> {item ? '编辑菜单' : '新增菜单'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <FormField label="上级菜单">
            <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              <option value="">无（顶级菜单）</option>
              {menus.filter(m => m.type === 'directory').map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="菜单名称" required><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
            <FormField label="菜单编码" required><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="路由路径"><Input value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} placeholder="/path" /></FormField>
            <FormField label="图标"><Input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} /></FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label="类型">
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <option value="directory">目录</option><option value="menu">菜单</option><option value="button">按钮</option>
              </select>
            </FormField>
            <FormField label="排序"><Input type="number" value={form.sort} onChange={e => setForm(f => ({ ...f, sort: Number(e.target.value) }))} /></FormField>
            <FormField label="显示">
              <select value={form.visible} onChange={e => setForm(f => ({ ...f, visible: Number(e.target.value) }))}
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                <option value={1}>显示</option><option value={0}>隐藏</option>
              </select>
            </FormField>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ Permission Management Page ============
function PermissionManagementPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', code: '', type: 'button', module: '' });

  useEffect(() => {
    fetch('/api/permissions').then(r => r.json()).then(d => { if (d.success) setData(d.data); }).finally(() => setLoading(false));
  }, []);

  const openEditForm = (item: any) => {
    setEditItem(item);
    setForm({ name: item.name || '', code: item.code || '', type: item.type || 'button', module: item.module || '' });
    setShowForm(true);
  };

  const openCreateForm = () => {
    setEditItem(null);
    setForm({ name: '', code: '', type: 'button', module: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    if (editItem) {
      await fetch(`/api/permissions/${editItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    } else {
      await fetch('/api/permissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
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

  const grouped = data.reduce((acc, p) => {
    const mod = p.module || '其他';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Key size={22} className="text-emerald-500" /> 权限管理
        </h2>
        <Button onClick={openCreateForm} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
          <Plus size={16} /> 新增权限
        </Button>
      </div>
      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped as Record<string, any[]>).map(([mod, perms]) => (
            <div key={mod} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"><Network size={16} /> {mod}</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="px-4 py-2 text-left text-slate-600 dark:text-slate-400">权限名称</th>
                    <th className="px-4 py-2 text-left text-slate-600 dark:text-slate-400">权限编码</th>
                    <th className="px-4 py-2 text-left text-slate-600 dark:text-slate-400">类型</th>
                    <th className="px-4 py-2 text-left text-slate-600 dark:text-slate-400">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {perms.map((p: any) => (
                    <tr key={p.id} className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{p.name}</td>
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.code}</td>
                      <td className="px-4 py-2"><Badge variant="outline" className="text-xs">{p.type === 'menu' ? '菜单' : '按钮'}</Badge></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditForm(p)} className="h-7 text-xs gap-1"><Edit size={12} />编辑</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} className="h-7 text-xs gap-1 text-red-600 hover:text-red-500"><Trash2 size={12} />删除</Button>
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
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key size={20} className="text-emerald-500" /> {editItem ? '编辑权限' : '新增权限'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <FormField label="权限名称" required><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></FormField>
            <FormField label="权限编码" required><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="类型">
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  <option value="menu">菜单权限</option><option value="button">按钮权限</option><option value="api">接口权限</option>
                </select>
              </FormField>
              <FormField label="所属模块"><Input value={form.module} onChange={e => setForm(f => ({ ...f, module: e.target.value }))} /></FormField>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.code} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
              <Save size={14} /> 保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <div className="p-4 md:p-6">
      {pages[activeMenu] || <DashboardPage />}
    </div>
  );
}

// ============ Main App ============
function MainApp() {
  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <ContentArea />
        </main>
        <footer className="h-8 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 mt-auto">
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
    // Only seed once - check localStorage flag first
    const seedDone = localStorage.getItem('hims-seed-done');
    if (seedDone === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitializing(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    fetch('/api/seed', { method: 'POST', signal: controller.signal })
      .then(r => r.json())
      .then(d => {
        console.log('Seed result:', d);
        localStorage.setItem('hims-seed-done', 'true');
      })
      .catch(e => {
        console.log('Seed already done or error:', e);
        // Mark as done even on error to avoid infinite retries
        localStorage.setItem('hims-seed-done', 'true');
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setInitializing(false);
      });
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mb-4 animate-bounce text-emerald-400">
            <Hospital size={48} className="mx-auto" />
          </div>
          <div className="text-white text-lg font-medium">系统初始化中...</div>
          <div className="text-slate-400 text-sm mt-2 flex items-center justify-center gap-2">
            <RefreshCw size={14} className="animate-spin" />
            正在加载初始数据
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <MainApp />;
}
