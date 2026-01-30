import { Request } from "express";
import { UserRole } from "../enums/userRoles.enums";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
}
