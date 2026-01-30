import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { ApiService } from './ApiService';

export class ProjectService {
    // Ajuste a URL se sua API rodar em outra porta
    private static baseUrl = 'http://localhost:3000';

    private static getHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    // Busca todos os projetos (para a Sidebar)
    // Busca todos os projetos do usuário logado
    static async getUserProjects(): Promise<Project[]> {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        if (!user || !user.id) throw new Error('Usuário não autenticado');

        // Backend: GET /projects/user/:userId -> Retorna Promise<Project[]>
        return await ApiService.get<Project[]>(`projects/user/${user.id}`);
    }

    static async createProject(name: string): Promise<Project> {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        if (!user || !user.id) throw new Error('Usuário não autenticado');

        // Backend expects { name, user_id, description? }
        return await ApiService.post<Project>('projects', {
            name,
            user_id: user.id,
            description: 'Novo projeto'
        });
    }

    // Busca um projeto específico e suas tarefas
    static async getById(projectId: string): Promise<{ project: Project, tasks: Task[] }> {
        // 1. Busca os detalhes do projeto
        const project = await ApiService.get<Project>(`projects/${projectId}`);

        // 2. Busca todas as tasks do usuário logado (precisamos do ID do usuário)
        // O AuthService deve ter o userId. Se não tiver, tentamos pegar do projeto se for o owner.
        // Mas a rota de tasks é /tasks/user/:userId.
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        if (!user || !user.id) {
            throw new Error('Usuário não autenticado ou ID não encontrado');
        }

        // 3. Busca TODAS as tasks do projeto específico
        // O backend retorna: { message: "...", tasks: [...] }
        const tasksResponse = await ApiService.get<{ tasks: Task[] }>(`tasks/project/${projectId}`);

        return {
            project: project,
            tasks: tasksResponse.tasks || []
        };
    }

    static async update(id: string, data: Partial<Project>): Promise<Project> {
        return await ApiService.put<Project>(`projects/${id}`, data);
    }

    static async delete(id: string): Promise<void> {
        await ApiService.delete(`projects/${id}`);
    }
}