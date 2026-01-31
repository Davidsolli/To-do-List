import { ApiService } from './ApiService';

export interface TaskComment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: string;
    updated_at: string;
    user_name?: string;
    user_email?: string;
}

export interface TaskPermissions {
    canEdit: boolean;
    canDelete: boolean;
    canChangeStatus: boolean;
    canMoveToReview: boolean;
    canMoveToCompleted: boolean;
    canAssign: boolean;
    canComment: boolean;
    isAssignee: boolean;
    isReviewer: boolean;
    projectRole: string | null;
}

export class CommentService {
    static async getByTaskId(taskId: number): Promise<TaskComment[]> {
        const response = await ApiService.get<{ comments: TaskComment[] }>(`tasks/${taskId}/comments`);
        return response.comments;
    }

    static async create(taskId: number, content: string): Promise<TaskComment> {
        const response = await ApiService.post<{ comment: TaskComment }>(`tasks/${taskId}/comments`, { content });
        return response.comment;
    }

    static async update(commentId: number, content: string): Promise<TaskComment> {
        const response = await ApiService.put<{ comment: TaskComment }>(`comments/${commentId}`, { content });
        return response.comment;
    }

    static async delete(commentId: number): Promise<void> {
        await ApiService.delete(`comments/${commentId}`);
    }
}

export class TaskPermissionService {
    static async getPermissions(taskId: number): Promise<TaskPermissions> {
        return await ApiService.get<TaskPermissions>(`tasks/${taskId}/permissions`);
    }
}
