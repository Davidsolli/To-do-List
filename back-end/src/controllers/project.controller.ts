import { Request, Response } from "express";
import { ProjectService } from "../services/project.service";
import { AuthRequest } from "../interfaces/auth";
import { UserRole } from "../enums/userRoles.enums";

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

      // Admin access or Owner access
      if (loggedUser.role !== UserRole.ADMIN && project.user_id !== loggedUser.id) {
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

      if (loggedUser.role !== UserRole.ADMIN && existingProject.user_id !== loggedUser.id) {
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
}
