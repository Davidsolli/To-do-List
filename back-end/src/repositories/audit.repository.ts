import { db } from "../database/db";
import { AuditLog, AuditLogCreateDTO } from "../interfaces/collaborative";

export class AuditLogRepository {

    static create(data: AuditLogCreateDTO): number {
        const result = db.prepare(`
            INSERT INTO audit_logs (project_id, user_id, action, details)
            VALUES (?, ?, ?, ?)
        `).run(data.project_id ?? null, data.user_id ?? null, data.action, data.details ?? null);
        return result.lastInsertRowid as number;
    }

    static findByProjectId(projectId: number, limit: number = 100, offset: number = 0): AuditLog[] {
        const result = db.prepare(`
            SELECT 
                al.*,
                u.name as user_name,
                u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.project_id = ?
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `).all(projectId, limit, offset);
        return result as AuditLog[];
    }

    static findByUserId(userId: number, limit: number = 100, offset: number = 0): AuditLog[] {
        const result = db.prepare(`
            SELECT 
                al.*,
                u.name as user_name,
                u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.user_id = ?
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `).all(userId, limit, offset);
        return result as AuditLog[];
    }

    static findAll(limit: number = 100, offset: number = 0): AuditLog[] {
        const result = db.prepare(`
            SELECT 
                al.*,
                u.name as user_name,
                u.email as user_email
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `).all(limit, offset);
        return result as AuditLog[];
    }

    static getCountByProjectId(projectId: number): number {
        const result = db.prepare(`
            SELECT COUNT(*) as count FROM audit_logs 
            WHERE project_id = ?
        `).get(projectId) as { count: number };
        return result.count;
    }
}
