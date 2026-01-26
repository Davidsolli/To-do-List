import { Router } from "express";
import authRoutes from "./auth.routes";
import { TaskController } from "../controllers/task.controller";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", ()=>{});
router.use("/projects", ()=>{});
router.use("/tasks", ()=>{});

router.post("/tasks", TaskController.createTask);

router.post("/tasks/:id/assign", ()=>{});


export default router;