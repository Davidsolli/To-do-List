import { db } from "../database/db";
import { TaskAssignee } from "../interfaces/task";

export class ReviewerRepository {
    static setReviewers(taskId: number, userIds: number[]): void {
        // Remove all existing reviewers
        db.prepare(`DELETE FROM task_reviewers WHERE task_id = ?`).run(taskId);

        // Add new reviewers
        const insert = db.prepare(`
            INSERT INTO task_reviewers (task_id, user_id)
            VALUES (?, ?)
        `);

        for (const userId of userIds) {
            insert.run(taskId, userId);
        }
    }

    static getReviewers(taskId: number): TaskAssignee[] {
        return db.prepare(`
            SELECT tr.user_id, u.name as user_name, u.email as user_email
            FROM task_reviewers tr
            JOIN users u ON tr.user_id = u.id
            WHERE tr.task_id = ?
        `).all(taskId) as TaskAssignee[];
    }

    static addReviewer(taskId: number, userId: number): void {
        db.prepare(`
            INSERT OR IGNORE INTO task_reviewers (task_id, user_id)
            VALUES (?, ?)
        `).run(taskId, userId);
    }

    static removeReviewer(taskId: number, userId: number): void {
        db.prepare(`
            DELETE FROM task_reviewers 
            WHERE task_id = ? AND user_id = ?
        `).run(taskId, userId);
    }

    static isReviewer(taskId: number, userId: number): boolean {
        const result = db.prepare(`
            SELECT 1 FROM task_reviewers 
            WHERE task_id = ? AND user_id = ?
        `).get(taskId, userId);
        return !!result;
    }
}
