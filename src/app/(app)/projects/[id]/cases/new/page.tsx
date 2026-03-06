'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ProjectMember } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

const schema = z.object({
  title: z.string().min(2, 'Başlık en az 2 karakter olmalı').max(200, 'Başlık en fazla 200 karakter olabilir'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ['members', projectId],
    queryFn: () => api.get(`/projects/${projectId}/members`).then((r) => r.data),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  });

  const { mutateAsync, error: mutateError } = useMutation({
    mutationFn: (data: FormData) => api.post(`/projects/${projectId}/cases`, data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cases', projectId] }),
  });

  const onSubmit = async (data: FormData) => {
    const created = await mutateAsync(data);
    router.push(`/projects/${projectId}/cases/${created.id}`);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Proje
      </Link>
      <h1 className="text-2xl font-bold mb-6">Yeni Kayıt</h1>
      <div className="border rounded-xl p-6 bg-card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" placeholder="Kayıt başlığı..." {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea id="description" rows={3} placeholder="Detayları buraya yazın..." {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="priority">Öncelik</Label>
              <select id="priority" {...register('priority')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="LOW">Düşük</option>
                <option value="MEDIUM">Orta</option>
                <option value="HIGH">Yüksek</option>
                <option value="CRITICAL">Kritik</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Bitiş Tarihi</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="assigneeId">Sorumlu</Label>
            <select id="assigneeId" {...register('assigneeId')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <option value="">Sorumlu seç (opsiyonel)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.user.name} {m.title ? `(${m.title})` : ''}</option>
              ))}
            </select>
          </div>
          {mutateError && (
            <p className="text-sm text-destructive">{(mutateError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Hata oluştu'}</p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Oluşturuluyor...' : 'Kayıt Oluştur'}
          </Button>
        </form>
      </div>
    </div>
  );
}
