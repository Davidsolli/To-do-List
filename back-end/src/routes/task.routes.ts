import { Router } from "express";
import { TaskController } from "../controllers/task.controller";

const tasksRoutes = Router();

tasksRoutes.post("/", TaskController.createTask);
tasksRoutes.post("/:id", () => {});

export default tasksRoutes;
