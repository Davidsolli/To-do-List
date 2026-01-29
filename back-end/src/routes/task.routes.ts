import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import {
  authenticate,
  authorize,
  checkOwnership,
} from "../middleware/auth.middleware";
import { UserRole } from "../enums/userRoles.enums";

const tasksRoutes = Router();

tasksRoutes.post(
  "/",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  TaskController.createTask,
);

tasksRoutes.get(
  "/user/:userId/search",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkOwnership,
  TaskController.searchTasks,
);

tasksRoutes.get(
  "/user/:userId",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkOwnership,
  TaskController.getTasksByUserId,
);

tasksRoutes.get(
  "/project/:projectId",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  TaskController.getTasksByProjectId,
);

tasksRoutes.put(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  TaskController.updateTask,
);

tasksRoutes.patch(
  "/:id/status",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  TaskController.updateTaskStatus,
);

tasksRoutes.delete(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  TaskController.deleteTask,
);

export default tasksRoutes;
