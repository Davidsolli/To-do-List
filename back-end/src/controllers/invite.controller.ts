import { Request, Response } from "express";
import { AuthRequest } from "../interfaces/auth";
import { InviteService } from "../services/invite.service";

export class InviteController {

    // GET /invites - Get pending invites for current user
    static getPendingInvites(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const user = authReq.user;
            if (!user) return res.status(401).json({ error: "Não autenticado" });

            const invites = InviteService.getPendingInvitesByEmail(user.email);
            return res.json(invites);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // GET /invites/:id - Get invite details
    static getById(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

            const invite = InviteService.getById(id);
            if (!invite) return res.status(404).json({ error: "Convite não encontrado" });

            return res.json(invite);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    // POST /invites/:id/accept
    static acceptInvite(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            const id = Number(req.params.id);
            if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

            InviteService.acceptInvite(id, userId);
            return res.json({ message: "Convite aceito com sucesso" });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    // POST /invites/:id/decline
    static declineInvite(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            const id = Number(req.params.id);
            if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

            InviteService.declineInvite(id, userId);
            return res.json({ message: "Convite recusado" });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    // DELETE /invites/:id - Cancel invite (by admin/owner)
    static cancelInvite(req: Request, res: Response) {
        try {
            const authReq = req as AuthRequest;
            const userId = authReq.user?.id;
            if (!userId) return res.status(401).json({ error: "Não autenticado" });

            const id = Number(req.params.id);
            if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

            InviteService.cancelInvite(id, userId);
            return res.json({ message: "Convite cancelado" });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
