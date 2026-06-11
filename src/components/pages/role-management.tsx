'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ShieldHalf, Plus, Key, Save, RefreshCw, Menu as MenuIcon } from 'lucide-react';

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
        <div className="space-y-4 py-4">
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

export default function RoleManagementPage() {
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
