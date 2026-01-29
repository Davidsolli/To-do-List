import { ApiService } from './ApiService';
import { Project } from '../models/Project';

export class ProjectService {
    private static readonly ENDPOINT = 'projects';

    /**
     * Busca todos os projetos do usuário
     */
    static async getAll(userId: number): Promise<Project[]> {
        return ApiService.get<Project[]>(`${this.ENDPOINT}/user/${userId}`);
    }

    /**
     * Busca um projeto pelo ID
     */
    static async getById(id: string): Promise<Project> {
        return ApiService.get<Project>(`${this.ENDPOINT}/${id}`);
    }

    /**
     * Cria um novo projeto
     */
    static async create(project: Partial<Project>): Promise<Project> {
        return ApiService.post<Project>(this.ENDPOINT, project);
    }

    /**
     * Atualiza um projeto existente
     */
    static async update(id: string, project: Partial<Project>): Promise<Project> {
        return ApiService.put<Project>(`${this.ENDPOINT}/${id}`, project);
    }

    /**
     * Remove um projeto
     */
    static async delete(id: string): Promise<void> {
        return ApiService.delete<void>(`${this.ENDPOINT}/${id}`);
    }
}
