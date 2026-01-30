import { TaskValidation } from "../../../src/validations/task.validation";
import { TaskCreateDTO } from "../../../src/interfaces/task";
import { TaskPriority, TaskStatus } from "../../../src/enums/task.enums";

describe("TaskValidation - Testes Unitários", () => {
  describe("validateTitle", () => {
    it("deve passar quando título é válido", () => {
      expect(() => TaskValidation.validateTitle("Tarefa válida")).not.toThrow();
    });

    it("deve lançar erro quando título está vazio", () => {
      expect(() => TaskValidation.validateTitle("")).toThrow(
        "Título é obrigatório e deve ter pelo menos 1 caractere"
      );
    });

    it("deve lançar erro quando título contém apenas espaços", () => {
      expect(() => TaskValidation.validateTitle("   ")).toThrow(
        "Título é obrigatório e deve ter pelo menos 1 caractere"
      );
    });

    it("deve lançar erro quando título é null", () => {
      expect(() => TaskValidation.validateTitle(null as any)).toThrow(
        "Título é obrigatório e deve ter pelo menos 1 caractere"
      );
    });
  });

  describe("validateDescription", () => {
    it("deve passar quando descrição é válida", () => {
      expect(() =>
        TaskValidation.validateDescription("Descrição detalhada")
      ).not.toThrow();
    });

    it("deve passar quando descrição é undefined", () => {
      expect(() => TaskValidation.validateDescription(undefined)).not.toThrow();
    });

    it("deve lançar erro quando descrição contém apenas espaços", () => {
      expect(() => TaskValidation.validateDescription("   ")).toThrow(
        "Descrição inválida"
      );
    });
  });

  describe("validatePriority", () => {
    it("deve passar quando prioridade é low", () => {
      expect(() => TaskValidation.validatePriority("low")).not.toThrow();
    });

    it("deve passar quando prioridade é medium", () => {
      expect(() => TaskValidation.validatePriority("medium")).not.toThrow();
    });

    it("deve passar quando prioridade é high", () => {
      expect(() => TaskValidation.validatePriority("high")).not.toThrow();
    });

    it("deve passar quando prioridade é undefined", () => {
      expect(() => TaskValidation.validatePriority(undefined)).not.toThrow();
    });

    it("deve aceitar prioridades em uppercase", () => {
      expect(() => TaskValidation.validatePriority("HIGH")).not.toThrow();
      expect(() => TaskValidation.validatePriority("MEDIUM")).not.toThrow();
      expect(() => TaskValidation.validatePriority("LOW")).not.toThrow();
    });

    it("deve lançar erro quando prioridade é inválida", () => {
      expect(() => TaskValidation.validatePriority("urgent")).toThrow(
        "Prioridade deve ser low, medium ou high"
      );
    });
  });

  describe("validateStatus", () => {
    it("deve passar quando status é pending", () => {
      expect(() => TaskValidation.validateStatus("pending")).not.toThrow();
    });

    it("deve passar quando status é in_progress", () => {
      expect(() => TaskValidation.validateStatus("in_progress")).not.toThrow();
    });

    it("deve passar quando status é completed", () => {
      expect(() => TaskValidation.validateStatus("completed")).not.toThrow();
    });

    it("deve passar quando status é undefined", () => {
      expect(() => TaskValidation.validateStatus(undefined)).not.toThrow();
    });

    it("deve aceitar status em uppercase", () => {
      expect(() => TaskValidation.validateStatus("PENDING")).not.toThrow();
      expect(() => TaskValidation.validateStatus("IN_PROGRESS")).not.toThrow();
      expect(() => TaskValidation.validateStatus("COMPLETED")).not.toThrow();
    });

    it("deve lançar erro quando status é inválido", () => {
      expect(() => TaskValidation.validateStatus("done")).toThrow(
        "Status deve ser pending, in_progress ou completed"
      );
    });
  });

  describe("validateEstimate", () => {
    it("deve passar quando estimativa é número positivo", () => {
      expect(() => TaskValidation.validateEstimate(5)).not.toThrow();
      expect(() => TaskValidation.validateEstimate(1)).not.toThrow();
      expect(() => TaskValidation.validateEstimate(100)).not.toThrow();
    });

    it("deve passar quando estimativa é undefined", () => {
      expect(() => TaskValidation.validateEstimate(undefined)).not.toThrow();
    });

    it("deve lançar erro quando estimativa é zero", () => {
      expect(() => TaskValidation.validateEstimate(0)).toThrow(
        "Estimativa deve ser um número positivo"
      );
    });

    it("deve lançar erro quando estimativa é negativa", () => {
      expect(() => TaskValidation.validateEstimate(-5)).toThrow(
        "Estimativa deve ser um número positivo"
      );
    });
  });

  describe("validateProjectId", () => {
    it("deve passar quando projectId é número positivo", () => {
      expect(() => TaskValidation.validateProjectId(1)).not.toThrow();
      expect(() => TaskValidation.validateProjectId(100)).not.toThrow();
    });

    it("deve lançar erro quando projectId é zero", () => {
      expect(() => TaskValidation.validateProjectId(0)).toThrow(
        "ID do projeto é obrigatório e deve ser válido"
      );
    });

    it("deve lançar erro quando projectId é negativo", () => {
      expect(() => TaskValidation.validateProjectId(-1)).toThrow(
        "ID do projeto é obrigatório e deve ser válido"
      );
    });

    it("deve lançar erro quando projectId é undefined", () => {
      expect(() => TaskValidation.validateProjectId(undefined)).toThrow(
        "ID do projeto é obrigatório e deve ser válido"
      );
    });
  });

  describe("validateTaskCreation", () => {
    const validTaskData: TaskCreateDTO = {
      title: "Tarefa válida",
      project_id: 1,
    };

    it("deve passar quando task tem dados mínimos válidos", () => {
      expect(() =>
        TaskValidation.validateTaskCreation(validTaskData)
      ).not.toThrow();
    });

    it("deve passar quando task tem todos os campos válidos", () => {
      const fullTaskData: TaskCreateDTO = {
        title: "Tarefa completa",
        description: "Descrição detalhada",
        priority: TaskPriority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        estimate: 5,
        project_id: 1,
      };

      expect(() =>
        TaskValidation.validateTaskCreation(fullTaskData)
      ).not.toThrow();
    });

    it("deve lançar erro quando título está vazio", () => {
      const invalidTask = { ...validTaskData, title: "" };

      expect(() => TaskValidation.validateTaskCreation(invalidTask)).toThrow(
        "Título é obrigatório"
      );
    });

    it("deve lançar erro quando projectId é inválido", () => {
      const invalidTask = { ...validTaskData, project_id: 0 };

      expect(() => TaskValidation.validateTaskCreation(invalidTask)).toThrow(
        "ID do projeto é obrigatório"
      );
    });

    it("deve lançar erro quando prioridade é inválida", () => {
      const invalidTask = { ...validTaskData, priority: "urgent" as any };

      expect(() => TaskValidation.validateTaskCreation(invalidTask)).toThrow(
        "Prioridade deve ser low, medium ou high"
      );
    });

    it("deve lançar erro quando status é inválido", () => {
      const invalidTask = { ...validTaskData, status: "done" as any };

      expect(() => TaskValidation.validateTaskCreation(invalidTask)).toThrow(
        "Status deve ser pending, in_progress ou completed"
      );
    });

    it("deve lançar erro quando estimativa é negativa", () => {
      const invalidTask = { ...validTaskData, estimate: -5 };

      expect(() => TaskValidation.validateTaskCreation(invalidTask)).toThrow(
        "Estimativa deve ser um número positivo"
      );
    });
  });
});
