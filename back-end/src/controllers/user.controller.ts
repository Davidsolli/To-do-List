import { Request, Response } from 'express';
import UserService from "../services/user.service";

export default class UserController {
    async getById(req: Request, res: Response) {
        try {
            const service = new UserService();
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const user = await service.getById(id);
            return res.status(200).json(user);
        } catch (error: any) {
            const status = error.message === 'Usuário não encontrado' ? 404 : 400;
            return res.status(status).json({ error: error.message });
        }
    }

    async getAll(req: Request, res: Response) {
        try {
            const service = new UserService();
            const users = await service.getAll();
            return res.status(200).json(users);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const service = new UserService();
            const id = Number(req.params.id);
            const dadosParaAtualizar = req.body;

            if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

            const updatedUser = await service.update(id, dadosParaAtualizar);
            return res.status(200).json(updatedUser);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
    async delete(req: Request, res: Response) {
        try {
            const service = new UserService();
            const id = Number(req.params.id);

            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }

            await service.delete(id);
            return res.status(200).json({ message: 'Usuário deletado com sucesso' });
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
}
