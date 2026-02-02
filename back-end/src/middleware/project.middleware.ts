import { NextFunction, Response } from "express";
import { AuthRequest } from "../interfaces/auth";
import { MemberRepository } from "../repositories/member.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { ProjectRole } from "../interfaces/collaborative";
import { UserRole } from "../enums/userRoles.enums";

/**
 * Middleware to check if user has access to a project (owner or member)
 */
export function checkProjectAccess(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.id;
        const projectId = Number(req.params.id || req.params.projectId);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        if (isNaN(projectId)) {
            return res.status(400).json({ error: "ID do projeto inválido" });
        }

        // System admin has full access
        if (req.user?.role === UserRole.ADMIN) {
            return next();
        }

        const project = ProjectRepository.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: "Projeto não encontrado" });
        }

        // Check if owner
        if (project.user_id === userId) {
            (req as any).projectRole = ProjectRole.OWNER;
            return next();
        }

        // Check if member
        const memberRole = MemberRepository.getMemberRole(projectId, userId);
        if (memberRole) {
            (req as any).projectRole = memberRole;
            return next();
        }

        return res.status(403).json({ error: "Você não tem acesso a este projeto" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Middleware to check if user is owner or admin of a project
 */
export function checkProjectAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.id;
        const projectId = Number(req.params.id || req.params.projectId);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        if (isNaN(projectId)) {
            return res.status(400).json({ error: "ID do projeto inválido" });
        }

        // System admin has full access
        if (req.user?.role === UserRole.ADMIN) {
            return next();
        }

        const project = ProjectRepository.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: "Projeto não encontrado" });
        }

        // Check if owner
        if (project.user_id === userId) {
            (req as any).projectRole = ProjectRole.OWNER;
            return next();
        }

        // Check if admin member
        const memberRole = MemberRepository.getMemberRole(projectId, userId);
        if (memberRole === ProjectRole.ADMIN) {
            (req as any).projectRole = memberRole;
            return next();
        }

        return res.status(403).json({ error: "Apenas owner ou admin podem realizar esta ação" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Middleware to check if user is the owner of a project
 */
export function checkProjectOwner(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.id;
        const projectId = Number(req.params.id || req.params.projectId);

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        if (isNaN(projectId)) {
            return res.status(400).json({ error: "ID do projeto inválido" });
        }

        // System admin has full access
        if (req.user?.role === UserRole.ADMIN) {
            return next();
        }

        const project = ProjectRepository.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: "Projeto não encontrado" });
        }

        if (project.user_id !== userId) {
            return res.status(403).json({ error: "Apenas o dono do projeto pode realizar esta ação" });
        }

        (req as any).projectRole = ProjectRole.OWNER;
        next();
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Middleware to check if user can modify a task's status based on their role
 * - Assignees can move up to 'ready'
 * - Only owner/admin can move to 'in_review' and 'done'
 */
export function checkTaskStatusPermission(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const userId = req.user?.id;
        const { status } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Usuário não autenticado" });
        }

        // System admin bypass
        if (req.user?.role === UserRole.ADMIN) {
            return next();
        }

        // If status is not being changed to in_review or completed, allow
        const restrictedStatuses = ['in_review', 'under_review', 'done', 'completed'];
        if (!status || !restrictedStatuses.includes(status)) {
            return next();
        }

        // For restricted statuses, check project role
        // The projectRole should be set by checkProjectAccess middleware
        const projectRole = (req as any).projectRole;

        if (projectRole === ProjectRole.OWNER || projectRole === ProjectRole.ADMIN) {
            return next();
        }

        return res.status(403).json({ 
            error: "Apenas owner ou admin podem mover tarefas para 'em revisão' ou 'concluído'" 
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

/**
 * Helper function to get user's role in a project
 * Note: This returns the project-specific role, not system role.
 * For system admins, controllers should check authReq.user?.role separately.
 */
export function getUserProjectRole(projectId: number, userId: number): ProjectRole | null {
    const project = ProjectRepository.findById(projectId);
    if (!project) return null;

    if (project.user_id === userId) return ProjectRole.OWNER;

    return MemberRepository.getMemberRole(projectId, userId);
}
