import { TaskCreateDto, TaskResponseDTO } from "../interfaces/task";
import { TaskRepository } from "../repositories/task.repository";
import { TaskValidation } from "../validations/task.validation";

export class TaskService {
    static async createTask(taskData: TaskCreateDto): Promise<TaskResponseDTO> {
        // Validações
        if (!TaskValidation.validateTitle(taskData.title)) {
            throw new Error('Título é obrigatório e deve ter pelo menos 1 caractere');
        }

        if (!TaskValidation.validateProjectId(taskData.project_id)) {
            throw new Error('ID do projeto é obrigatório e deve ser válido');
        }

        if (!TaskValidation.validateDescription(taskData.description)) {
            throw new Error('Descrição inválida');
        }

        if (!TaskValidation.validatePriority(taskData.priority)) {
            throw new Error('Prioridade deve ser low, medium ou high');
        }

        if (!TaskValidation.validateStatus(taskData.status)) {
            throw new Error('Status deve ser pending, in_progress ou completed');
        }

        if (!TaskValidation.validateEstimate(taskData.estimate)) {
            throw new Error('Estimativa deve ser um número positivo');
        }

        // Criar tarefa
        const taskId = TaskRepository.create(taskData);

        // Buscar tarefa criada
        const newTask = TaskRepository.findById(taskId);

        if (!newTask) {
            throw new Error('Erro ao criar tarefa');
        }

        return newTask;
    }

    static async getTasksByUserId(userId: number): Promise<TaskResponseDTO[]> {
        if (!userId || userId <= 0) {
            throw new Error('ID do usuário é obrigatório e deve ser válido');
        }

        const tasks = TaskRepository.findByUserId(userId);
        return tasks;
    }

    static async getTaskById(taskId: number, userId: number): Promise<TaskResponseDTO | null> {
        if (!taskId || taskId <= 0) {
            throw new Error('ID da tarefa é obrigatório e deve ser válido');
        }

        if (!userId || userId <= 0) {
            throw new Error('ID do usuário é obrigatório e deve ser válido');
        }

        // Buscar a tarefa
        const task = TaskRepository.findById(taskId);

        if (!task) {
            return null;
        }

        // Verificar se a tarefa pertence a um projeto do usuário
        const userTasks = TaskRepository.findByUserId(userId);
        const belongsToUser = userTasks.some((t: TaskResponseDTO) => t.id === taskId);

        if (!belongsToUser) {
            return null;
        }

        return task;
    }
}