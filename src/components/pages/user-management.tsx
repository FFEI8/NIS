'use client';

import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/shared/status-badge';
import { DataTable } from '@/components/shared/data-table';
import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Users, UserCog, UserPlus, ShieldHalf, Save, RefreshCw } from 'lucide-react';

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
        <div className="space-y-4 py-4">
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

export default function UserManagementPage() {
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
