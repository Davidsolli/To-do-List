import { CommentRepository, TaskComment } from "../repositories/comment.repository";
import { TaskRepository } from "../repositories/task.repository";
import { NotificationService } from "./notification.service";
import { ProjectRepository } from "../repositories/project.repository";
import { NotificationType } from "../interfaces/collaborative";

export class CommentService {
    static create(taskId: number, userId: number, content: string): TaskComment {
        if (!content || content.trim().length === 0) {
            throw new Error("Conteúdo do comentário não pode estar vazio");
        }

        const task = TaskRepository.findById(taskId);
        if (!task) {
            throw new Error("Task não encontrada");
        }

        const comment = CommentRepository.create(taskId, userId, content.trim());

        // Notify assignees about the new comment
        const assignees = task.assignees || [];
        const project = ProjectRepository.findById(task.project_id);
        
        for (const assignee of assignees) {
            if (assignee.user_id !== userId) {
                NotificationService.create({
                    user_id: assignee.user_id,
                    type: NotificationType.COMMENT,
                    message: `Novo comentário na tarefa "${task.title}" do projeto "${project?.name || 'Projeto'}"`,
                    data: { task_id: taskId, project_id: task.project_id, comment_id: comment.id }
                });
            }
        }

        return comment;
    }

    static getByTaskId(taskId: number): TaskComment[] {
        return CommentRepository.findByTaskId(taskId);
    }

    static update(commentId: number, userId: number, content: string): TaskComment {
        if (!content || content.trim().length === 0) {
            throw new Error("Conteúdo do comentário não pode estar vazio");
        }

        const commentOwner = CommentRepository.getCommentOwner(commentId);
        if (commentOwner !== userId) {
            throw new Error("Você só pode editar seus próprios comentários");
        }

        const updated = CommentRepository.update(commentId, content.trim());
        if (!updated) {
            throw new Error("Comentário não encontrado");
        }

        return updated;
    }

    static delete(commentId: number, userId: number, isAdmin: boolean = false): void {
        const commentOwner = CommentRepository.getCommentOwner(commentId);
        
        if (!isAdmin && commentOwner !== userId) {
            throw new Error("Você só pode excluir seus próprios comentários");
        }

        const deleted = CommentRepository.delete(commentId);
        if (!deleted) {
            throw new Error("Comentário não encontrado");
        }
    }
}
