'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Check, CheckCircle2, ClipboardCheck, XCircle, Upload, Edit, Trash2, ArrowLeft, ArrowRight, Maximize2, Minimize2, Search, Inbox } from 'lucide-react';

// ============ Empty State SVG Illustration ============
function EmptyStateIllustration() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Document stack */}
        <rect x="30" y="20" width="50" height="60" rx="4" className="fill-slate-200 dark:fill-slate-700" />
        <rect x="35" y="15" width="50" height="60" rx="4" className="fill-slate-100 dark:fill-slate-600" />
        <rect x="40" y="10" width="50" height="60" rx="4" className="fill-white dark:fill-slate-800" stroke="currentColor" strokeWidth="1.5" />
        {/* Lines on document */}
        <line x1="50" y1="28" x2="80" y2="28" className="stroke-slate-300 dark:stroke-slate-600" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="36" x2="75" y2="36" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="44" x2="78" y2="44" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="52" x2="65" y2="52" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="2" strokeLinecap="round" />
        {/* Search icon */}
        <circle cx="82" cy="60" r="10" className="stroke-slate-300 dark:stroke-slate-500" strokeWidth="2" fill="none" />
        <line x1="89" y1="67" x2="95" y2="73" className="stroke-slate-300 dark:stroke-slate-500" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="text-center">
        <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">暂无数据</p>
        <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">当前条件下没有匹配的记录</p>
      </div>
    </div>
  );
}

export function DataTable({ columns, data, onEdit, onDelete, onAction, loading, onExport }: {
  columns: { key: string; label: string; render?: (val: any, row: any) => React.ReactNode }[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onAction?: (row: any, action: string) => void;
  loading?: boolean;
  onExport?: () => void;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen && tableContainerRef.current) {
      tableContainerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Sync fullscreen state when user exits via Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
      {(onExport || true) && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400 dark:text-slate-500">共 {data.length} 条记录</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-1.5 text-xs" title="全屏显示">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              {isFullscreen ? '退出全屏' : '全屏'}
            </Button>
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5 text-xs">
                <Download size={14} /> 导出数据
              </Button>
            )}
          </div>
        </div>
      )}
      <div
        ref={tableContainerRef}
        className={`overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-slate-900 p-4 rounded-none border-0' : ''}`}
      >
        <table className="w-full text-sm">
          <thead className={`bg-slate-50 dark:bg-slate-800 ${isFullscreen ? '' : 'sticky top-0 z-10'}`}>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap bg-slate-50 dark:bg-slate-800">{col.label}</th>
              ))}
              {(onEdit || onDelete || onAction) && <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800">操作</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={columns.length + (onEdit || onDelete || onAction ? 1 : 0)} className="px-4 py-4">
                <EmptyStateIllustration />
              </td></tr>
            ) : data.map((row, i) => (
              <tr key={row.id || i} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors duration-150 ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}`}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {onAction && row.status === '待处理' && <Button variant="ghost" size="sm" onClick={() => onAction(row, 'handle')} className="h-7 text-xs gap-1 text-emerald-600 hover:text-emerald-500"><Check size={12} />处理</Button>}
                    {onAction && row.status === '待审核' && <Button variant="ghost" size="sm" onClick={() => onAction(row, 'review')} className="h-7 text-xs gap-1 text-sky-600 hover:text-sky-500"><CheckCircle2 size={12} />审核</Button>}
                    {onAction && row.status === '待核实' && <Button variant="ghost" size="sm" onClick={() => onAction(row, 'verify')} className="h-7 text-xs gap-1 text-sky-600 hover:text-sky-500"><ClipboardCheck size={12} />核实</Button>}
                    {onAction && row.status === '待确认' && <Button variant="ghost" size="sm" onClick={() => onAction(row, 'confirm')} className="h-7 text-xs gap-1 text-sky-600 hover:text-sky-500"><CheckCircle2 size={12} />确认</Button>}
                    {onAction && row.status === '处理中' && <Button variant="ghost" size="sm" onClick={() => onAction(row, 'close')} className="h-7 text-xs gap-1 text-slate-600 hover:text-slate-500"><XCircle size={12} />关闭</Button>}
                    {onAction && row.reportToCDC === 0 && row.status === '已审核' && <Button variant="ghost" size="sm" onClick={() => onAction(row, 'report-cdc')} className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-500"><Upload size={12} />上报CDC</Button>}
                    {onEdit && <Button variant="ghost" size="sm" onClick={() => onEdit(row)} className="h-7 text-xs gap-1"><Edit size={12} />编辑</Button>}
                    {onDelete && <Button variant="ghost" size="sm" onClick={() => onDelete(row)} className="h-7 text-xs gap-1 text-red-600 hover:text-red-500"><Trash2 size={12} />删除</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Fullscreen close button */}
        {isFullscreen && (
          <div className="fixed top-4 right-4 z-[60]">
            <Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-1.5 shadow-lg">
              <Minimize2 size={14} /> 退出全屏
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Pagination({ page, total, pageSize = 20, onPageChange, onPageSizeChange }: { page: number; total: number; pageSize?: number; onPageChange: (p: number) => void; onPageSizeChange?: (size: number) => void }) {
  const totalPages = Math.ceil(total / pageSize);
  const [jumpInput, setJumpInput] = useState('');
  const pageSizeOptions = [10, 20, 50, 100];

  const handleJumpToPage = () => {
    const p = parseInt(jumpInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
      setJumpInput('');
    }
  };

  return (
    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <span>共 {total} 条记录</span>
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs">每页</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>{size}条</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}
          className="gap-1"><ArrowLeft size={14} /> 上一页</Button>
        <span className="px-3">第 {page} / {totalPages || 1} 页</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
          className="gap-1">下一页 <ArrowRight size={14} /></Button>
        {/* Jump to page */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-xs text-slate-400">跳转到</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpInput}
            onChange={e => setJumpInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJumpToPage()}
            className="w-14 h-7 px-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-center"
            placeholder="页码"
          />
          <Button variant="outline" size="sm" onClick={handleJumpToPage} className="h-7 text-xs gap-1">
            <Search size={12} /> 跳转
          </Button>
        </div>
      </div>
    </div>
  );
}
