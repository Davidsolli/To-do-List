import { Request, Response } from "express";
import { TaskCreateDto } from "../interfaces/task";
import { TaskService } from "../services/task.service";

export class TaskController {
    static async createTask(req: Request, res: Response): Promise<void> {
        try {
            const taskData: TaskCreateDto = req.body;

            if (!taskData.title || !taskData.project_id) {
                res.status(400).json({
                    error: 'Campos obrigatórios: title e project_id'
                });
                return;
            }

            const newTask = await TaskService.createTask(taskData);

            res.status(201).json({
                message: 'Tarefa criada com sucesso',
                task: newTask
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }

    static async getTasksByUserId(req: Request, res: Response): Promise<void> {
        try {
            const userId = parseInt(req.query.user_id as string);

            if (!userId || isNaN(userId)) {
                res.status(400).json({
                    error: 'Parâmetro user_id é obrigatório e deve ser um número'
                });
                return;
            }

            const tasks = await TaskService.getTasksByUserId(userId);

            res.status(200).json({
                message: 'Tarefas encontradas',
                tasks: tasks
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }

    static async getTaskById(req: Request, res: Response): Promise<void> {
        try {
            const taskId = parseInt(req.params.id as string);
            const userId = parseInt(req.query.user_id as string);

            if (!taskId || isNaN(taskId)) {
                res.status(400).json({
                    error: 'ID da tarefa deve ser um número válido'
                });
                return;
            }

            if (!userId || isNaN(userId)) {
                res.status(400).json({
                    error: 'Parâmetro user_id é obrigatório e deve ser um número'
                });
                return;
            }

            const task = await TaskService.getTaskById(taskId, userId);

            if (!task) {
                res.status(404).json({
                    error: 'Tarefa não encontrada ou não pertence ao usuário'
                });
                return;
            }

            res.status(200).json({
                message: 'Tarefa encontrada',
                task: task
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            } else {
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        }
    }
}