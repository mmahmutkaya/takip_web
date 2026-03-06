'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Project } from '@/types';
import Link from 'next/link';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projeler</h1>
        <Link href="/projects/new">
          <Button size="sm"><Plus size={14} /> Yeni Proje</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Yükleniyor...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 border border-border/90 rounded-xl bg-card shadow-md">
          <FolderOpen size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Henüz proje yok</p>
          <Link href="/projects/new">
            <Button className="mt-4" size="sm">İlk Projeyi Oluştur</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="border border-border/90 rounded-xl p-5 bg-card shadow-[0_10px_24px_rgba(15,23,42,0.12)] hover:shadow-[0_16px_34px_rgba(15,23,42,0.16)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-sm font-medium text-foreground">{project._count?.cases ?? 0}</span>
                    <p className="text-xs text-muted-foreground">konu</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>{project._count?.members ?? 0} üye</span>
                  <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true, locale: tr })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
