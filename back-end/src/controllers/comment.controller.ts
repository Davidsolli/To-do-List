import { Request, Response } from "express";
import { CommentService } from "../services/comment.service";
import { AuthRequest } from "../interfaces/auth";
import { getUserProjectRole } from "../middleware/project.middleware";
import { TaskService } from "../services/task.service";
import { ProjectRole } from "../interfaces/collaborative";
import { UserRole } from "../enums/userRoles.enums";

export class CommentController {
    // POST /tasks/:taskId/comments
    static async create(req: Request, res: Response): Promise<void> {
        try {
            const taskId = Number(req.params.taskId);
            const { content } = req.body;
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;

            if (!userId) {
                res.status(401).json({ error: "Usuário não autenticado" });
                return;
            }

            if (isNaN(taskId)) {
                res.status(400).json({ error: "ID da task inválido" });
                return;
            }

            // Check if user has access to the task's project
            const task = await TaskService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({ error: "Task não encontrada" });
                return;
            }

            const projectRole = getUserProjectRole(task.project_id, userId);
            if (authReq.user?.role !== UserRole.ADMIN && !projectRole) {
                res.status(403).json({ error: "Você não tem acesso a esta task" });
                return;
            }

            const comment = CommentService.create(taskId, userId, content);
            res.status(201).json({ message: "Comentário criado", comment });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Erro interno do servidor" });
            }
        }
    }

    // GET /tasks/:taskId/comments
    static async getByTaskId(req: Request, res: Response): Promise<void> {
        try {
            const taskId = Number(req.params.taskId);
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;

            if (!userId) {
                res.status(401).json({ error: "Usuário não autenticado" });
                return;
            }

            if (isNaN(taskId)) {
                res.status(400).json({ error: "ID da task inválido" });
                return;
            }

            // Check if user has access to the task's project
            const task = await TaskService.getTaskById(taskId);
            if (!task) {
                res.status(404).json({ error: "Task não encontrada" });
                return;
            }

            const projectRole = getUserProjectRole(task.project_id, userId);
            if (authReq.user?.role !== UserRole.ADMIN && !projectRole) {
                res.status(403).json({ error: "Você não tem acesso a esta task" });
                return;
            }

            const comments = CommentService.getByTaskId(taskId);
            res.status(200).json({ comments });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Erro interno do servidor" });
            }
        }
    }

    // PUT /comments/:id
    static async update(req: Request, res: Response): Promise<void> {
        try {
            const commentId = Number(req.params.id);
            const { content } = req.body;
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;

            if (!userId) {
                res.status(401).json({ error: "Usuário não autenticado" });
                return;
            }

            if (isNaN(commentId)) {
                res.status(400).json({ error: "ID do comentário inválido" });
                return;
            }

            const comment = CommentService.update(commentId, userId, content);
            res.status(200).json({ message: "Comentário atualizado", comment });
        } catch (error) {
            if (error instanceof Error) {
                const status = error.message.includes("seus próprios") ? 403 : 400;
                res.status(status).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Erro interno do servidor" });
            }
        }
    }

    // DELETE /comments/:id
    static async delete(req: Request, res: Response): Promise<void> {
        try {
            const commentId = Number(req.params.id);
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            const isAdmin = authReq.user?.role === UserRole.ADMIN;

            if (!userId) {
                res.status(401).json({ error: "Usuário não autenticado" });
                return;
            }

            if (isNaN(commentId)) {
                res.status(400).json({ error: "ID do comentário inválido" });
                return;
            }

            CommentService.delete(commentId, userId, isAdmin);
            res.status(200).json({ message: "Comentário excluído" });
        } catch (error) {
            if (error instanceof Error) {
                const status = error.message.includes("seus próprios") ? 403 : 400;
                res.status(status).json({ error: error.message });
            } else {
                res.status(500).json({ error: "Erro interno do servidor" });
            }
        }
    }
}
