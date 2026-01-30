import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import {
  authenticate,
  authorize,
  checkOwnership,
} from "../middleware/auth.middleware";
import { UserRole } from "../enums/userRoles.enums";

const projectRoutes = Router();

projectRoutes.post(
  "/",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  ProjectController.create,
);

projectRoutes.get(
  "/user/:userId",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkOwnership,
  ProjectController.getByUserId,
);

projectRoutes.get(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  ProjectController.getById,
);

projectRoutes.put(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  ProjectController.update,
);

projectRoutes.delete(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  ProjectController.delete,
);

export default projectRoutes;
