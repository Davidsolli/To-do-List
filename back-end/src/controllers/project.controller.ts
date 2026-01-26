import { Request, Response } from "express";
import { ProjectService } from "../services/project.service";

export class ProjectController {
  
  // POST /projects
  static create(req: Request, res: Response) {
    try {
      const project = ProjectService.create(req.body);
      return res.status(201).json(project);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // GET /projects/:id
  static getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
         return res.status(400).json({ error: "ID inválido" });
      }

      const project = ProjectService.getById(id);
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

      const updatedProject = ProjectService.update(id, req.body);
      return res.status(200).json(updatedProject);
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(400).json({ error: error.message });
    }
  }
}
