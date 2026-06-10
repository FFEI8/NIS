'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app-store';
import { Hospital, User, Lock, Eye, EyeOff, Check, AlertCircle, RefreshCw, Plus, Info } from 'lucide-react';

// ============ Floating Dots / Particles (CSS only) ============
function ParticleBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-teal-300/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />

      {/* Floating particles - small dots with varying animations */}
      {[...Array(20)].map((_, i) => {
        const size = 2 + (i % 4);
        const left = (i * 5.2) % 100;
        const top = (i * 7.3 + 10) % 100;
        const duration = 15 + (i % 10) * 3;
        const delay = (i * 1.1) % 5;
        const opacity = 0.1 + (i % 5) * 0.04;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-emerald-400"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
              opacity,
              animation: `float-particle ${duration}s ease-in-out ${delay}s infinite`,
            }}
          />
        );
      })}

      {/* Floating medical crosses */}
      {[...Array(6)].map((_, i) => (
        <div key={`cross-${i}`} className="absolute animate-ping text-emerald-500/10" style={{
          left: `${15 + i * 15}%`, top: `${10 + (i % 3) * 30}%`,
          animationDuration: `${3 + i}s`, animationDelay: `${i * 0.5}s`,
        }}>
          <Plus size={20 + i * 4} />
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [entranceComplete, setEntranceComplete] = useState(false);
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
    // Trigger entrance animation
    const timer = setTimeout(() => setEntranceComplete(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Real-time validation
  const errors: Record<string, string> = {};
  if (touched.username && !username.trim()) errors.username = '请输入用户名';
  if (touched.password && !password.trim()) errors.password = '请输入密码';
  if (touched.password && password.trim() && password.length < 4) errors.password = '密码长度至少4位';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password.trim()) {
      setError('请输入密码');
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

  const handleDemoClick = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setTouched({});
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <ParticleBackground />

      <div className={`relative w-full max-w-md mx-4 transition-all duration-700 ease-out ${entranceComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 mb-4 transition-transform duration-300 hover:scale-110">
              <Hospital size={32} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">医院感染管理系统</h1>
            <p className="text-slate-400 mt-2 text-sm">Hospital Infection Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <span className="flex items-center gap-1.5"><User size={14} /> 用户名</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError(''); }}
                  onBlur={() => setTouched(t => ({ ...t, username: true }))}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-emerald-500/50 transition-all pr-10 ${
                    errors.username ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/20 focus:ring-emerald-500/50'
                  }`}
                  placeholder="请输入用户名"
                  autoFocus
                />
                <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.username}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <span className="flex items-center gap-1.5"><Lock size={14} /> 密码</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(''); }}
                  onBlur={() => setTouched(t => ({ ...t, password: true }))}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-emerald-500/50 transition-all pr-10 ${
                    errors.password ? 'border-red-500/50 focus:ring-red-500/50' : 'border-white/20 focus:ring-emerald-500/50'
                  }`}
                  placeholder="请输入密码"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setRemember(!remember)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all focus:ring-2 focus:ring-emerald-500/50 ${remember ? 'bg-emerald-600 border-emerald-500' : 'bg-white/10 border-white/30'}`}>
                {remember && <Check size={12} className="text-white" />}
              </button>
              <span className="text-sm text-slate-400">记住密码</span>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900">
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
                { label: '感控专员', user: 'gkzj', pass: '123456' },
                { label: '临床医师', user: 'doctor', pass: '123456' },
              ].map(d => (
                <button key={d.user} type="button" onClick={() => handleDemoClick(d.user, d.pass)}
                  className="text-center p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer focus:ring-2 focus:ring-emerald-500/50 focus:outline-none">
                  <div className="text-emerald-400 font-medium">{d.label}</div>
                  <div className="text-slate-500">{d.user}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Version info */}
        <div className="mt-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
            <Info size={12} />
            <span>医院感染管理系统 v1.0.0</span>
            <span className="text-slate-700">·</span>
            <span>© 2024 感控信息化平台</span>
          </div>
        </div>
      </div>
    </div>
  );
}
