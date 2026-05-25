'use client';

import { useState, useCallback, useEffect } from 'react';
import { LucideIcon } from '@/components/shared/icons';
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
import { Menu as MenuIcon, Plus, Edit, Trash2, Save, RefreshCw } from 'lucide-react';

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

export default function MenuManagementPage() {
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
