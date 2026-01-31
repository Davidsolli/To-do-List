import { NotificationRepository } from "../repositories/notification.repository";
import { Notification, NotificationCreateDTO, NotificationType } from "../interfaces/collaborative";

export class NotificationService {

    static create(data: NotificationCreateDTO): number {
        return NotificationRepository.create(data);
    }

    static getByUserId(userId: number, page: number = 1, limit: number = 20): { 
        notifications: Notification[], 
        total: number, 
        unreadCount: number 
    } {
        const offset = (page - 1) * limit;
        const notifications = NotificationRepository.findByUserId(userId, limit, offset);
        const total = NotificationRepository.getTotalCount(userId);
        const unreadCount = NotificationRepository.getUnreadCount(userId);
        return { notifications, total, unreadCount };
    }

    static getUnread(userId: number): Notification[] {
        return NotificationRepository.findUnreadByUserId(userId);
    }

    static getUnreadCount(userId: number): number {
        return NotificationRepository.getUnreadCount(userId);
    }

    static markAsRead(id: number, userId: number): void {
        const notification = NotificationRepository.findById(id);
        if (!notification || notification.user_id !== userId) {
            throw new Error("Notificação não encontrada ou sem permissão");
        }
        NotificationRepository.markAsRead(id);
    }

    static markAllAsRead(userId: number): void {
        NotificationRepository.markAllAsRead(userId);
    }

    static delete(id: number, userId: number): void {
        const notification = NotificationRepository.findById(id);
        if (!notification || notification.user_id !== userId) {
            throw new Error("Notificação não encontrada ou sem permissão");
        }
        NotificationRepository.delete(id);
    }

    // Helper methods to send specific notification types
    static notifyInvite(userId: number, projectName: string, inviterName: string, inviteId: number, projectId: number): void {
        this.create({
            user_id: userId,
            type: NotificationType.INVITE,
            message: `${inviterName} convidou você para o projeto "${projectName}"`,
            data: { invite_id: inviteId, project_id: projectId }
        });
    }

    static notifyRoleChange(userId: number, projectName: string, newRole: string, projectId: number): void {
        this.create({
            user_id: userId,
            type: NotificationType.ROLE_CHANGE,
            message: `Seu papel no projeto "${projectName}" foi alterado para ${newRole}`,
            data: { project_id: projectId, new_role: newRole }
        });
    }

    static notifyAdminPromoted(userId: number, projectName: string, projectId: number): void {
        this.create({
            user_id: userId,
            type: NotificationType.ADMIN_PROMOTED,
            message: `Você foi promovido a administrador do projeto "${projectName}"`,
            data: { project_id: projectId }
        });
    }

    static notifyRemoved(userId: number, projectName: string): void {
        this.create({
            user_id: userId,
            type: NotificationType.REMOVED,
            message: `Você foi removido do projeto "${projectName}"`,
            data: {}
        });
    }

    static notifyAssignment(userId: number, taskTitle: string, projectName: string, taskId: number, projectId: number): void {
        this.create({
            user_id: userId,
            type: NotificationType.ASSIGNMENT,
            message: `Você foi atribuído à tarefa "${taskTitle}" no projeto "${projectName}"`,
            data: { task_id: taskId, project_id: projectId }
        });
    }
}
