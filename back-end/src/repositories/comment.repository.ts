import { db } from "../database/db";

export interface TaskComment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user_name?: string;
    user_email?: string;
}

export class CommentRepository {
    static create(taskId: number, userId: number, content: string): TaskComment {
        const result = db.prepare(`
            INSERT INTO task_comments (task_id, user_id, content)
            VALUES (?, ?, ?)
        `).run(taskId, userId, content);

        return this.findById(result.lastInsertRowid as number)!;
    }

    static findById(id: number): TaskComment | undefined {
        return db.prepare(`
            SELECT c.*, u.name as user_name, u.email as user_email
            FROM task_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.id = ?
        `).get(id) as TaskComment | undefined;
    }

    static findByTaskId(taskId: number): TaskComment[] {
        return db.prepare(`
            SELECT c.*, u.name as user_name, u.email as user_email
            FROM task_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.task_id = ?
            ORDER BY c.created_at DESC
        `).all(taskId) as TaskComment[];
    }

    static update(id: number, content: string): TaskComment | undefined {
        db.prepare(`
            UPDATE task_comments 
            SET content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(content, id);

        return this.findById(id);
    }

    static delete(id: number): boolean {
        const result = db.prepare(`DELETE FROM task_comments WHERE id = ?`).run(id);
        return result.changes > 0;
    }

    static getCommentOwner(id: number): number | null {
        const result = db.prepare(`SELECT user_id FROM task_comments WHERE id = ?`).get(id) as { user_id: number } | undefined;
        return result?.user_id || null;
    }
}
