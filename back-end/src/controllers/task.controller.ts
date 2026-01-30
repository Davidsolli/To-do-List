import { Request, Response } from "express";
import { TaskCreateDTO } from "../interfaces/task";
import { TaskService } from "../services/task.service";
import { ProjectService } from "../services/project.service";
import { TaskStatus } from "../enums/task.enums";
import { AuthRequest } from "../interfaces/auth";

export class TaskController {
  static async createTask(req: Request, res: Response): Promise<void> {
    try {
      const taskData: TaskCreateDTO = req.body;
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }
      
      // Verify project ownership
      const project = await ProjectService.getById(taskData.project_id);
      
      if (project.user_id !== userId) {
         res.status(403).json({ error: "Você não tem permissão para criar tarefas neste projeto" });
         return;
      }

      const newTask = await TaskService.createTask(taskData);

      res.status(201).json({
        message: "Tarefa criada com sucesso",
        task: newTask,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Projeto não encontrado.') {
             res.status(404).json({ error: error.message });
        } else {
             res.status(400).json({ error: error.message });
        }
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

  static async getTasksByProjectId(req: Request, res: Response): Promise<void> {
    try {
      const projectId = Number(req.params.projectId);
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (isNaN(projectId)) {
        res.status(400).json({ error: "ID do projeto inválido" });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      // Verify project ownership
      const project = await ProjectService.getById(projectId);

      if (project.user_id !== userId) {
        res.status(403).json({ error: "Você não tem permissão para acessar as tarefas deste projeto" });
        return;
      }

      const tasks = await TaskService.getTasksByProjectId(projectId);

      res.status(200).json({
        message: "Tarefas do projeto recuperadas com sucesso",
        tasks: tasks,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Projeto não encontrado.') {
          res.status(404).json({ error: error.message });
        } else {
          res.status(400).json({ error: error.message });
        }
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
  static async updateTask(req: Request, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.id);
      const taskData = req.body;

      if (isNaN(taskId)) {
        res.status(400).json({ error: "ID da task inválido" });
        return;
      }

      const updatedTask = await TaskService.updateTask(taskId, taskData);

      res.status(200).json({
        message: "Tarefa atualizada com sucesso",
        task: updatedTask,
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }
  static async updateTaskStatus(req: Request, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.id);
      const { status } = req.body;

      if (isNaN(taskId)) {
        res.status(400).json({ error: "ID da task inválido" });
        return;
      }

      if (!status) {
        res.status(400).json({ error: "Status é obrigatório" });
        return;
      }

      if (!Object.values(TaskStatus).includes(status)) {
        res.status(400).json({
          error: "Status inválido"
        });
        return;
      }

      const updatedTask = await TaskService.updateTaskStatus(taskId, status);

      res.status(200).json({
        message: "Status da task atualizado com sucesso",
        task: updatedTask,
      });

    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }

  static async deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const taskId = Number(req.params.id);

    if (isNaN(taskId)) {
      res.status(400).json({ error: "ID da task inválido" });
      return;
    }

    await TaskService.deleteTask(taskId);

    res.status(200).json({
      message: "Task deletada com sucesso"
    });

  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
}

  static async generateTip(req: Request, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.id);
      const forceRegenerate = req.query.force === "true";
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (isNaN(taskId)) {
        res.status(400).json({ error: "ID da task inválido" });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }

      // Verificar ownership via projeto
      const updatedTask = await TaskService.generateTip(taskId, forceRegenerate);
      const project = ProjectService.getById(updatedTask.project_id);

      if (project.user_id !== userId) {
        res.status(403).json({ error: "Você não tem permissão para gerar dica nesta task" });
        return;
      }

      res.status(200).json({
        message: forceRegenerate ? "Nova dica gerada com sucesso" : "Dica recuperada com sucesso",
        task: updatedTask,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Task não encontrada") {
          res.status(404).json({ error: error.message });
        } else if (error.message.includes("GROQ_API_KEY")) {
          res.status(500).json({ error: "Serviço de IA não configurado" });
        } else {
          res.status(400).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }
}