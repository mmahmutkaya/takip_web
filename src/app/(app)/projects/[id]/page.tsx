'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project, Case, CaseStatus } from '@/types';
import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Users, Pencil, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CaseStatusBadge, CasePriorityBadge } from '@/components/cases/case-status-badge';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/auth.store';

const STATUS_FILTERS: { label: string; value: CaseStatus | 'ALL' }[] = [
  { label: 'Tümü', value: 'ALL' },
  { label: 'Açık', value: 'OPEN' },
  { label: 'Devam Ediyor', value: 'IN_PROGRESS' },
  { label: 'Kapalı', value: 'CLOSED' },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<CaseStatus | 'ALL'>('ALL');

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: project } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data),
  });

  const { data: cases = [], isLoading } = useQuery<Case[]>({
    queryKey: ['cases', id, statusFilter],
    queryFn: () => api.get(`/projects/${id}/cases`, { params: statusFilter !== 'ALL' ? { status: statusFilter } : {} }).then((r) => r.data),
  });

  const myRole = project?.members?.find((m) => m.userId === currentUser?.id)?.role;
  const canEdit = myRole === 'OWNER' || myRole === 'ADMIN';
  const canDelete = myRole === 'OWNER';

  const updateMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      api.patch(`/projects/${id}`, { name, description: description || undefined }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/projects');
    },
  });

  function openEdit() {
    setEditName(project?.name ?? '');
    setEditDescription(project?.description ?? '');
    setEditOpen(true);
  }

  if (!project) return <div className="p-6 text-muted-foreground">Yükleniyor...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={14} /> Projeler
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && <p className="text-muted-foreground mt-1">{project.description}</p>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href={`/projects/${id}/meetings`}>
            <Button variant="outline" size="sm"><CalendarDays size={14} /> Toplantılar</Button>
          </Link>
          <Link href={`/projects/${id}/members`}>
            <Button variant="outline" size="sm"><Users size={14} /> Üyeler</Button>
          </Link>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={openEdit}><Pencil size={14} /> Düzenle</Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)}><Trash2 size={14} /></Button>
          )}
          <Link href={`/projects/${id}/cases/new`}>
            <Button size="sm"><Plus size={14} /> Yeni Case</Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUS_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              statusFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : cases.length === 0 ? (
        <div className="text-center py-12 border rounded-xl text-muted-foreground">
          Bu filtreye uygun case bulunamadı.
        </div>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <Link key={c.id} href={`/projects/${id}/cases/${c.id}`}>
              <div className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{c.title}</span>
                      <CaseStatusBadge status={c.status} />
                      <CasePriorityBadge priority={c.priority} />
                    </div>
                    {c.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {c.assignee && (
                      <p className="text-xs text-muted-foreground">{c.assignee.user.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: tr })}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projeyi Düzenle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Proje Adı</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Açıklama (opsiyonel)</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>İptal</Button>
            <Button
              onClick={() => updateMutation.mutate({ name: editName, description: editDescription })}
              disabled={!editName.trim() || updateMutation.isPending}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projeyi Sil</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong>{project.name}</strong> projesi pasife alınacak. Bu işlem geri alınabilir ancak proje listesinden kaldırılır.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>İptal</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
