import { Router } from "express";

const router = Router();

router.use("/auth", ()=>{});
router.use("/users", ()=>{});
router.use("/projects", ()=>{});
router.use("/tasks", ()=>{});

export default router;