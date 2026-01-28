import { TaskService } from "../../src/services/task.service";
import { TaskRepository } from "../../src/repositories/task.repository";
import { TaskValidation } from "../../src/validations/task.validation";

// MOCK DO REPOSITÓRIO
jest.mock("../../src/repositories/task.repository");

// MOCK DA VALIDAÇÃO
jest.mock("../../src/validations/task.validation");

describe("Unitário - TaskService", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTask", () => {
    it("deve criar uma task com sucesso", async () => {
      // ARRANGE
      const mockTaskData = {
        title: "Task Teste",
        description: "Descrição válida",
        project_id: 1,
      };

      const mockCreatedTask = {
        id: 1,
        ...mockTaskData,
        status: "pending"
      };

      (TaskValidation.validateTaskCreation as jest.Mock).mockImplementation(() => {});
      (TaskRepository.create as jest.Mock).mockReturnValue(mockCreatedTask);

      // ACT
      const result = await TaskService.createTask(mockTaskData as any);

      // ASSERT
      expect(TaskValidation.validateTaskCreation).toHaveBeenCalledWith(mockTaskData);
      expect(TaskRepository.create).toHaveBeenCalledWith(mockTaskData);
      expect(result).toEqual(mockCreatedTask);
    });

    it("deve lançar erro se a validação falhar", async () => {
      const mockTaskData = { title: "" };

      (TaskValidation.validateTaskCreation as jest.Mock).mockImplementation(() => {
        throw new Error("Erro de validação");
      });

      await expect(async () => {
        await TaskService.createTask(mockTaskData as any);
      }).rejects.toThrow("Erro de validação");

      expect(TaskRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getTasksByUserId", () => {
    it("deve retornar lista de tasks do usuário", async () => {
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

  describe("searchTasksByUserIdAndKeyword", () => {
    it("deve buscar tasks pelo termo", async () => {
      const mockTasks = [{ id: 1, title: "Estudar Jest" }];

      (TaskRepository.searchByUserIdAndKeyword as jest.Mock).mockReturnValue(mockTasks);

      const result = await TaskService.searchTasksByUserIdAndKeyword(1, "Jest");

      expect(result).toEqual(mockTasks);
      expect(TaskRepository.searchByUserIdAndKeyword).toHaveBeenCalledWith(1, "Jest");
    });

    it("deve lançar erro se o termo estiver vazio", async () => {
      await expect(async () => {
        await TaskService.searchTasksByUserIdAndKeyword(1, "   ");
      }).rejects.toThrow("Parâmetro de busca não pode estar vazio");

      expect(TaskRepository.searchByUserIdAndKeyword).not.toHaveBeenCalled();
    });
  });

  describe("updateTask", () => {
    it("deve atualizar uma task com sucesso", async () => {
      const updateData = { title: "Novo título" };

      const updatedTask = {
        id: 1,
        title: "Novo título",
        description: "Antiga",
      };

      (TaskRepository.update as jest.Mock).mockReturnValue(updatedTask);

      const result = await TaskService.updateTask(1, updateData);

      expect(TaskRepository.update).toHaveBeenCalledWith(1, updateData);
      expect(result).toEqual(updatedTask);
    });

    it("deve propagar erro se o repository falhar", async () => {
      (TaskRepository.update as jest.Mock).mockImplementation(() => {
        throw new Error("Task não encontrada");
      });

      await expect(async () => {
        await TaskService.updateTask(99, {});
      }).rejects.toThrow("Task não encontrada");
    });
  });

  describe("updateTaskStatus", () => {
    it("deve atualizar o status da task", async () => {
      const updatedTask = {
        id: 1,
        status: "done"
      };

      (TaskRepository.updateStatus as jest.Mock).mockReturnValue(updatedTask);

      const result = await TaskService.updateTaskStatus(1, "done");

      expect(TaskRepository.updateStatus).toHaveBeenCalledWith(1, "done");
      expect(result).toEqual(updatedTask);
    });

    it("deve lançar erro se status for vazio", async () => {
      await expect(async () => {
        await TaskService.updateTaskStatus(1, " ");
      }).rejects.toThrow("Status inválido");

      expect(TaskRepository.updateStatus).not.toHaveBeenCalled();
    });
  });

  describe("deleteTask", () => {
    it("deve deletar a task com sucesso", async () => {
      (TaskRepository.delete as jest.Mock).mockReturnValue(undefined);

      const result = await TaskService.deleteTask(1);

      expect(TaskRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });

    it("deve propagar erro se falhar ao deletar", async () => {
      (TaskRepository.delete as jest.Mock).mockImplementation(() => {
        throw new Error("Task não encontrada");
      });

      await expect(async () => {
        await TaskService.deleteTask(99);
      }).rejects.toThrow("Task não encontrada");
    });
  });

});
