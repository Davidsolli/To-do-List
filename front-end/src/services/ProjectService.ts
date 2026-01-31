import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { ProjectMember, ProjectRole, AuditLog } from '../models/Collaboration';
import { ApiService } from './ApiService';
import { AuthService } from './AuthService';

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
        const projects = await ApiService.get<Project[]>(`projects/user/${user.id}`);
        
        // Enriquecer cada projeto com role e task stats
        const enrichedProjects = await Promise.all(projects.map(async (project) => {
            try {
                // Buscar role do usuário
                const members = await this.getMembers(project.id);
                const member = members.find(m => m.user_id === user.id);
                project.role = member?.role || undefined;
                
                // Buscar estatísticas de tarefas
                const tasksResponse = await ApiService.get<{ tasks: Task[] }>(`tasks/project/${project.id}`);
                const tasks = tasksResponse.tasks || [];
                project.taskStats = {
                    completed: tasks.filter(t => t.status === 'completed').length,
                    total: tasks.length
                };
            } catch (error) {
                console.error(`Erro ao enriquecer projeto ${project.id}:`, error);
                project.taskStats = { completed: 0, total: 0 };
            }
            return project;
        }));
        
        return enrichedProjects;
    }

    // Método do develop: criar projeto com descrição opcional
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

    // Método do develop: buscar projeto por ID (simples)
    static async getProjectById(id: number): Promise<Project> {
        // GET /projects/:id - Backend retorna o projeto diretamente
        const response = await ApiService.get<Project>(`projects/${id}`);
        return response;
    }

    // Método do HEAD: buscar projeto com tarefas (necessário para Kanban)
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

    // Método do develop: atualizar projeto
    static async updateProject(id: number, data: Partial<Omit<Project, 'id' | 'user_id'>>): Promise<Project> {
        // PUT /projects/:id - Backend retorna o projeto diretamente
        const response = await ApiService.put<Project>(`projects/${id}`, data);
        return response;
    }

    // Método do HEAD: atualizar projeto (compatibilidade com Kanban)
    static async update(id: string, data: Partial<Project>): Promise<Project> {
        return await ApiService.put<Project>(`projects/${id}`, data);
    }

    static async delete(id: string): Promise<void> {
        await ApiService.delete(`projects/${id}`);
    }

    // Alias para compatibilidade com DashboardView e ProjectsView
    static async deleteProject(id: number): Promise<void> {
        await ApiService.delete(`projects/${id}`);
    }

    // ===== COLLABORATIVE FEATURES =====

    // Get project members
    static async getMembers(projectId: string | number): Promise<ProjectMember[]> {
        const response = await ApiService.get<{ members: ProjectMember[] } | ProjectMember[]>(`projects/${projectId}/members`);
        // Handle both response formats
        if (Array.isArray(response)) {
            return response;
        }
        return response.members || [];
    }

    // Invite user to project
    static async inviteUser(projectId: number, email: string): Promise<void> {
        await ApiService.post(`projects/${projectId}/invite`, { email });
    }

    // Remove member from project
    static async removeMember(projectId: number, userId: number): Promise<{ tasksAffected: number }> {
        return await ApiService.delete<{ message: string, tasksAffected: number }>(`projects/${projectId}/members/${userId}`);
    }

    // Update member role
    static async updateMemberRole(projectId: number, userId: number, role: ProjectRole): Promise<void> {
        await ApiService.patch(`projects/${projectId}/members/${userId}`, { role });
    }

    // Transfer ownership
    static async transferOwnership(projectId: number, newOwnerId: number): Promise<void> {
        await ApiService.post(`projects/${projectId}/transfer`, { newOwnerId });
    }

    // Get audit logs
    static async getAuditLogs(projectId: string | number, page: number = 1): Promise<AuditLog[]> {
        const response = await ApiService.get<{ logs: AuditLog[] } | AuditLog[]>(`projects/${projectId}/audit?page=${page}`);
        // Handle both response formats
        if (Array.isArray(response)) {
            return response;
        }
        return response.logs || [];
    }

    // Check if user is owner or admin
    static async getUserRole(projectId: string | number): Promise<ProjectRole | null> {
        try {
            const members = await this.getMembers(projectId);
            const user = JSON.parse(localStorage.getItem('user_data') || '{}');
            
            const member = members.find(m => m.user_id === user.id);
            if (member?.role === ProjectRole.OWNER) return ProjectRole.OWNER;
            
            return member?.role || null;
        } catch {
            return null;
        }
    }
}