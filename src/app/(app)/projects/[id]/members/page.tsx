'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProjectMember, ProjectRole } from '@/types';
import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAuthStore } from '@/store/auth.store';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Sahip', ADMIN: 'Yönetici', MEMBER: 'Üye', VIEWER: 'Gözlemci',
};

const EDITABLE_ROLES: ProjectRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];

export default function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [editRole, setEditRole] = useState<ProjectRole>('MEMBER');
  const [editTitle, setEditTitle] = useState('');

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ['members', projectId],
    queryFn: () => api.get(`/projects/${projectId}/members`).then((r) => r.data),
  });

  const myRole = members.find((m) => m.userId === currentUser?.id)?.role;
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN';

  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.post(`/projects/${projectId}/members`, { email }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      setEmail('');
      setInviteError('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setInviteError(err.response?.data?.message ?? 'Davet başarısız');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ memberId, role, title }: { memberId: string; role: ProjectRole; title: string }) =>
      api.patch(`/projects/${projectId}/members/${memberId}`, { role, title: title || undefined }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      setEditingMember(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => api.delete(`/projects/${projectId}/members/${memberId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', projectId] }),
  });

  function openEdit(member: ProjectMember) {
    setEditingMember(member);
    setEditRole(member.role);
    setEditTitle(member.title ?? '');
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Proje
      </Link>
      <h1 className="text-2xl font-bold mb-6">Proje Üyeleri</h1>

      {canManage && (
        <div className="border rounded-xl p-5 bg-card mb-6">
          <h2 className="font-semibold mb-3">Üye Davet Et</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="ornek@sirket.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && inviteMutation.mutate(email)}
              />
              {inviteError && <p className="text-xs text-destructive mt-1">{inviteError}</p>}
            </div>
            <Button size="sm" onClick={() => inviteMutation.mutate(email)} disabled={!email.trim() || inviteMutation.isPending}>
              <UserPlus size={14} /> Davet Et
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-xl bg-card divide-y">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4">
            <div>
              <span className="font-medium text-foreground">{member.user.name}</span>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
              {member.title && <p className="text-xs text-muted-foreground">{member.title}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{ROLE_LABELS[member.role] ?? member.role}</span>
              {canManage && member.role !== 'OWNER' && (
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(member)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Düzenle"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(member.id)}
                    disabled={removeMutation.isPending}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Çıkar"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editingMember} onOpenChange={(o) => !o && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Üyeyi Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Rol</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as ProjectRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDITABLE_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">Ünvan (opsiyonel)</Label>
              <Input
                placeholder="Yazılım Geliştirici"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>İptal</Button>
            <Button
              onClick={() => editingMember && updateMutation.mutate({ memberId: editingMember.id, role: editRole, title: editTitle })}
              disabled={updateMutation.isPending}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Sahip', ADMIN: 'Yönetici', MEMBER: 'Üye', VIEWER: 'Gözlemci',
};

export default function MembersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ['members', projectId],
    queryFn: () => api.get(`/projects/${projectId}/members`).then((r) => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) => api.post(`/projects/${projectId}/members`, { email }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', projectId] });
      setEmail('');
      setInviteError('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setInviteError(err.response?.data?.message ?? 'Davet başarısız');
    },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Proje
      </Link>
      <h1 className="text-2xl font-bold mb-6">Proje Üyeleri</h1>

      <div className="border rounded-xl p-5 bg-card mb-6">
        <h2 className="font-semibold mb-3">Üye Davet Et</h2>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="ornek@sirket.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && inviteMutation.mutate(email)}
            />
            {inviteError && <p className="text-xs text-destructive mt-1">{inviteError}</p>}
          </div>
          <Button size="sm" onClick={() => inviteMutation.mutate(email)} disabled={!email.trim() || inviteMutation.isPending}>
            <UserPlus size={14} /> Davet Et
          </Button>
        </div>
      </div>

      <div className="border rounded-xl bg-card divide-y">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4">
            <div>
              <span className="font-medium text-foreground">{member.user.name}</span>
              <p className="text-sm text-muted-foreground">{member.user.email}</p>
              {member.title && <p className="text-xs text-muted-foreground">{member.title}</p>}
            </div>
            <span className="text-sm text-muted-foreground">{ROLE_LABELS[member.role] ?? member.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
