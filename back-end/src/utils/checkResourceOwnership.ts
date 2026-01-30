import { AuthRequest } from "../interfaces/auth";
import { UserRole } from "../enums/userRoles.enums";

export function checkResourceOwnership(
  req: AuthRequest,
  resourceUserId: number,
  resourceName: string = "recurso",
): { authorized: boolean; error?: string } {
  if (req.user?.role === UserRole.ADMIN) {
    return { authorized: true };
  }

  if (resourceUserId !== req.user?.id) {
    return {
      authorized: false,
      error: `Você não tem permissão para acessar este ${resourceName}`,
    };
  }

  return { authorized: true };
}
