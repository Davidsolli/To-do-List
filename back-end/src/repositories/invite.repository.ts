import { db } from "../database/db";
import { ProjectInvite, InviteCreateDTO } from "../interfaces/collaborative";

export class InviteRepository {

    static create(data: InviteCreateDTO): number {
        // Expires in 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const result = db.prepare(`
            INSERT INTO project_invites (project_id, invited_by, email, status, expires_at)
            VALUES (?, ?, ?, 'pending', ?)
        `).run(data.project_id, data.inviter_id, data.email, expiresAt.toISOString());

        return result.lastInsertRowid as number;
    }

    static findById(id: number): ProjectInvite | undefined {
        const result = db.prepare(`
            SELECT pi.*, p.name as project_name, u.name as inviter_name
            FROM project_invites pi
            JOIN projects p ON pi.project_id = p.id
            JOIN users u ON pi.invited_by = u.id
            WHERE pi.id = ?
        `).get(id);
        return result as ProjectInvite | undefined;
    }

    static findByProjectId(projectId: number): ProjectInvite[] {
        const result = db.prepare(`
            SELECT pi.*, u.name as inviter_name
            FROM project_invites pi
            JOIN users u ON pi.invited_by = u.id
            WHERE pi.project_id = ? AND pi.status = 'pending'
            ORDER BY pi.created_at DESC
        `).all(projectId);
        return result as ProjectInvite[];
    }

    static findPendingByEmail(email: string): ProjectInvite[] {
        const now = new Date().toISOString();
        const result = db.prepare(`
            SELECT pi.*, p.name as project_name, u.name as inviter_name
            FROM project_invites pi
            JOIN projects p ON pi.project_id = p.id
            JOIN users u ON pi.invited_by = u.id
            WHERE pi.email = ? AND pi.status = 'pending' AND pi.expires_at > ?
            ORDER BY pi.created_at DESC
        `).all(email, now);
        return result as ProjectInvite[];
    }

    static findByProjectAndEmail(projectId: number, email: string): ProjectInvite | undefined {
        const now = new Date().toISOString();
        const result = db.prepare(`
            SELECT * FROM project_invites 
            WHERE project_id = ? AND email = ? AND status = 'pending' AND expires_at > ?
        `).get(projectId, email, now);
        return result as ProjectInvite | undefined;
    }

    static updateStatus(id: number, status: 'pending' | 'declined'): void {
        db.prepare(`UPDATE project_invites SET status = ? WHERE id = ?`).run(status, id);
    }

    static delete(id: number): void {
        db.prepare(`DELETE FROM project_invites WHERE id = ?`).run(id);
    }

    static deleteExpired(): number {
        const now = new Date().toISOString();
        const result = db.prepare(`DELETE FROM project_invites WHERE expires_at < ?`).run(now);
        return result.changes;
    }

    static findAllPending(): ProjectInvite[] {
        const now = new Date().toISOString();
        const result = db.prepare(`
            SELECT pi.*, p.name as project_name, u.name as inviter_name
            FROM project_invites pi
            JOIN projects p ON pi.project_id = p.id
            JOIN users u ON pi.invited_by = u.id
            WHERE pi.status = 'pending' AND pi.expires_at > ?
            ORDER BY pi.created_at DESC
        `).all(now);
        return result as ProjectInvite[];
    }
}
