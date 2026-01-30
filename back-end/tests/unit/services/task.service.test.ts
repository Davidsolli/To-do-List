import { TaskService } from "../../../src/services/task.service";
import { TaskRepository } from "../../../src/repositories/task.repository";
import { AIService } from "../../../src/services/ai.service";
import { TaskValidation } from "../../../src/validations/task.validation";
import { Task } from "../../../src/interfaces/task";
import { TaskPriority, TaskStatus } from "../../../src/enums/task.enums";

// Mocks
jest.mock("../../../src/repositories/task.repository");
jest.mock("../../../src/services/ai.service");
jest.mock("../../../src/validations/task.validation");

describe("TaskService - Testes Unitários", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateTip", () => {
    const mockTask: Task = {
      id: 1,
      title: "Estudar TypeScript",
      description: "Aprender tipos avançados",
      tip: undefined,
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      estimate: undefined,
      project_id: 1,
    };

    it("deve retornar task existente se já tem dica e não forçar regeneração", async () => {
      const taskComDica = { ...mockTask, tip: "Dica existente" };
      (TaskRepository.findById as jest.Mock).mockReturnValue(taskComDica);

      const result = await TaskService.generateTip(1, false);

      expect(result).toEqual(taskComDica);
      expect(AIService.generateTaskTip).not.toHaveBeenCalled();
      expect(TaskRepository.update).not.toHaveBeenCalled();
    });

    it("deve gerar nova dica se task não tem dica", async () => {
      const novaDica = "Divida em módulos e pratique cada um!";
      (TaskRepository.findById as jest.Mock).mockReturnValue(mockTask);
      (AIService.generateTaskTip as jest.Mock).mockResolvedValue(novaDica);
      (TaskRepository.update as jest.Mock).mockReturnValue({
        ...mockTask,
        tip: novaDica,
      });

      const result = await TaskService.generateTip(1, false);

      expect(AIService.generateTaskTip).toHaveBeenCalledWith(
        mockTask.title,
        mockTask.description
      );
      expect(TaskRepository.update).toHaveBeenCalledWith(1, { tip: novaDica });
      expect(result.tip).toBe(novaDica);
    });

    it("deve gerar nova dica quando forceRegenerate é true", async () => {
      const taskComDica = { ...mockTask, tip: "Dica antiga" };
      const novaDica = "Nova dica gerada!";

      (TaskRepository.findById as jest.Mock).mockReturnValue(taskComDica);
      (AIService.generateTaskTip as jest.Mock).mockResolvedValue(novaDica);
      (TaskRepository.update as jest.Mock).mockReturnValue({
        ...taskComDica,
        tip: novaDica,
      });

      const result = await TaskService.generateTip(1, true);

      expect(AIService.generateTaskTip).toHaveBeenCalledWith(
        taskComDica.title,
        taskComDica.description
      );
      expect(TaskRepository.update).toHaveBeenCalledWith(1, { tip: novaDica });
      expect(result.tip).toBe(novaDica);
    });

    it("deve lançar erro quando task não existe", async () => {
      (TaskRepository.findById as jest.Mock).mockReturnValue(undefined);

      await expect(TaskService.generateTip(999, false)).rejects.toThrow(
        "Task não encontrada"
      );

      expect(AIService.generateTaskTip).not.toHaveBeenCalled();
      expect(TaskRepository.update).not.toHaveBeenCalled();
    });

    it("deve gerar dica mesmo sem descrição", async () => {
      const taskSemDescricao = { ...mockTask, description: null };
      const novaDica = "Organize seu tempo e foque!";

      (TaskRepository.findById as jest.Mock).mockReturnValue(taskSemDescricao);
      (AIService.generateTaskTip as jest.Mock).mockResolvedValue(novaDica);
      (TaskRepository.update as jest.Mock).mockReturnValue({
        ...taskSemDescricao,
        tip: novaDica,
      });

      await TaskService.generateTip(1, false);

      expect(AIService.generateTaskTip).toHaveBeenCalledWith(
        taskSemDescricao.title,
        undefined
      );
    });

    it("deve propagar erro quando AIService falha", async () => {
      (TaskRepository.findById as jest.Mock).mockReturnValue(mockTask);
      (AIService.generateTaskTip as jest.Mock).mockRejectedValue(
        new Error("Erro na API do Groq")
      );

      await expect(TaskService.generateTip(1, false)).rejects.toThrow(
        "Erro na API do Groq"
      );

      expect(TaskRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("getTasksByProjectId", () => {
    it("deve retornar todas as tasks de um projeto", async () => {
      const mockTasks = [
        { id: 1, title: "Task 1", project_id: 1 },
        { id: 2, title: "Task 2", project_id: 1 },
      ];

      (TaskRepository.findByProjectId as jest.Mock).mockReturnValue(mockTasks);

      const result = await TaskService.getTasksByProjectId(1);

      expect(result).toEqual(mockTasks);
      expect(TaskRepository.findByProjectId).toHaveBeenCalledWith(1);
    });

    it("deve retornar array vazio quando projeto não tem tasks", async () => {
      (TaskRepository.findByProjectId as jest.Mock).mockReturnValue([]);

      const result = await TaskService.getTasksByProjectId(999);

      expect(result).toEqual([]);
    });
  });

  describe("getTasksByUserId", () => {
    it("deve retornar todas as tasks do usuário", async () => {
      const mockTasks = [
        { id: 1, title: "Task 1" },
        { id: 2, title: "Task 2" },
      ];

      (TaskRepository.findByUserId as jest.Mock).mockReturnValue(mockTasks);

      const result = await TaskService.getTasksByUserId(1);

      expect(result).toEqual(mockTasks);
      expect(TaskRepository.findByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe("updateTaskStatus", () => {
    it("deve atualizar status da task", async () => {
      const updatedTask = { id: 1, status: "done" };
      (TaskRepository.updateStatus as jest.Mock).mockReturnValue(updatedTask);

      const result = await TaskService.updateTaskStatus(1, "done");

      expect(result).toEqual(updatedTask);
      expect(TaskRepository.updateStatus).toHaveBeenCalledWith(1, "done");
    });

    it("deve lançar erro quando status está vazio", async () => {
      await expect(TaskService.updateTaskStatus(1, "   ")).rejects.toThrow(
        "Status inválido"
      );

      expect(TaskRepository.updateStatus).not.toHaveBeenCalled();
    });
  });
});
