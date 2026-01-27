import { Router } from "express";
import authRoutes from "./auth.routes";
import  userRoutes  from "./user.routes";
import projectRoutes from "./project.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", ()=>{});


export default router;