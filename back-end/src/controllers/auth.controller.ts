import { Request, Response } from "express";
import { UserCreateDto } from "../interfaces/user";
import { UserService } from "../services/auth.service";

export class AuthController {
    static async register(req: Request, res: Response): Promise<void> {
        try {
            const userData: UserCreateDto = req.body;

            if (!userData.name || !userData.email ||
                !userData.password) {
                res.status(400).json({
                    error: 'Todos os campos são obrigatórios (name, email, password)'
                });
                return;
            }

            const newUser = await UserService.createUser(userData);

            res.status(201).json({
                message: 'Usuário criado com sucesso',
                user: newUser
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }
}