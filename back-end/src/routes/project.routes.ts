import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";

const projectRoutes = Router();

projectRoutes.post("/", ProjectController.create);

export default projectRoutes;
