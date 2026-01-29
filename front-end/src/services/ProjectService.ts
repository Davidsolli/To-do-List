import { ApiService } from './ApiService';
import { Project } from '../models/Project';

import { AuthService } from './AuthService';

export class ProjectService {
    static async getUserProjects(): Promise<Project[]> {
        const user = AuthService.user;
        if (!user) {
            throw new Error('Usuário não autenticado');
        }
        // O backend espera /projects/user/:userId
        const response = await ApiService.get<{ projects: Project[] }>(`projects/user/${user.id}`);
        // Verifica se o backend retorna { projects: [...] } ou o array direto
        // Ajuste conforme o retorno real do seu controller
        return (response as any).projects || response;
    }

    static async createProject(name: string): Promise<Project> {
        // Envia o nome. O backend deve pegar o userId do token ou esperar no body.
        // Se precisar do userId no body explícito:
        const user = AuthService.user;
        const body = { name, user_id: user?.id };
        const response = await ApiService.post<{ message: string, project: Project }>('projects', body);
        return response.project;
    }

    static async getProjectById(id: number): Promise<Project> {
        // GET /projects/:id
        const response = await ApiService.get<{ project: Project }>(`projects/${id}`);
        // Ajuste conforme o retorno: { project: ... } ou direto
        return response.project || (response as any) as Project;
    }

    static async updateProject(id: number, data: Partial<Omit<Project, 'id' | 'user_id'>>): Promise<Project> {
        // PUT /projects/:id
        const response = await ApiService.put<{ message: string, project: Project }>(`projects/${id}`, data);
        return response.project;
    }

    static async deleteProject(id: number): Promise<void> {
        // DELETE /projects/:id
        await ApiService.delete(`projects/${id}`);
    }
}
