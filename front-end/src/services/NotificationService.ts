import { ApiService } from './ApiService';
import { Notification } from '../models/Collaboration';

export interface NotificationsResponse {
    notifications: Notification[];
    total: number;
    unreadCount: number;
}

export class NotificationService {
    
    // Get all notifications with pagination
    static async getAll(page: number = 1, limit: number = 20): Promise<NotificationsResponse> {
        return await ApiService.get<NotificationsResponse>(`notifications?page=${page}&limit=${limit}`);
    }

    // Get unread notifications
    static async getUnread(): Promise<{ notifications: Notification[], count: number }> {
        return await ApiService.get<{ notifications: Notification[], count: number }>('notifications/unread');
    }

    // Get unread count only
    static async getUnreadCount(): Promise<number> {
        const response = await ApiService.get<{ count: number }>('notifications/count');
        return response.count;
    }

    // Mark single notification as read
    static async markAsRead(id: number): Promise<void> {
        await ApiService.patch(`notifications/${id}/read`, {});
    }

    // Mark all as read
    static async markAllAsRead(): Promise<void> {
        await ApiService.patch('notifications/read-all', {});
    }

    // Delete notification
    static async delete(id: number): Promise<void> {
        await ApiService.delete(`notifications/${id}`);
    }
}
