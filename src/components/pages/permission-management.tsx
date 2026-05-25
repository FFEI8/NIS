'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Key, Plus, Edit, Trash2, Network, Save } from 'lucide-react';

export default function PermissionManagementPage() {
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
