import { db } from "../database/db";
import { Project, ProjectCreateDTO, ProjectUpdateDTO } from "../interfaces/project";

export class ProjectRepository {

    static create(projectData: ProjectCreateDTO): number {
        const result = db.prepare(`INSERT INTO projects (name, user_id, description)
        VALUES (?, ?, ?)`).run(projectData.name, projectData.user_id, projectData.description);
        if (result.changes === 0) {
            throw new Error('Falha ao inserir projeto no banco de dados');
        }
        return result.lastInsertRowid as number;
    }

    static findByUserId(userId: number): Project[] {
        const result = db.prepare('SELECT * FROM projects WHERE user_id = ?').all(userId);
        return result as Project[];
    }

    // Find all projects where user is owner OR member
    static findAllUserProjects(userId: number): Project[] {
        const result = db.prepare(`
            SELECT DISTINCT p.* FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE p.user_id = ? OR pm.user_id = ?
        `).all(userId, userId);
        return result as Project[];
    }

    static findById(id: number): Project | undefined {
        const result = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
        return result as Project | undefined;
    }

    static findByProjectName(name: string, userId: number): Project | undefined {
        const result = db.prepare(`SELECT * FROM projects WHERE name = ? AND user_id = ?`).get(name, userId);
        return result as Project | undefined;
    }

    static update(id: number, projectData: ProjectUpdateDTO): number {
        const result = db.prepare(`UPDATE projects SET name = ?, description = ? WHERE id = ?`) 
            .run(projectData.name, projectData.description, id);
        if (result.changes === 0) {
            throw new Error('Falha ao atualizar projeto no banco de dados');
        }
        return result.changes;
    }

    static delete(id: number): number {
        const result = db.prepare(`DELETE FROM projects WHERE id = ?`).run(id);
        if (result.changes === 0) {
            throw new Error('Falha ao deletar projeto no banco de dados');
        }
        return result.changes;
    }

    static updateOwner(id: number, newOwnerId: number): number {
        const result = db.prepare(`UPDATE projects SET user_id = ? WHERE id = ?`).run(newOwnerId, id);
        if (result.changes === 0) {
            throw new Error('Falha ao transferir propriedade do projeto');
        }
        return result.changes;
    }
}
