import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", ()=>{});
router.use("/projects", ()=>{});
router.use("/tasks", ()=>{});

export default router;