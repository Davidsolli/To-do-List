import { Task } from '../models/Task';
import { ApiService } from './ApiService';
// TaskStatus is in Task model now

export class TaskService {

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