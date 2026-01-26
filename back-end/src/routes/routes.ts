import { Router } from "express";
import authRoutes from "./auth.routes";
import tasksRoutes from "./task.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", ()=>{});
router.use("/projects", ()=>{});
router.use("/tasks", tasksRoutes);


export default router;