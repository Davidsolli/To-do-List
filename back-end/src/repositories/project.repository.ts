import { db } from "../database/db";
import { Project, ProjectCreateDto } from "../interfaces/project";

export class ProjectRepository {

    static create(projectData: ProjectCreateDto): number {
        const result = db.prepare(`INSERT INTO projects (name, user_id, description)
        VALUES (?, ?, ?)`).run(projectData.name, projectData.user_id, projectData.description);
        if (result.changes === 0) {
            throw new Error('Falha ao inserir projeto no banco de dados');
        }
        return result.lastInsertRowid as number;
    }

    static findById(id: number): Project | undefined {
        const result = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
        return result as Project | undefined;
    }

    static findByProjectName(name: string, userId: number): Project | undefined {
        const result = db.prepare(`SELECT * FROM projects WHERE name = ? AND user_id = ?`).get(name, userId);
        return result as Project | undefined;
    }

    static update(id: number, projectData: ProjectCreateDto): number {
        const result = db.prepare(`UPDATE projects SET name = ?, description = ? WHERE id = ?`) 
            .run(projectData.name, projectData.description, id);
        if (result.changes === 0) {
            throw new Error('Falha ao atualizar projeto no banco de dados');
        }
        return result.changes;
    }
}
