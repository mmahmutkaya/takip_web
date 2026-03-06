'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { User } from '@/types';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth.store';
import { User as UserIcon, Lock } from 'lucide-react';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user: storeUser, login } = useAuthStore();

  const { data: profile } = useQuery<User>({
    queryKey: ['me'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const [name, setName] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: ({ name }: { name: string }) =>
      api.patch('/users/me', { name }).then((r) => r.data),
    onSuccess: (updated: User) => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      useAuthStore.setState((s) => ({ ...s, user: { ...s.user!, name: updated.name } }));
      setProfileMsg('Profil güncellendi.');
      setTimeout(() => setProfileMsg(''), 3000);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      api.patch('/users/me/password', { currentPassword, newPassword }).then((r) => r.data),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setPasswordError('');
      setPasswordMsg('Şifre başarıyla güncellendi.');
      setTimeout(() => setPasswordMsg(''), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setPasswordError(err.response?.data?.message ?? 'Şifre güncellenemedi');
    },
  });

  if (!profile) return <div className="p-6 text-muted-foreground">Yükleniyor...</div>;

  const PLAN_LABELS: Record<string, string> = { FREE: 'Ücretsiz', PRO: 'Pro', ENTERPRISE: 'Kurumsal' };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profilim</h1>

      <div className="border rounded-xl p-5 bg-card mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-medium">{profile.name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full mt-0.5 inline-block">
              {PLAN_LABELS[profile.plan] ?? profile.plan}
            </span>
          </div>
        </div>

        <h2 className="font-semibold mb-3 flex items-center gap-2"><UserIcon size={14} /> Profil Düzenle</h2>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Ad Soyad</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-muted-foreground">E-posta (değiştirilemez)</Label>
            <Input value={profile.email} disabled className="opacity-60" />
          </div>
          {profileMsg && <p className="text-xs text-green-600">{profileMsg}</p>}
          <Button
            onClick={() => updateProfileMutation.mutate({ name })}
            disabled={!name.trim() || name === profile.name || updateProfileMutation.isPending}
            size="sm"
          >
            Kaydet
          </Button>
        </div>
      </div>

      <div className="border rounded-xl p-5 bg-card">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Lock size={14} /> Şifre Değiştir</h2>
        <div className="space-y-3">
          <div>
            <Label className="mb-1.5 block">Mevcut Şifre</Label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Yeni Şifre</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {passwordError && <p className="text-xs text-destructive">{passwordError}</p>}
          {passwordMsg && <p className="text-xs text-green-600">{passwordMsg}</p>}
          <Button
            onClick={() => changePasswordMutation.mutate({ currentPassword, newPassword })}
            disabled={!currentPassword || newPassword.length < 6 || changePasswordMutation.isPending}
            size="sm"
          >
            Şifreyi Güncelle
          </Button>
        </div>
      </div>
    </div>
  );
}
