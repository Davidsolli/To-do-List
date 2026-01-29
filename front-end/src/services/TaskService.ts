import { ApiService } from './ApiService';
import { AuthService } from './AuthService';

// Interface que define o formato da Tarefa
export interface Task {
    id: number;
    title: string;
    project_name?: string; 
    priority: 'Alta' | 'Média' | 'Baixa';
    status: 'Pendente' | 'Em andamento' | 'Concluída';
    due_date: string;
}

export class TaskService {
    
    static async getUserTasks(): Promise<Task[]> {
        const user = AuthService.user;
        
        if (!user) return [];

        try {

            const response = await ApiService.get<Task[]>(`tasks/user/${user.id}`);
            return response;

        } catch (error) {
            console.error("Erro na API de tarefas:", error);
            return [];
        }
    }
}