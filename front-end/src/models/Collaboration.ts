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

// ===== NOTIFICATION =====
export enum NotificationType {
    INVITE = 'invite',
    ROLE_CHANGE = 'role_change',
    REMOVED = 'removed',
    ASSIGNMENT = 'assignment',
    ADMIN_PROMOTED = 'admin_promoted'
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

export interface NotificationData {
    invite_id?: number;
    project_id?: number;
    task_id?: number;
    new_role?: string;
}

// ===== AUDIT LOG =====
export interface AuditLog {
    id: number;
    project_id?: number;
    user_id?: number;
    user_name?: string;
    action: string;
    details?: string;
    created_at: string;
}

// Helper to parse notification data
export function parseNotificationData(data?: string): NotificationData | null {
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}
