import { ApiService } from './ApiService';
import { AuthService } from './AuthService';
import { Task } from '../models/Task';

// Interface para resposta da API - Task já tem estimate e project_id
export interface TaskResponse extends Task {
    project_name?: string; // Campo extra que pode vir da API ou será preenchido
}

export class TaskService {

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
}