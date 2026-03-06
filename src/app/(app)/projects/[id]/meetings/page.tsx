'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Meeting } from '@/types';
import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, CalendarDays, MapPin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuthStore } from '@/store/auth.store';

export default function MeetingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [createError, setCreateError] = useState('');

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings', projectId],
    queryFn: () => api.get(`/projects/${projectId}/meetings`).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post(`/projects/${projectId}/meetings`, {
        title,
        description: description || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        location: location || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', projectId] });
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      setScheduledAt('');
      setLocation('');
      setCreateError('');
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setCreateError(err.response?.data?.message ?? 'Toplantı oluşturulamadı');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (meetingId: string) => api.delete(`/projects/${projectId}/meetings/${meetingId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings', projectId] }),
  });

  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.scheduledAt) >= now);
  const past = meetings.filter((m) => new Date(m.scheduledAt) < now);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Proje
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Toplantılar</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={14} /> Toplantı Ekle
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : meetings.length === 0 ? (
        <div className="text-center py-16 border rounded-xl text-muted-foreground">
          <CalendarDays size={32} className="mx-auto mb-3 opacity-40" />
          Henüz toplantı planlanmamış.
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Yaklaşan</h2>
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <MeetingCard key={m.id} meeting={m} onDelete={() => deleteMutation.mutate(m.id)} currentUserId={currentUser?.id} />
                ))}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Geçmiş</h2>
              <div className="space-y-2 opacity-70">
                {past.map((m) => (
                  <MeetingCard key={m.id} meeting={m} onDelete={() => deleteMutation.mutate(m.id)} currentUserId={currentUser?.id} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Toplantı Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Başlık</Label>
              <Input placeholder="Sprint Planning" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Tarih ve Saat</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Konum / Link (opsiyonel)</Label>
              <Input placeholder="Toplantı Odası 1 veya https://meet.google.com/..." value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Açıklama (opsiyonel)</Label>
              <Textarea placeholder="Toplantı ajandası..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            {createError && <p className="text-xs text-destructive">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>İptal</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!title.trim() || !scheduledAt || createMutation.isPending}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MeetingCard({ meeting, onDelete, currentUserId }: { meeting: Meeting; onDelete: () => void; currentUserId?: string }) {
  const canDelete = meeting.createdBy.id === currentUserId;

  return (
    <div className="border rounded-xl p-4 bg-card flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-foreground">{meeting.title}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays size={11} />
            {format(new Date(meeting.scheduledAt), 'dd MMM yyyy, HH:mm', { locale: tr })}
          </span>
          {meeting.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} />
              {meeting.location}
            </span>
          )}
        </div>
        {meeting.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{meeting.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Oluşturan: {meeting.createdBy.name}</p>
      </div>
      {canDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 shrink-0 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Sil"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
