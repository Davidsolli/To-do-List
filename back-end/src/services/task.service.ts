import { TaskCreateDTO, TaskResponseDTO } from "../interfaces/task";
import { TaskRepository } from "../repositories/task.repository";
import { TaskValidation } from "../validations/task.validation";
import { AIService } from "./ai.service";
import { NotificationService } from "./notification.service";
import { ProjectRepository } from "../repositories/project.repository";
import { MemberRepository } from "../repositories/member.repository";
import { AuditLogService } from "./audit.service";
import { AuditAction, NotificationType } from "../interfaces/collaborative";
import { ReviewerRepository } from "../repositories/reviewer.repository";

export class TaskService {
    static async createTask(taskData: TaskCreateDTO, assigneeIds?: number[]): Promise<TaskResponseDTO> {
        TaskValidation.validateTaskCreation(taskData);
        
        const task = TaskRepository.create(taskData);

        // Handle assignees separately
        if (assigneeIds && assigneeIds.length > 0) {
            TaskRepository.setAssignees(task.id, assigneeIds);
            
            const project = ProjectRepository.findById(task.project_id);
            if (project) {
                for (const userId of assigneeIds) {
                    NotificationService.notifyAssignment(
                        userId,
                        task.title,
                        project.name,
                        task.id,
                        task.project_id
                    );
                }
            }
            
            // Reload task with assignees
            return TaskRepository.findById(task.id) || task;
        }

        return task;
    }

    static async getTaskById(taskId: number): Promise<TaskResponseDTO | undefined> {
        return TaskRepository.findById(taskId);
    }

    static async getTasksByUserId(userId: number): Promise<TaskResponseDTO[]> {
        return TaskRepository.findByUserId(userId);
    }

    static async getTasksByProjectId(projectId: number): Promise<TaskResponseDTO[]> {
        return TaskRepository.findByProjectId(projectId);
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

        const updatedTask = TaskRepository.update(taskId, taskData);

        // Notify reviewers when task moves to ready (if status was updated)
        if (taskData.status === 'ready') {
            const task = TaskRepository.findById(taskId);
            if (task && task.reviewers && task.reviewers.length > 0) {
                const { NotificationService } = require('./notification.service');
                const { ProjectRepository } = require('../repositories/project.repository');
                const project = ProjectRepository.findById(task.project_id);
                const projectName = project?.name || 'Projeto';

                task.reviewers.forEach(reviewer => {
                    NotificationService.notifyTaskReady(
                        reviewer.user_id,
                        task.title,
                        projectName,
                        taskId,
                        task.project_id
                    );
                });
            }
        }

        return updatedTask;
    }

    static async updateTaskStatus(
        taskId: number,
        status: string
    ): Promise<TaskResponseDTO> {

        if (status.trim().length === 0) {
            throw new Error("Status inválido");
        }

        const updatedTask = TaskRepository.updateStatus(taskId, status);

        // Notify reviewers when task moves to ready
        if (status === 'ready') {
            const task = TaskRepository.findById(taskId);
            if (task && task.reviewers && task.reviewers.length > 0) {
                const { NotificationService } = require('./notification.service');
                const { ProjectRepository } = require('../repositories/project.repository');
                const project = ProjectRepository.findById(task.project_id);
                const projectName = project?.name || 'Projeto';

                task.reviewers.forEach(reviewer => {
                    NotificationService.notifyTaskReady(
                        reviewer.user_id,
                        task.title,
                        projectName,
                        taskId,
                        task.project_id
                    );
                });
            }
        }

        return updatedTask;
    }

    static async deleteTask(taskId: number): Promise<void> {
  return TaskRepository.delete(taskId);
}

    static async generateTip(taskId: number, forceRegenerate: boolean = false): Promise<TaskResponseDTO> {
        // Buscar a task
        const task = TaskRepository.findById(taskId);

        if (!task) {
            throw new Error("Task não encontrada");
        }

        // Se já tem dica e não é para forçar regeneração, retorna a existente
        if (task.tip && !forceRegenerate) {
            return task;
        }

        // Gerar nova dica com IA
        const tip = await AIService.generateTaskTip(task.title, task.description || undefined);

        // Atualizar a task com a nova dica
        const updatedTask = TaskRepository.update(taskId, { tip });

        return updatedTask;
    }

    static async updateAssignees(
        taskId: number,
        assignees: number[],
        projectId: number,
        actorUserId: number
    ): Promise<TaskResponseDTO> {
        const task = TaskRepository.findById(taskId);
        if (!task) throw new Error("Task não encontrada");

        // Get current assignees to compare
        const currentAssignees = task.assignees?.map(a => a.user_id) || [];
        const newAssignees = assignees.filter(id => !currentAssignees.includes(id));

        // Update assignees using repository method
        TaskRepository.setAssignees(taskId, assignees);
        const updatedTask = TaskRepository.findById(taskId);
        if (!updatedTask) throw new Error("Erro ao atualizar task");

        // Notify new assignees
        if (newAssignees.length > 0) {
            const project = ProjectRepository.findById(projectId);
            const UserRepository = require('../repositories/user.repository').default;
            
            if (project) {
                for (const userId of newAssignees) {
                    const user = UserRepository.findById(userId);
                    
                    NotificationService.notifyAssignment(
                        userId,
                        task.title,
                        project.name,
                        taskId,
                        projectId
                    );
                    
                    AuditLogService.log(
                        AuditAction.TASK_ASSIGNED,
                        JSON.stringify({
                            task_id: taskId,
                            task_title: task.title,
                            assigned_user_id: userId,
                            assigned_user_name: user?.name || 'Usuário'
                        }),
                        projectId,
                        actorUserId
                    );
                }
            }
        }

        return updatedTask;
    }

    static async updateReviewers(
        taskId: number,
        reviewerIds: number[],
        projectId: number,
        actorUserId: number
    ): Promise<TaskResponseDTO> {
        const task = TaskRepository.findById(taskId);
        if (!task) throw new Error("Task não encontrada");

        // Get current reviewers to compare
        const currentReviewers = task.reviewers?.map(r => r.user_id) || [];
        const newReviewers = reviewerIds.filter(id => !currentReviewers.includes(id));

        // Update reviewers using repository
        ReviewerRepository.setReviewers(taskId, reviewerIds);
        const updatedTask = TaskRepository.findById(taskId);
        if (!updatedTask) throw new Error("Erro ao atualizar task");

        // Notify new reviewers
        if (newReviewers.length > 0) {
            const project = ProjectRepository.findById(projectId);
            const UserRepository = require('../repositories/user.repository').default;
            
            if (project) {
                for (const userId of newReviewers) {
                    const user = UserRepository.findById(userId);
                    
                    NotificationService.create({
                        user_id: userId,
                        type: NotificationType.REVIEWER_ASSIGNED,
                        message: `Você foi designado como revisor da tarefa "${task.title}" no projeto "${project.name}"`,
                        data: { task_id: taskId, project_id: projectId }
                    });
                    
                    AuditLogService.log(
                        AuditAction.TASK_REVIEWER_ASSIGNED,
                        JSON.stringify({
                            task_id: taskId,
                            task_title: task.title,
                            reviewer_user_id: userId,
                            reviewer_user_name: user?.name || 'Usuário'
                        }),
                        projectId,
                        actorUserId
                    );
                }
            }
        }

        return updatedTask;
    }

}
