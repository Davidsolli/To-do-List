import UserService from "../../src/services/user.service";
import UserRepository from "../../src/repositories/user.repository";
import { UserUpdateDTO } from "../../src/interfaces/user";
import bcrypt from "bcrypt";

// 1. MOCK DO REPOSITÓRIO
jest.mock("../../src/repositories/user.repository");

// 2. MOCK DO BCRYPT
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

describe("Unitário - UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks(); // Limpa contadores
    userService = new UserService(); // Instancia a classe
  });

  describe("getById", () => {
    it("deve retornar um usuário quando encontrado", async () => {
      // ARRANGE
      const mockUser = { id: 1, name: "Teste", email: "teste@email.com" };
      (UserRepository.findById as jest.Mock).mockReturnValue(mockUser);

      // ACT
      const result = await userService.getById(1);

      // ASSERT
      expect(result).toEqual(mockUser);
      expect(UserRepository.findById).toHaveBeenCalledWith(1);
    });

    it("deve lançar erro 'Usuário não encontrado' se o ID não existir", async () => {
      // ARRANGE
      (UserRepository.findById as jest.Mock).mockReturnValue(null);

      // ACT & ASSERT
      await expect(async () => {
        await userService.getById(99);
      }).rejects.toThrow("Usuário não encontrado");
    });
  });

  describe("getAll", () => {
    it("deve retornar uma lista de usuários", async () => {
      // ARRANGE
      const mockUsers = [{ id: 1, name: "User 1" }, { id: 2, name: "User 2" }];
      (UserRepository.findAll as jest.Mock).mockReturnValue(mockUsers);

      // ACT
      const result = await userService.getAll();

      // ASSERT
      expect(result).toEqual(mockUsers);
      expect(UserRepository.findAll).toHaveBeenCalled();
    });

    it("deve lançar erro se não encontrar usuários", async () => {
      // ARRANGE
      (UserRepository.findAll as jest.Mock).mockReturnValue(null);

      // ACT & ASSERT
      await expect(async () => {
        await userService.getAll();
      }).rejects.toThrow("Usuários não encontrados");
    });
  });

  describe("update", () => {
    // --- ESTE É O TESTE QUE ESTAVA DANDO ERRO ---
    it("deve atualizar nome e email, enviando undefined na senha para não alterá-la", async () => {
      // ARRANGE
      const existingUser = { id: 1, name: "Antigo", email: "antigo@email.com", password: "hash_antiga" };
      
      const updateData: UserUpdateDTO = { name: "Novo Nome", email: "novo@email.com" }; 
      
      (UserRepository.findById as jest.Mock).mockReturnValue(existingUser);
      (UserRepository.update as jest.Mock).mockReturnValue(true);

      // ACT
      const result = await userService.update(1, updateData);

      // ASSERT
      expect(result).toBe(true);
      
      // AGORA SIM: Esperamos 'undefined' no último parâmetro
      expect(UserRepository.update).toHaveBeenCalledWith(1, "Novo Nome", "novo@email.com", undefined);
      
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it("deve hashear a nova senha se ela for informada", async () => {
      // ARRANGE
      const existingUser = { id: 1, name: "Antigo", email: "antigo@email.com", password: "hash_antiga" };
      
      const updateData: UserUpdateDTO = { password: "nova_senha_123" };
      
      (UserRepository.findById as jest.Mock).mockReturnValue(existingUser);
      (UserRepository.update as jest.Mock).mockReturnValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue("nova_hash_segura");

      // ACT
      await userService.update(1, updateData);

      // ASSERT
      expect(UserRepository.update).toHaveBeenCalledWith(1, "Antigo", "antigo@email.com", "nova_hash_segura");
    });

    it("deve lançar erro se tentar atualizar usuário inexistente", async () => {
      // ARRANGE
      (UserRepository.findById as jest.Mock).mockReturnValue(null);

      // ACT & ASSERT
      await expect(async () => {
        await userService.update(99, {});
      }).rejects.toThrow("Usuário não encontrado");
    });
  });

  describe("delete", () => {
    it("deve retornar true ao deletar com sucesso", async () => {
      // ARRANGE
      (UserRepository.delete as jest.Mock).mockReturnValue(true);

      // ACT
      const result = await userService.delete(1);

      // ASSERT
      expect(result).toBe(true);
    });

    it("deve lançar erro se falhar ao deletar", async () => {
      // ARRANGE
      (UserRepository.delete as jest.Mock).mockReturnValue(false);

      // ACT & ASSERT
      await expect(async () => {
        await userService.delete(1);
      }).rejects.toThrow("Usuário não encontrado ou já deletado");
    });
  });
});