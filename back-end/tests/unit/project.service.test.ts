import { ProjectService } from "../../src/services/project.service";
import { ProjectRepository } from "../../src/repositories/project.repository";

// 1. MOCKANDO O REPOSITÓRIO
jest.mock("../../src/repositories/project.repository");

describe("Unitário - ProjectService", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("deve criar um projeto com sucesso", () => {
      // ARRANGE
      const mockProjectData = { name: "Novo Projeto", description: "Descrição válida", user_id: 1 };
      const mockCreatedProject = { id: 10, ...mockProjectData };

      // O repositório não deve achar duplicidade
      (ProjectRepository.findByProjectName as jest.Mock).mockReturnValue(undefined);
      // O create deve retornar um ID
      (ProjectRepository.create as jest.Mock).mockReturnValue(10);
      // O findById deve retornar o objeto completo
      (ProjectRepository.findById as jest.Mock).mockReturnValue(mockCreatedProject);

      // ACT
      const result = ProjectService.create(mockProjectData);

      // ASSERT
      expect(result).toEqual(mockCreatedProject);
      // Verifica se o Service chamou o Repositório corretamente
      expect(ProjectRepository.create).toHaveBeenCalledWith(mockProjectData);
      expect(ProjectRepository.create).toHaveBeenCalledTimes(1);
    });

    it("deve lançar erro se tentar criar projeto com nome duplicado", () => {
      // ARRANGE
      // Simula que JÁ EXISTE um projeto com esse nome
      (ProjectRepository.findByProjectName as jest.Mock).mockReturnValue({ id: 5, name: "Projeto Duplicado" });

      // ACT & ASSERT
      expect(() => {
        ProjectService.create({ name: "Projeto Duplicado", description: "Descrição válida.", user_id: 1 });
      }).toThrow("Você já possui um projeto com este nome.");

      // Garante que NÃO tentou salvar no banco
      expect(ProjectRepository.create).not.toHaveBeenCalled();
    });

    it("deve lançar erro de validação (nome curto)", () => {
        // ACT & ASSERT
        // Não precisa mockar o repository aqui, pois a validação acontece antes
        expect(() => {
            ProjectService.create({ name: "Oi", description: "Descrição válida", user_id: 1 });
        }).toThrow("O nome do projeto deve ter pelo menos 3 caracteres.");
    });
  });

  describe("update", () => {
    it("deve atualizar APENAS a descrição mantendo o nome antigo", () => {
        // ARRANGE
        const oldProject = { id: 1, name: "Nome Antigo", description: "Descrição Antiga", user_id: 1 };
        
        // Simula que o projeto existe no banco
        (ProjectRepository.findById as jest.Mock).mockReturnValue(oldProject);
        // Simula sucesso no update
        (ProjectRepository.update as jest.Mock).mockReturnValue(1);

        // ACT
        // Envia APENAS a nova descrição
        ProjectService.update(1, { description: "Nova Descrição" });

        // ASSERT
        // Verifica se o Service misturou o 'Nome Antigo' com a 'Nova Descrição' antes de mandar pro banco
        expect(ProjectRepository.update).toHaveBeenCalledWith(1, {
            name: "Nome Antigo",       // Manteve o antigo
            description: "Nova Descrição", // Usou o novo
            user_id: 1
        });
    });

    it("deve lançar erro se o projeto não existir", () => {
        // ARRANGE
        (ProjectRepository.findById as jest.Mock).mockReturnValue(undefined);

        // ACT & ASSERT
        expect(() => {
            ProjectService.update(999, { name: "Teste" });
        }).toThrow("Projeto não encontrado para atualização.");
    });

    it("deve lançar erro ao tentar atualizar para um nome que já existe em outro projeto", () => {
        // ARRANGE
        const myProject = { id: 1, name: "Meu Projeto", description: "Descrição", user_id: 1 };
        const otherProject = { id: 2, name: "Nome Ocupado", description: "Descrição", user_id: 1 };

        // 1. Acha o projeto
        (ProjectRepository.findById as jest.Mock).mockReturnValue(myProject);
        // 2. Verifica se o novo nome existe -> Sim, acha o projeto 2
        (ProjectRepository.findByProjectName as jest.Mock).mockReturnValue(otherProject);

        // ACT & ASSERT
        expect(() => {
            ProjectService.update(1, { name: "Nome Ocupado" });
        }).toThrow("Você já possui outro projeto com este nome.");
    });
  });

  describe("delete", () => {
      it("deve deletar um projeto existente", () => {
          // ARRANGE
          (ProjectRepository.findById as jest.Mock).mockReturnValue({ id: 1 });
          (ProjectRepository.delete as jest.Mock).mockReturnValue(1);

          // ACT
          const result = ProjectService.delete(1);

          // ASSERT
          expect(result).toBe(true);
          expect(ProjectRepository.delete).toHaveBeenCalledWith(1);
      });

      it("deve lançar erro ao tentar deletar projeto inexistente", () => {
          // ARRANGE
          (ProjectRepository.findById as jest.Mock).mockReturnValue(undefined);

          // ACT & ASSERT
          expect(() => {
              ProjectService.delete(999);
          }).toThrow("Projeto não encontrado para exclusão.");
      });
  });
});