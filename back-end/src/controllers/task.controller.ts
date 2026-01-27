import { Request, Response } from "express";
import { TaskCreateDTO } from "../interfaces/task";
import { TaskService } from "../services/task.service";

export class TaskController {
  static async createTask(req: Request, res: Response): Promise<void> {
    try {
      const taskData: TaskCreateDTO = req.body;
      const newTask = await TaskService.createTask(taskData);

      res.status(201).json({
        message: "Tarefa criada com sucesso",
        task: newTask,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }
}
