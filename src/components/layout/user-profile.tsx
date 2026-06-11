'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { User, Hospital, Save, RefreshCw, Lock } from 'lucide-react';
import { PhoneIcon, MailIcon } from '@/components/shared/icons';
import { ChangePasswordDialog } from '@/components/shared/change-password-dialog';

export function UserProfileDialog({ open, onClose, currentUser }: { open: boolean; onClose: () => void; currentUser: any }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', dept: '' });
  const [saving, setSaving] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

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
    <>
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
            {/* Change password button */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => setShowChangePassword(true)}
                className="w-full gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <Lock size={14} /> 修改密码
              </Button>
            </div>
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
      <ChangePasswordDialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        currentUser={currentUser}
      />
    </>
  );
}
