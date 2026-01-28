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

  static async getTasksByUserId(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);

      if (isNaN(userId)) {
        res.status(400).json({ error: "ID do usuário inválido" });
        return;
      }

      const tasks = await TaskService.getTasksByUserId(userId);

      res.status(200).json({
        message: "Tarefas recuperadas com sucesso",
        tasks: tasks,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }

  static async searchTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.userId);
      const keyword = req.query.q as string;

      if (isNaN(userId)) {
        res.status(400).json({ error: "ID do usuário inválido" });
        return;
      }

      if (!keyword) {
        res.status(400).json({ error: "Parâmetro de busca 'q' é obrigatório" });
        return;
      }

      const tasks = await TaskService.searchTasksByUserIdAndKeyword(userId, keyword);

      res.status(200).json({
        message: "Busca realizada com sucesso",
        tasks: tasks,
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
