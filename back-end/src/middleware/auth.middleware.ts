import { NextFunction, Response } from "express";
import { AuthRequest } from "../interfaces/auth";
import jwt from "jsonwebtoken";
import { UserRole } from "../enums/userRoles.enums";

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_seguranca";

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Sessão inválida ou expirada" });
  }
}

export function authorize(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    next();
  };
}

export function checkOwnership(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const requestedId = Number(req.params.id || req.params.userId);
  const loggedUserId = req.user?.id;

  if (!loggedUserId) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  if ( req.user?.role === UserRole.ADMIN) {
    return next();
  }

  if (loggedUserId !== requestedId) {
    return res
      .status(403)
      .json({
        error: "Você não tem permissão para acessar dados de outro usuário",
      });
  }

  next();
}
