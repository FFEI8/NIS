'use client';

import { useState, useCallback, useEffect } from 'react';
import { LucideIcon } from '@/components/shared/icons';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/app-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Menu as MenuIcon, Plus, Edit, Trash2, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';

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
        <div className="space-y-4 py-4">
          <FormField label="上级菜单">
            <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
              className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
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
                className="w-full h-9 px-3 rounded-md border border-slate-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">
                <option value="directory">目录</option><option value="menu">菜单</option><option value="button">按钮</option>
              </select>
            </FormField>
            <FormField label="排序"><Input type="number" value={form.sort} onChange={e => setForm(f => ({ ...f, sort: Number(e.target.value) }))} /></FormField>
            <FormField label="显示状态">
              <select
                value={String(form.visible)}
                onChange={e => setForm(f => ({ ...f, visible: Number(e.target.value) }))}
                className={`w-full h-9 px-3 rounded-md border text-sm ${form.visible === 0 ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}
              >
                <option value="1">显示</option>
                <option value="0">隐藏</option>
              </select>
            </FormField>
          </div>
          {form.visible === 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
              <EyeOff size={16} className="text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-600 dark:text-amber-400">此菜单设为隐藏后将不会在侧边栏中显示，但功能仍可正常使用</span>
            </div>
          )}
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

export default function MenuManagementPage() {
  const [items, setItems] = useState<any[]>([]);
  const [tree, setTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const refreshMenus = useAppStore(s => s.refreshMenus);

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
    setShowForm(false); setEditItem(null);
    fetchData();
    // Refresh sidebar menus so visibility changes take effect immediately
    await refreshMenus();
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确认删除该菜单？子菜单也会一并删除。')) return;
    await fetch(`/api/menus/${row.id}`, { method: 'DELETE' });
    fetchData();
    // Refresh sidebar menus after deletion
    await refreshMenus();
  };

  const handleToggleVisible = async (node: any) => {
    const newVisible = node.visible === 1 ? 0 : 1;
    await fetch(`/api/menus/${node.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId: node.parentId || '', name: node.name, code: node.code,
        path: node.path || '', icon: node.icon || '', type: node.type,
        sort: node.sort, visible: newVisible, status: node.status,
      }),
    });
    fetchData();
    await refreshMenus();
  };

  const renderTree = (nodes: any[], depth = 0) => {
    return nodes.map(node => (
      <div key={node.id}>
        <div className={`flex items-center gap-3 py-2.5 px-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 rounded-lg border-b border-slate-100 dark:border-slate-700 transition-colors ${node.visible === 0 ? 'opacity-60' : ''}`}
          style={{ paddingLeft: `${12 + depth * 24}px` }}>
          <LucideIcon name={node.icon} size={16} className={node.visible === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'} />
          <span className={`flex-1 text-sm font-medium ${node.visible === 0 ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>{node.name}</span>
          {node.visible === 0 && (
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 dark:border-amber-600 dark:text-amber-400">
              <EyeOff size={10} className="mr-0.5" />隐藏
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">{node.type === 'directory' ? '目录' : node.type === 'button' ? '按钮' : '菜单'}</Badge>
          <span className="text-xs text-slate-400 dark:text-slate-500">{node.code}</span>
          {node.path && <span className="text-xs text-slate-400 dark:text-slate-500 hidden md:inline">{node.path}</span>}
          <span className="text-xs text-slate-400 dark:text-slate-500">排序:{node.sort}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleToggleVisible(node)}
              className={`h-7 text-xs gap-1 ${node.visible === 0 ? 'text-amber-500 hover:text-amber-400' : 'text-emerald-600 hover:text-emerald-500'}`}
              title={node.visible === 0 ? '点击显示' : '点击隐藏'}>
              {node.visible === 0 ? <EyeOff size={12} /> : <Eye size={12} />}
              {node.visible === 0 ? '显示' : '隐藏'}
            </Button>
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            <Eye size={12} className="inline mr-1" />点击"显示/隐藏"按钮可快速切换菜单可见性
          </span>
          <Button onClick={() => { setEditItem(null); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 gap-1.5">
            <Plus size={16} /> 新增菜单
          </Button>
        </div>
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
