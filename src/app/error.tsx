'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[ErrorBoundary] Uncaught error:', error);
  }, [error]);

  const handleGoHome = () => {
    // Clear any potentially corrupted state
    try {
      localStorage.removeItem('hims-app-store');
      localStorage.removeItem('hims-seed-done');
    } catch {
      // Ignore storage errors
    }
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
            <AlertTriangle size={40} className="text-rose-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
          页面出现错误
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
          系统遇到了一个意外错误，请尝试以下操作：
        </p>
        {error?.message && (
          <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-600 dark:text-slate-400 font-mono break-all">
            {error.message}
          </div>
        )}
        {error?.digest && (
          <p className="text-xs text-slate-400 mt-1">
            错误标识: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RotateCcw size={16} />
            重试
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors text-sm font-medium"
          >
            <Home size={16} />
            返回首页
          </button>
        </div>
      </div>
    </div>
  );
}
