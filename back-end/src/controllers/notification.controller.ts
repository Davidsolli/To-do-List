import { Request, Response } from "express";
import { AuthRequest } from "../interfaces/auth";
import { NotificationService } from "../services/notification.service";

export class NotificationController {

    // GET /notifications
    static getAll(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;

            const result = NotificationService.getByUserId(userId, page, limit);
            return res.json(result);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // GET /notifications/unread
    static getUnread(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            const notifications = NotificationService.getUnread(userId);
            const count = NotificationService.getUnreadCount(userId);
            return res.json({ notifications, count });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // GET /notifications/count
    static getUnreadCount(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            const count = NotificationService.getUnreadCount(userId);
            return res.json({ count });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // PATCH /notifications/:id/read
    static markAsRead(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            const id = Number(req.params.id);
            if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

            NotificationService.markAsRead(id, userId);
            return res.json({ message: "Notificação marcada como lida" });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    // PATCH /notifications/read-all
    static markAllAsRead(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            NotificationService.markAllAsRead(userId);
            return res.json({ message: "Todas notificações marcadas como lidas" });
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // DELETE /notifications/:id
    static delete(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            const id = Number(req.params.id);
            if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

            NotificationService.delete(id, userId);
            return res.json({ message: "Notificação deletada" });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
