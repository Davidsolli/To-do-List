import { db } from "../database/db";
import { Notification, NotificationCreateDTO } from "../interfaces/collaborative";

export class NotificationRepository {

    static create(data: NotificationCreateDTO): number {
        const result = db.prepare(`
            INSERT INTO notifications (user_id, type, message, data)
            VALUES (?, ?, ?, ?)
        `).run(
            data.user_id,
            data.type,
            data.message,
            data.data ? JSON.stringify(data.data) : null
        );
        return result.lastInsertRowid as number;
    }

    static findById(id: number): Notification | undefined {
        const result = db.prepare(`SELECT * FROM notifications WHERE id = ?`).get(id) as any;
        if (result && result.created_at) {
            result.created_at = result.created_at + 'Z'; // Interpret as UTC
        }
        return result as Notification | undefined;
    }

    static findByUserId(userId: number, limit: number = 50, offset: number = 0): Notification[] {
        const result = db.prepare(`
            SELECT * FROM notifications 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `).all(userId, limit, offset) as any[];
        
        // Add 'Z' suffix to interpret timestamps as UTC
        return result.map(n => ({
            ...n,
            created_at: n.created_at + 'Z'
        })) as Notification[];
    }

    static findUnreadByUserId(userId: number): Notification[] {
        const result = db.prepare(`
            SELECT * FROM notifications 
            WHERE user_id = ? AND read = 0
            ORDER BY created_at DESC
        `).all(userId) as any[];
        
        // Add 'Z' suffix to interpret timestamps as UTC
        return result.map(n => ({
            ...n,
            created_at: n.created_at + 'Z'
        })) as Notification[];
    }

    static getUnreadCount(userId: number): number {
        const result = db.prepare(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND read = 0
        `).get(userId) as { count: number };
        return result.count;
    }

    static markAsRead(id: number): void {
        db.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(id);
    }

    static markAllAsRead(userId: number): void {
        db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(userId);
    }

    static delete(id: number): void {
        db.prepare(`DELETE FROM notifications WHERE id = ?`).run(id);
    }

    static deleteByUserId(userId: number): void {
        db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(userId);
    }

    static getTotalCount(userId: number): number {
        const result = db.prepare(`
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ?
        `).get(userId) as { count: number };
        return result.count;
    }
}
