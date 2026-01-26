import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const authRoutes = Router();

authRoutes.post("/register", AuthController.register);

authRoutes.post("/login", () => {});

export default authRoutes;