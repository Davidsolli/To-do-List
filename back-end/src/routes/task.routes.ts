import { Router } from "express";
import { TaskController } from "../controllers/task.controller";

const tasksRoutes = Router();

tasksRoutes.post("/", TaskController.createTask);
tasksRoutes.get("/user/:userId/search", TaskController.searchTasks);
tasksRoutes.get("/user/:userId", TaskController.getTasksByUserId);
tasksRoutes.put("/:id", TaskController.updateTask);
tasksRoutes.patch("/:id/status", TaskController.updateTaskStatus);
tasksRoutes.delete("/:id", TaskController.deleteTask);

export default tasksRoutes;
