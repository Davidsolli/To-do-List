import { Request, Response } from "express";
import { UserCreateDto } from "../interfaces/user";
import { UserService } from "../services/auth.service";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: UserCreateDto = req.body;

      if (!userData.name || !userData.email || !userData.password) {
        res.status(400).json({
          error: "Todos os campos são obrigatórios (name, email, password)",
        });
        return;
      }

      const newUser = await UserService.createUser(userData);

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: newUser,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email e senha são obrigatórios" });
        return;
      }

      const { token, user } = await UserService.login(email, password);

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Login realizado com sucesso", user });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout realizado com sucesso" });
  }
}
