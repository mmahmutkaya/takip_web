'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/notification-bell';

const navItems = [
  { href: '/dashboard', label: 'Genel Bakış', icon: LayoutDashboard },
  { href: '/projects', label: 'Projeler', icon: FolderKanban },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <aside className="w-60 shrink-0 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b flex items-center justify-between">
        <span className="font-bold text-lg text-primary">Takip</span>
        <NotificationBell />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Link href="/profile" className="flex items-center gap-2 mb-3 group">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User size={13} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate group-hover:underline">{user?.name}</div>
            <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={14} />
          Çıkış Yap
        </button>
      </div>
    </aside>
  );
}
