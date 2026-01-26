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
}