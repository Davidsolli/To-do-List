import { Router } from "express";
import { TaskController } from "../controllers/task.controller";

const tasksRoutes = Router();

tasksRoutes.post("/", TaskController.createTask);
tasksRoutes.get("/user/:userId/search", TaskController.searchTasks);
tasksRoutes.get("/user/:userId", TaskController.getTasksByUserId);
tasksRoutes.post("/:id", () => {});

export default tasksRoutes;
