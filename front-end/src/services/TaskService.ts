import { ApiService } from './ApiService';
import { AuthService } from './AuthService';
import { Task } from '../models/Task';

// Interface para resposta da API - Task já tem estimate e project_id
export interface TaskResponse extends Task {
    project_name?: string; // Campo extra que pode vir da API ou será preenchido
}

export class TaskService {
    // Método do develop: buscar tarefas do usuário logado
    static async getUserTasks(): Promise<TaskResponse[]> {
        const user = AuthService.user;

        if (!user) return [];

        try {
            const response = await ApiService.get<TaskResponse[]>(`tasks/user/${user.id}`);
            return response;

        } catch (error) {
            console.error("Erro na API de tarefas:", error);
            return [];
        }
    }

    // Métodos do HEAD: necessários para o Kanban (create, update, updateStatus, delete)
    static async create(task: Partial<Task>): Promise<Task> {
        // Backend espera { title, description, priority, project_id, ... }
        const response = await ApiService.post<{ message: string, task: Task }>('tasks', task);
        return response.task;
    }

    static async update(id: string, data: Partial<Task>): Promise<Task> {
        const response = await ApiService.put<{ message: string, task: Task }>(`tasks/${id}`, data);
        // Backend retorna { message, task }
        return response.task;
    }

    static async updateStatus(id: string, status: string): Promise<Task> {
        const response = await ApiService.patch<{ message: string, task: Task }>(`tasks/${id}/status`, { status });
        return response.task;
    }

    static async delete(id: string): Promise<void> {
        await ApiService.delete(`tasks/${id}`);
    }
}