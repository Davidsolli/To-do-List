import { Request, Response } from "express";
import { TaskCreateDTO } from "../interfaces/task";
import { TaskService } from "../services/task.service";
import { ProjectService } from "../services/project.service";
import { TaskStatus } from "../enums/task.enums";
import { AuthRequest } from "../interfaces/auth";
import { getUserProjectRole } from "../middleware/project.middleware";
import { ProjectRole } from "../interfaces/collaborative";
import { UserRole } from "../enums/userRoles.enums";

export class TaskController {
  static async createTask(req: Request, res: Response): Promise<void> {
    try {
      // Extract assignees from body before typing
      const { assignees, ...taskFields } = req.body;
      const taskData: TaskCreateDTO = taskFields;
      const assigneeIds: number[] | undefined = assignees;
      
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuário não autenticado" });
        return;
      }
      
      // Check project access and role
      const projectRole = getUserProjectRole(taskData.project_id, userId);
      
      // Only owner and admin can create tasks
      if (authReq.user?.role !== UserRole.ADMIN && 
          projectRole !== ProjectRole.OWNER && 
          projectRole !== ProjectRole.ADMIN) {
        res.status(403).json({ error: "Apenas owner ou admin podem criar tarefas" });
        return;
      }

      const newTask = await TaskService.createTask(taskData, assigneeIds);

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

      // Check project access
      const projectRole = getUserProjectRole(projectId, userId);
      
      if (authReq.user?.role !== UserRole.ADMIN && !projectRole) {
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
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

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

      // Get task to check project
      const task = await TaskService.getTaskById(taskId);
      if (!task) {
        res.status(404).json({ error: "Task não encontrada" });
        return;
      }

      // Check permission for restricted statuses
      const restrictedStatuses = [TaskStatus.UNDER_REVIEW, TaskStatus.COMPLETED];
      if (restrictedStatuses.includes(status)) {
        const projectRole = getUserProjectRole(task.project_id, userId!);
        
        if (authReq.user?.role !== UserRole.ADMIN &&
            projectRole !== ProjectRole.OWNER && 
            projectRole !== ProjectRole.ADMIN) {
          res.status(403).json({ 
            error: "Apenas owner ou admin podem mover para 'em revisão' ou 'concluído'" 
          });
          return;
        }
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
      const projectRole = getUserProjectRole(updatedTask.project_id, userId!);

      // System admin or project owner/admin can generate tips
      if (authReq.user?.role !== UserRole.ADMIN && 
          project.user_id !== userId &&
          projectRole !== ProjectRole.OWNER &&
          projectRole !== ProjectRole.ADMIN) {
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

  // GET /tasks/:id
  static async getTaskById(req: Request, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.id);
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (isNaN(taskId)) {
        res.status(400).json({ error: "ID da task inválido" });
        return;
      }

      const task = await TaskService.getTaskById(taskId);
      
      if (!task) {
        res.status(404).json({ error: "Task não encontrada" });
        return;
      }

      // Check project access
      const projectRole = getUserProjectRole(task.project_id, userId!);
      if (authReq.user?.role !== UserRole.ADMIN && !projectRole) {
        res.status(403).json({ error: "Sem permissão para ver esta task" });
        return;
      }

      res.status(200).json({ task });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }

  // PATCH /tasks/:id/assignees
  static async updateAssignees(req: Request, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.id);
      const { assignees } = req.body; // array of user IDs
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (isNaN(taskId)) {
        res.status(400).json({ error: "ID da task inválido" });
        return;
      }

      if (!Array.isArray(assignees)) {
        res.status(400).json({ error: "assignees deve ser um array de IDs" });
        return;
      }

      // Get task to check project permission
      const task = await TaskService.getTaskById(taskId);
      if (!task) {
        res.status(404).json({ error: "Task não encontrada" });
        return;
      }

      // Only owner/admin can assign
      const projectRole = getUserProjectRole(task.project_id, userId!);
      if (authReq.user?.role !== UserRole.ADMIN &&
          projectRole !== ProjectRole.OWNER && 
          projectRole !== ProjectRole.ADMIN) {
        res.status(403).json({ error: "Apenas owner ou admin podem atribuir responsáveis" });
        return;
      }

      const updatedTask = await TaskService.updateAssignees(taskId, assignees, task.project_id);

      res.status(200).json({
        message: "Responsáveis atualizados",
        task: updatedTask
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }

  // PATCH /tasks/:id/reviewers
  static async updateReviewers(req: Request, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.id);
      const { reviewers } = req.body; // array of user IDs
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (isNaN(taskId)) {
        res.status(400).json({ error: "ID da task inválido" });
        return;
      }

      if (!Array.isArray(reviewers)) {
        res.status(400).json({ error: "reviewers deve ser um array de IDs" });
        return;
      }

      // Get task to check project permission
      const task = await TaskService.getTaskById(taskId);
      if (!task) {
        res.status(404).json({ error: "Task não encontrada" });
        return;
      }

      // Only owner/admin can assign reviewers
      const projectRole = getUserProjectRole(task.project_id, userId!);
      if (authReq.user?.role !== UserRole.ADMIN &&
          projectRole !== ProjectRole.OWNER && 
          projectRole !== ProjectRole.ADMIN) {
        res.status(403).json({ error: "Apenas owner ou admin podem atribuir revisores" });
        return;
      }

      const updatedTask = await TaskService.updateReviewers(taskId, reviewers, task.project_id);

      res.status(200).json({
        message: "Revisores atualizados",
        task: updatedTask
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro interno do servidor" });
      }
    }
  }

  // GET /tasks/:id/permissions - Get user permissions for a task
  static async getPermissions(req: Request, res: Response): Promise<void> {
    try {
      const taskId = Number(req.params.id);
      const authReq = req as AuthRequest;
      const userId = authReq.user?.id;

      if (isNaN(taskId)) {
        res.status(400).json({ error: "ID da task inválido" });
        return;
      }

      const task = await TaskService.getTaskById(taskId);
      if (!task) {
        res.status(404).json({ error: "Task não encontrada" });
        return;
      }

      const projectRole = getUserProjectRole(task.project_id, userId!);
      const isSystemAdmin = authReq.user?.role === UserRole.ADMIN;
      const isOwnerOrAdmin = projectRole === ProjectRole.OWNER || projectRole === ProjectRole.ADMIN;
      const isAssignee = task.assignees?.some(a => a.user_id === userId) || false;
      const isReviewer = task.reviewers?.some(r => r.user_id === userId) || false;

      res.status(200).json({
        canEdit: isSystemAdmin || isOwnerOrAdmin,
        canDelete: isSystemAdmin || isOwnerOrAdmin,
        canChangeStatus: isSystemAdmin || isOwnerOrAdmin || isAssignee,
        canMoveToReview: isSystemAdmin || isOwnerOrAdmin || isAssignee,
        canMoveToCompleted: isSystemAdmin || isOwnerOrAdmin || isReviewer,
        canAssign: isSystemAdmin || isOwnerOrAdmin,
        canComment: isSystemAdmin || !!projectRole,
        isAssignee,
        isReviewer,
        projectRole
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