// ===== PROJECT ROLES =====
export enum ProjectRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    MEMBER = 'member'
}

// ===== PROJECT MEMBER =====
export interface ProjectMember {
    project_id: number;
    user_id: number;
    role: ProjectRole;
    user_name?: string;
    user_email?: string;
}

// ===== PROJECT INVITE =====
export interface ProjectInvite {
    id: number;
    project_id: number;
    inviter_id: number;
    email: string;
    status: 'pending' | 'declined';
    expires_at: string;
    created_at: string;
    project_name?: string;
    inviter_name?: string;
}

export interface InviteCreateDTO {
    project_id: number;
    inviter_id: number;
    email: string;
}

// ===== NOTIFICATION =====
export enum NotificationType {
    INVITE = 'invite',
    ROLE_CHANGE = 'role_change',
    REMOVED = 'removed',
    ASSIGNMENT = 'assignment',
    ADMIN_PROMOTED = 'admin_promoted',
    COMMENT = 'comment',
    REVIEWER_ASSIGNED = 'reviewer_assigned',
    TASK_READY = 'task_ready'
}

export interface Notification {
    id: number;
    user_id: number;
    type: NotificationType;
    message: string;
    read: boolean;
    data?: string; // JSON string with extra info
    created_at: string;
}

export interface NotificationCreateDTO {
    user_id: number;
    type: NotificationType;
    message: string;
    data?: object;
}

// ===== AUDIT LOG =====
export enum AuditAction {
    INVITE_SENT = 'invite_sent',
    INVITE_ACCEPTED = 'invite_accepted',
    INVITE_DECLINED = 'invite_declined',
    ROLE_CHANGED = 'role_changed',
    MEMBER_REMOVED = 'member_removed',
    OWNERSHIP_TRANSFERRED = 'ownership_transferred',
    PROJECT_DELETED = 'project_deleted',
    TASK_ASSIGNED = 'task_assigned',
    TASK_UNASSIGNED = 'task_unassigned',
    TASK_REVIEWER_ASSIGNED = 'task_reviewer_assigned'
}

export interface AuditLog {
    id: number;
    project_id?: number;
    user_id?: number;
    user_name?: string;
    user_email?: string;
    action: AuditAction;
    details?: string;
    created_at: string;
}

export interface AuditLogCreateDTO {
    project_id?: number;
    user_id?: number;
    action: AuditAction;
    details?: string;
}
