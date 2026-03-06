export type SubscriptionPlan = 'FREE' | 'PRO' | 'ENTERPRISE';
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type NotificationType =
  | 'CASE_ASSIGNED'
  | 'CASE_UPDATED'
  | 'CASE_CLOSED'
  | 'CASE_COMMENT'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: SubscriptionPlan;
  isActive: boolean;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  title?: string;
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMember[];
  _count?: { cases: number; members: number };
}

export interface CaseUpdate {
  id: string;
  content: string;
  createdAt: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
}

export interface Case {
  id: string;
  title: string;
  description?: string;
  status: CaseStatus;
  priority: CasePriority;
  dueDate?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  createdBy: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  assignee?: ProjectMember;
  updates?: CaseUpdate[];
  _count?: { updates: number };
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  payload?: Record<string, string>;
  createdAt: string;
  case?: { id: string; title: string; projectId: string };
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  createdBy: Pick<User, 'id' | 'name' | 'email'>;
  _count?: { cases: number };
}
