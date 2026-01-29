import { TaskCreateDTO, TaskResponseDTO } from "../interfaces/task";
import { TaskRepository } from "../repositories/task.repository";
import { TaskValidation } from "../validations/task.validation";

export class TaskService {
    static async createTask(taskData: TaskCreateDTO): Promise<TaskResponseDTO> {
        TaskValidation.validateTaskCreation(taskData);
        return TaskRepository.create(taskData);
    }

    static async getTasksByUserId(userId: number): Promise<TaskResponseDTO[]> {
        return TaskRepository.findByUserId(userId);
    }

    static async searchTasksByUserIdAndKeyword(userId: number, keyword: string): Promise<TaskResponseDTO[]> {
        if (!keyword || keyword.trim().length === 0) {
            throw new Error("Parâmetro de busca não pode estar vazio");
        }
        return TaskRepository.searchByUserIdAndKeyword(userId, keyword.trim());
    }
    static async updateTask(
        taskId: number,
        taskData: Partial<TaskCreateDTO>
    ): Promise<TaskResponseDTO> {

        return TaskRepository.update(taskId, taskData);
    }

    static async updateTaskStatus(
        taskId: number,
        status: string
    ): Promise<TaskResponseDTO> {

        if (status.trim().length === 0) {
            throw new Error("Status inválido");
        }

        return TaskRepository.updateStatus(taskId, status);
    }

    static async deleteTask(taskId: number): Promise<void> {
  return TaskRepository.delete(taskId);
}

}
