import { Router } from "express";
import UserController from "../controllers/user.controller";
import {
  authenticate,
  authorize,
  checkOwnership,
} from "../middleware/auth.middleware";
import { UserRole } from "../enums/userRoles.enums";

const userRoutes = Router();
const userController = new UserController();

userRoutes.get(
  "/",
  authenticate,
  authorize([UserRole.ADMIN]),
  userController.getAll,
);

userRoutes.get(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  userController.getById,
);

userRoutes.put(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  checkOwnership,
  userController.update,
);

userRoutes.delete(
  "/:id",
  authenticate,
  authorize([UserRole.ADMIN, UserRole.USER]),
  userController.delete,
);

export default userRoutes;
