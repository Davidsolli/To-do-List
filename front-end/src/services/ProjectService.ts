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

    static async createProject(name: string, description?: string): Promise<Project> {
        // Envia nome e descrição. O backend deve pegar o userId do token ou esperar no body.
        const user = AuthService.user;
        const body = {
            name,
            description: description || '',
            user_id: user?.id
        };
        const response = await ApiService.post<Project>('projects', body);
        return response;
    }

    static async getProjectById(id: number): Promise<Project> {
        // GET /projects/:id - Backend retorna o projeto diretamente
        const response = await ApiService.get<Project>(`projects/${id}`);
        return response;
    }

    static async updateProject(id: number, data: Partial<Omit<Project, 'id' | 'user_id'>>): Promise<Project> {
        // PUT /projects/:id - Backend retorna o projeto diretamente
        const response = await ApiService.put<Project>(`projects/${id}`, data);
        return response;
    }

    static async deleteProject(id: number): Promise<void> {
        // DELETE /projects/:id
        await ApiService.delete(`projects/${id}`);
    }
}
