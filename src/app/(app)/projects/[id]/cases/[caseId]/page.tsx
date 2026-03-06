'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Case, CaseStatus } from '@/types';
import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CaseStatusBadge, CasePriorityBadge } from '@/components/cases/case-status-badge';
import { formatDistanceToNow, format } from 'date-fns';
import { tr } from 'date-fns/locale';

const STATUS_ACTIONS: { from: CaseStatus[]; to: CaseStatus; label: string; variant: 'default' | 'outline' }[] = [
  { from: ['OPEN'], to: 'IN_PROGRESS', label: 'Başlat', variant: 'default' },
  { from: ['IN_PROGRESS'], to: 'CLOSED', label: 'Kapat', variant: 'outline' },
  { from: ['CLOSED'], to: 'OPEN', label: 'Yeniden Aç', variant: 'outline' },
];

export default function CaseDetailPage({ params }: { params: Promise<{ id: string; caseId: string }> }) {
  const { id: projectId, caseId } = use(params);
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: caseItem, isLoading } = useQuery<Case>({
    queryKey: ['case', caseId],
    queryFn: () => api.get(`/projects/${projectId}/cases/${caseId}`).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: CaseStatus) => api.patch(`/projects/${projectId}/cases/${caseId}`, { status }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['case', caseId] }),
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.post(`/projects/${projectId}/cases/${caseId}/updates`, { content }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      setComment('');
    },
  });

  const handleComment = () => {
    if (comment.trim()) commentMutation.mutate(comment.trim());
  };

  if (isLoading || !caseItem) return <div className="p-6 text-muted-foreground">Yükleniyor...</div>;

  const actions = STATUS_ACTIONS.filter((a) => a.from.includes(caseItem.status));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft size={14} /> Proje
      </Link>

      <div className="border rounded-xl p-6 bg-card mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-xl font-bold text-foreground">{caseItem.title}</h1>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <CaseStatusBadge status={caseItem.status} />
            <CasePriorityBadge priority={caseItem.priority} />
          </div>
        </div>
        {caseItem.description && (
          <p className="text-muted-foreground text-sm mb-4">{caseItem.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
          <div>
            <span className="text-muted-foreground">Sorumlu: </span>
            <span className="text-foreground">{caseItem.assignee?.user.name ?? 'Atanmamış'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Oluşturan: </span>
            <span className="text-foreground">{caseItem.createdBy.name}</span>
          </div>
          {caseItem.dueDate && (
            <div>
              <span className="text-muted-foreground">Bitiş: </span>
              <span className="text-foreground">{format(new Date(caseItem.dueDate), 'dd MMM yyyy', { locale: tr })}</span>
            </div>
          )}
          {caseItem.closedAt && (
            <div>
              <span className="text-muted-foreground">Kapatıldı: </span>
              <span className="text-foreground">{format(new Date(caseItem.closedAt), 'dd MMM yyyy', { locale: tr })}</span>
            </div>
          )}
        </div>
        {actions.length > 0 && (
          <div className="flex gap-2 mt-4">
            {actions.map((action) => (
              <Button
                key={action.to}
                variant={action.variant}
                size="sm"
                onClick={() => statusMutation.mutate(action.to)}
                disabled={statusMutation.isPending}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="border rounded-xl bg-card">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Gelişmeler</h2>
        </div>
        <div className="divide-y">
          {(caseItem.updates?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Henüz gelişme eklenmemiş</div>
          ) : (
            caseItem.updates?.map((update) => (
              <div key={update.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{update.author.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(update.createdAt), { addSuffix: true, locale: tr })}
                  </span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{update.content}</p>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t">
          <Textarea
            rows={3}
            placeholder="Gelişme ekleyin..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mb-2"
          />
          <Button size="sm" onClick={handleComment} disabled={!comment.trim() || commentMutation.isPending}>
            <Send size={14} /> Ekle
          </Button>
        </div>
      </div>
    </div>
  );
}
