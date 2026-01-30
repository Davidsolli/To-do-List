import { TaskPriority, TaskStatus } from "../enums/task.enums";
import { TaskCreateDTO } from "../interfaces/task";

export class TaskValidation {
  static validateTaskCreation(taskData: TaskCreateDTO) {
    this.validateTitle(taskData.title);
    this.validateProjectId(taskData.project_id);

    if (taskData.description) {
      this.validateDescription(taskData.description);
    }
    if (taskData.priority) {
      this.validatePriority(taskData.priority);
    }
    if (taskData.status) {
      this.validateStatus(taskData.status);
    }
    if (taskData.estimate !== undefined) {
      this.validateEstimate(taskData.estimate);
    }
  }

  static validateTitle(title: string) {
    if (!title || title.trim().length < 1) {
      throw new Error("Título é obrigatório e deve ter pelo menos 1 caractere");
    }
  }

  static validateDescription(description?: string) {
    if (!description) return true;
    if (description.trim().length <= 0) {
      throw new Error("Descrição inválida");
    }
  }

  static validatePriority(priority?: string) {
    if (!priority) return true;
    const validPriorities = Object.values(TaskPriority) as string[];
    if (!validPriorities.includes(priority.toLowerCase())) {
      throw new Error(`Prioridade deve ser uma das seguintes: ${validPriorities.join(", ")}`);
    }
  }

  static validateStatus(status?: string) {
    if (!status) return true;
    const validStatuses = Object.values(TaskStatus) as string[];
    if (!validStatuses.includes(status.toLowerCase())) {
      throw new Error(`Status deve ser um dos seguintes: ${validStatuses.join(", ")}`);
    }
  }

  static validateEstimate(estimate?: number) {
    if (estimate === undefined) return true;
    if (estimate <= 0) {
      throw new Error("Estimativa deve ser um número positivo");
    }
  }

  static validateProjectId(projectId?: number) {
    if (!projectId || projectId <= 0) {
      throw new Error("ID do projeto é obrigatório e deve ser válido");
    }
  }
}
