import { db } from "../database/db";
import { Task, TaskCreateDto } from "../interfaces/task";

export class TaskRepository {
    static create(taskData: TaskCreateDto): number {
        const result = db.prepare(`
            INSERT INTO tasks (title, description, tip, priority, status, estimate, project_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            taskData.title,
            taskData.description || null,
            taskData.tip || null,
            taskData.priority || null,
            taskData.status || null,
            taskData.estimate || null,
            taskData.project_id
        );

        if (result.changes === 0) {
            throw new Error('Falha ao inserir tarefa no banco de dados');
        }

        return result.lastInsertRowid as number;
    }

    static findById(id: number): Task | undefined {
        return db.prepare(`
            SELECT id, title, description, tip, priority, status, estimate, project_id
            FROM tasks
            WHERE id = ?
        `).get(id) as Task | undefined;
    }

    static findByProjectId(projectId: number): Task[] {
        return db.prepare(`
            SELECT id, title, description, tip, priority, status, estimate, project_id
            FROM tasks
            WHERE project_id = ?
        `).all(projectId) as Task[];
    }

    static findByUserId(userId: number): Task[] {
        return db.prepare(`
            SELECT t.id, t.title, t.description, t.tip, t.priority, t.status, t.estimate, t.project_id
            FROM tasks t
            INNER JOIN projects p ON t.project_id = p.id
            WHERE p.user_id = ?
        `).all(userId) as Task[];
    }
}