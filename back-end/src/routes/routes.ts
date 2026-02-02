import { Router } from "express";
import authRoutes from "./auth.routes";
import tasksRoutes from "./task.routes";
import  userRoutes  from "./user.routes";
import projectRoutes from "./project.routes";
import notificationRoutes from "./notification.routes";
import inviteRoutes from "./invite.routes";
import commentRoutes from "./comment.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", tasksRoutes);
router.use("/notifications", notificationRoutes);
router.use("/invites", inviteRoutes);
router.use("/", commentRoutes); // Comments use /tasks/:taskId/comments and /comments/:id

export default router;