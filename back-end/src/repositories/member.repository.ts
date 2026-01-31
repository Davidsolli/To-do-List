import { db } from "../database/db";
import { ProjectMember, ProjectRole } from "../interfaces/collaborative";

export class MemberRepository {
    
    static addMember(projectId: number, userId: number, role: ProjectRole): void {
        db.prepare(`
            INSERT OR REPLACE INTO project_members (project_id, user_id, role)
            VALUES (?, ?, ?)
        `).run(projectId, userId, role);
    }

    static removeMember(projectId: number, userId: number): void {
        db.prepare(`DELETE FROM project_members WHERE project_id = ? AND user_id = ?`)
            .run(projectId, userId);
    }

    static getMembers(projectId: number): ProjectMember[] {
        const result = db.prepare(`
            SELECT pm.project_id, pm.user_id, pm.role, u.name as user_name, u.email as user_email
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            WHERE pm.project_id = ?
        `).all(projectId);
        return result as ProjectMember[];
    }

    static getMemberRole(projectId: number, userId: number): ProjectRole | null {
        const result = db.prepare(`
            SELECT role FROM project_members 
            WHERE project_id = ? AND user_id = ?
        `).get(projectId, userId) as { role: ProjectRole } | undefined;
        return result?.role || null;
    }

    static isMember(projectId: number, userId: number): boolean {
        const result = db.prepare(`
            SELECT 1 FROM project_members 
            WHERE project_id = ? AND user_id = ?
        `).get(projectId, userId);
        return !!result;
    }

    static updateRole(projectId: number, userId: number, role: ProjectRole): void {
        db.prepare(`
            UPDATE project_members 
            SET role = ? 
            WHERE project_id = ? AND user_id = ?
        `).run(role, projectId, userId);
    }

    static getMembersByUserId(userId: number): (ProjectMember & { project_name: string })[] {
        const result = db.prepare(`
            SELECT pm.project_id, pm.user_id, pm.role, p.name as project_name
            FROM project_members pm
            JOIN projects p ON pm.project_id = p.id
            WHERE pm.user_id = ?
        `).all(userId);
        return result as (ProjectMember & { project_name: string })[];
    }

    static getTaskAssignmentCount(projectId: number, userId: number): number {
        const result = db.prepare(`
            SELECT COUNT(*) as count
            FROM task_assignees ta
            JOIN tasks t ON ta.task_id = t.id
            WHERE t.project_id = ? AND ta.user_id = ?
        `).get(projectId, userId) as { count: number };
        return result.count;
    }

    static removeUserFromProjectTasks(projectId: number, userId: number): void {
        db.prepare(`
            DELETE FROM task_assignees
            WHERE user_id = ? AND task_id IN (
                SELECT id FROM tasks WHERE project_id = ?
            )
        `).run(userId, projectId);
    }
}
