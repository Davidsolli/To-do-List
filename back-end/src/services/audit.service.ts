import { AuditLogRepository } from "../repositories/audit.repository";
import { AuditAction, AuditLog } from "../interfaces/collaborative";

export class AuditLogService {

    static log(action: AuditAction | string, details?: string, projectId?: number, userId?: number): void {
        AuditLogRepository.create({
            action: action as AuditAction,
            details,
            project_id: projectId,
            user_id: userId
        });
    }

    static getByProjectId(projectId: number, page: number = 1, limit: number = 50): { logs: AuditLog[], total: number } {
        const offset = (page - 1) * limit;
        const logs = AuditLogRepository.findByProjectId(projectId, limit, offset);
        const total = AuditLogRepository.getCountByProjectId(projectId);
        return { logs, total };
    }

    static getByUserId(userId: number, page: number = 1, limit: number = 50): AuditLog[] {
        const offset = (page - 1) * limit;
        return AuditLogRepository.findByUserId(userId, limit, offset);
    }
}
