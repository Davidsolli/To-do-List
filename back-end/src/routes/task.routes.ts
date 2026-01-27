import { Router } from "express";
import { TaskController } from "../controllers/task.controller";

const tasksRoutes = Router();

tasksRoutes.post("/", TaskController.createTask);
tasksRoutes.get("/", TaskController.getTasksByUserId);
tasksRoutes.get("/:id", TaskController.getTaskById);
tasksRoutes.post("/:id", () => {});

export default tasksRoutes;
