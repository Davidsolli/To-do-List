import { Router } from 'express';
import  UserController  from "../controllers/user.controller";

const userRoutes = Router();
const userController = new UserController();

userRoutes.get('/', userController.getAll);
userRoutes.get('/:id', userController.getById);


export default userRoutes;