import { Request, Response } from "express";
import { ProjectService } from "../services/project.service";
import { AuthRequest } from "../interfaces/auth";
import { UserRole } from "../enums/userRoles.enums";
import { InviteService } from "../services/invite.service";
import { AuditLogService } from "../services/audit.service";
import { ProjectRole } from "../interfaces/collaborative";
import { MemberRepository } from "../repositories/member.repository";

export class ProjectController {
  
  // POST /projects
  static create(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const projectData = {
        ...req.body,
        user_id: userId
      };

      const project = ProjectService.create(projectData);
      return res.status(201).json(project);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  //GET /projects/users/:userId
  static getByUserId(req: Request, res: Response) {
    try {
        const userId = Number(req.params.userId);
        if (isNaN(userId)) {
             return res.status(400).json({ error: "ID de usuário inválido" });
        }
        
        const projects = ProjectService.getByUserId(userId);
        return res.status(200).json(projects);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
  }

  // GET /projects/:id
  static getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: "ID inválido" });
      }

      const authReq = req as AuthRequest;
      const loggedUser = authReq.user;

      if (!loggedUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const project = ProjectService.getById(id);

      // Admin (system), Owner, or Project Member can access
      const isSystemAdmin = loggedUser.role === UserRole.ADMIN;
      const isOwner = project.user_id === loggedUser.id;
      const isMember = MemberRepository.isMember(id, loggedUser.id);

      if (!isSystemAdmin && !isOwner && !isMember) {
          return res.status(403).json({ error: "Você não tem permissão para acessar este projeto." });
      }

      return res.status(200).json(project);
    } catch (error: any) {
      if (error.message === 'Projeto não encontrado.') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT /projects/:id
  static update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: "ID inválido" });
      }

      const authReq = req as AuthRequest;
      const loggedUser = authReq.user;

      if (!loggedUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      // We need to fetch the project first to check ownership
      const existingProject = ProjectService.getById(id);

      // System admin, owner, or project admin can update
      const isSystemAdmin = loggedUser.role === UserRole.ADMIN;
      const isOwner = existingProject.user_id === loggedUser.id;
      const memberRole = MemberRepository.getMemberRole(id, loggedUser.id);
      const isProjectAdmin = memberRole === ProjectRole.ADMIN || memberRole === ProjectRole.OWNER;

      if (!isSystemAdmin && !isOwner && !isProjectAdmin) {
          return res.status(403).json({ error: "Você não tem permissão para atualizar este projeto." });
      }

      const updatedProject = ProjectService.update(id, req.body);
      return res.status(200).json(updatedProject);
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  // DELETE /projects/:id
  static delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: "ID inválido" });
      }

      const authReq = req as AuthRequest;
      const loggedUser = authReq.user;

      if (!loggedUser) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const existingProject = ProjectService.getById(id);

      if (loggedUser.role !== UserRole.ADMIN && existingProject.user_id !== loggedUser.id) {
          return res.status(403).json({ error: "Você não tem permissão para deletar este projeto." });
      }

      ProjectService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /projects/:id/invite
  static async invite(req: Request, res: Response) {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      if (!userId) return res.status(401).json({ error: "Não autenticado" });

      const projectId = Number(req.params.id);
      const { email } = req.body;

      if (!email) return res.status(400).json({ error: "Email é obrigatório" });

      const invite = await InviteService.inviteUser(projectId, userId, email);
      return res.status(200).json({ message: "Convite enviado com sucesso", invite });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET /projects/:id/invites
  static getInvites(req: Request, res: Response) {
    try {
      const projectId = Number(req.params.id);
      const invites = InviteService.getProjectInvites(projectId);
      return res.json(invites);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET /projects/:id/members
  static getMembers(req: Request, res: Response) {
    try {
      const projectId = Number(req.params.id);
      const members = ProjectService.getMembers(projectId);
      
      // Also include project owner
      const project = ProjectService.getById(projectId);
      
      return res.json({ members, ownerId: project.user_id });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // DELETE /projects/:id/members/:memberId
  static removeMember(req: Request, res: Response) {
    try {
      const projectId = Number(req.params.id);
      const memberId = Number(req.params.memberId);

      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      if (!userId) return res.status(401).json({ error: "Não autenticado" });

      const project = ProjectService.getById(projectId);

      // Cannot remove owner
      if (memberId === project.user_id) {
        return res.status(400).json({ error: "Não é possível remover o dono do projeto" });
      }

      // Admin cannot remove themselves
      const projectRole = (req as any).projectRole;
      if (projectRole === ProjectRole.ADMIN && memberId === userId) {
        return res.status(400).json({ error: "Admin não pode se remover do projeto" });
      }

      // Check for tasks assigned to this member
      const taskCount = ProjectService.getMemberTaskCount(projectId, memberId);
      
      ProjectService.removeMember(projectId, memberId, userId);
      
      return res.json({ 
        message: "Membro removido com sucesso",
        tasksAffected: taskCount 
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // PATCH /projects/:id/members/:memberId
  static updateMemberRole(req: Request, res: Response) {
    try {
      const projectId = Number(req.params.id);
      const memberId = Number(req.params.memberId);
      const { role } = req.body;

      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      if (!userId) return res.status(401).json({ error: "Não autenticado" });

      const project = ProjectService.getById(projectId);

      // Cannot change owner's role
      if (memberId === project.user_id) {
        return res.status(400).json({ error: "Não é possível alterar o papel do dono" });
      }

      if (!Object.values(ProjectRole).includes(role) || role === ProjectRole.OWNER) {
        return res.status(400).json({ error: "Papel inválido" });
      }

      ProjectService.updateMemberRole(projectId, memberId, role, userId);
      return res.json({ message: "Papel atualizado" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // POST /projects/:id/transfer
  static transferOwnership(req: Request, res: Response) {
    try {
      const projectId = Number(req.params.id);
      const { newOwnerId } = req.body;

      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;
      if (!userId) return res.status(401).json({ error: "Não autenticado" });

      ProjectService.transferOwnership(projectId, newOwnerId, userId);
      return res.status(200).json({ message: "Propriedade transferida" });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET /projects/:id/audit
  static getAuditLogs(req: Request, res: Response) {
    try {
      const projectId = Number(req.params.id);
      const page = parseInt(req.query.page as string) || 1;

      const result = AuditLogService.getByProjectId(projectId, page);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
