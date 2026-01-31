import { Router } from "express";
import { CommentController } from "../controllers/comment.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../enums/userRoles.enums";

const commentRoutes = Router();

// All routes require authentication
commentRoutes.use(authenticate);
commentRoutes.use(authorize([UserRole.ADMIN, UserRole.USER]));

// Task comments
commentRoutes.get("/tasks/:taskId/comments", CommentController.getByTaskId);
commentRoutes.post("/tasks/:taskId/comments", CommentController.create);

// Comment operations
commentRoutes.put("/comments/:id", CommentController.update);
commentRoutes.delete("/comments/:id", CommentController.delete);

export default commentRoutes;
