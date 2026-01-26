import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";

const projectRoutes = Router();

projectRoutes.post("/", ProjectController.create);
projectRoutes.get("/:id", ProjectController.getById);
projectRoutes.put("/:id", ProjectController.update);

export default projectRoutes;
