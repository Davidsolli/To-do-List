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
}
