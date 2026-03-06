'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const schema = z.object({
  name: z.string().min(2, 'Proje adı en az 2 karakter olmalı').max(100, 'Proje adı en fazla 100 karakter olabilir'),
  slug: z.string().min(2, 'Slug en az 2 karakter olmalı').regex(/^[a-z0-9-]+$/, 'Sadece küçük harf, rakam ve tire'),
  description: z.string().max(500, 'Açıklama en fazla 500 karakter olabilir').optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { mutateAsync, error: mutateError } = useMutation({
    mutationFn: (data: FormData) => api.post('/projects', data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  });

  const onSubmit = async (data: FormData) => {
    const project = await mutateAsync(data);
    router.push(`/projects/${project.id}`);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setValue('slug', slug);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={14} /> Projeler
      </Link>
      <h1 className="text-2xl font-bold mb-6">Yeni Proje</h1>
      <div className="border rounded-xl p-6 bg-card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Proje Adı</Label>
            <Input id="name" placeholder="ERP Projesi" {...register('name')} onChange={(e) => { register('name').onChange(e); handleNameChange(e); }} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" placeholder="erp-projesi" {...register('slug')} />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Açıklama (opsiyonel)</Label>
            <Textarea id="description" placeholder="Projenin kısa açıklaması..." {...register('description')} />
          </div>
          {mutateError && (
            <p className="text-sm text-destructive">{(mutateError as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Hata oluştu'}</p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Oluşturuluyor...' : 'Proje Oluştur'}
          </Button>
        </form>
      </div>
    </div>
  );
}
