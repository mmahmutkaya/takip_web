'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Project } from '@/types';
import { FolderKanban, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data),
  });

  const totalCases = projects.reduce((sum, p) => sum + (p._count?.cases ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Merhaba, {user?.name}</h1>
        <p className="text-muted-foreground">İşte genel durumunuz</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FolderKanban} label="Proje" value={projects.length} color="bg-blue-50 text-blue-600" />
        <StatCard icon={AlertCircle} label="Toplam Case" value={totalCases} color="bg-orange-50 text-orange-600" />
        <StatCard icon={CheckCircle2} label="Aktif Proje" value={projects.filter(p => p.isActive).length} color="bg-green-50 text-green-600" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Projelerim</h2>
          <Link href="/projects/new" className="text-sm text-primary hover:underline">+ Yeni Proje</Link>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border rounded-xl">
            Henüz proje yok.{' '}
            <Link href="/projects/new" className="text-primary hover:underline">İlk projeyi oluşturun</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block">
                <div className="border rounded-xl p-4 bg-card hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground">{project.name}</h3>
                    <span className="text-xs text-muted-foreground">{project._count?.cases ?? 0} case</span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="border rounded-xl p-4 bg-card">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={18} />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
