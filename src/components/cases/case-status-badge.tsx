import { Badge } from '@/components/ui/badge';
import { CaseStatus, CasePriority } from '@/types';

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const map: Record<CaseStatus, { label: string; variant: 'info' | 'warning' | 'success' }> = {
    OPEN: { label: 'Açık', variant: 'info' },
    IN_PROGRESS: { label: 'Devam Ediyor', variant: 'warning' },
    CLOSED: { label: 'Kapalı', variant: 'success' },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function CasePriorityBadge({ priority }: { priority: CasePriority }) {
  const map: Record<CasePriority, { label: string; variant: 'secondary' | 'outline' | 'warning' | 'destructive' }> = {
    LOW: { label: 'Düşük', variant: 'secondary' },
    MEDIUM: { label: 'Orta', variant: 'outline' },
    HIGH: { label: 'Yüksek', variant: 'warning' },
    CRITICAL: { label: 'Kritik', variant: 'destructive' },
  };
  const { label, variant } = map[priority];
  return <Badge variant={variant}>{label}</Badge>;
}
