'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Check, CheckCircle2, ClipboardCheck, XCircle, Upload, Edit, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';

export function DataTable({ columns, data, onEdit, onDelete, onAction, loading, onExport }: {
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
      </div>
    </div>
  );
}

export function Pagination({ page, total, pageSize = 20, onPageChange }: { page: number; total: number; pageSize?: number; onPageChange: (p: number) => void }) {
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
