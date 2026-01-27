import { Router } from "express";
import { TaskController } from "../controllers/task.controller";

const tasksRoutes = Router();

tasksRoutes.post("/", TaskController.createTask);
tasksRoutes.get("/", TaskController.getTasksByUserId);
tasksRoutes.post("/:id", () => {});

export default tasksRoutes;
