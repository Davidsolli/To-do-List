import UserService from "../../src/services/user.service";
import UserRepository from "../../src/repositories/user.repository";
import { UserUpdateDTO } from "../../src/interfaces/user";

jest.mock("../../src/repositories/user.repository");
jest.mock("bcrypt", () => ({
  hash: jest.fn(),
}));

describe("Unitário - UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  // BUSCA POR ID 
  describe("getById", () => {
    it("deve retornar os dados do usuário quando o ID for válido", async () => {
      const mockUser = { id: 1, name: "Teste Unitario", email: "teste@unit.com" };
      (UserRepository.findById as jest.Mock).mockReturnValue(mockUser);

      const result = await userService.getById(1);

      expect(result).toEqual(mockUser);
      expect(UserRepository.findById).toHaveBeenCalledWith(1);
    });

    it("deve lançar erro 'Usuário não encontrado' quando o ID não existir", async () => {
      (UserRepository.findById as jest.Mock).mockReturnValue(undefined);
      await expect(userService.getById(99)).rejects.toThrow("Usuário não encontrado");
    });
  });

  // LISTAR TODOS
  describe("getAll", () => {
    it("deve retornar uma lista de usuários", async () => {
      const mockUsers = [
        { id: 1, name: "User 1", email: "u1@test.com" },
        { id: 2, name: "User 2", email: "u2@test.com" }
      ];
      (UserRepository.findAll as jest.Mock).mockReturnValue(mockUsers);

      const result = await userService.getAll();

      expect(result).toEqual(mockUsers);
      expect(UserRepository.findAll).toHaveBeenCalled();
    });

    it("deve lançar erro se a lista vier vazia/nula", async () => {
      (UserRepository.findAll as jest.Mock).mockReturnValue(null);
      await expect(userService.getAll()).rejects.toThrow("Usuários não encontrados");
    });
  });

  // ATUALIZAR
  describe("update", () => {
    const existingUser = { id: 1, name: "Antigo", email: "antigo@email.com" };

    it("deve atualizar APENAS o nome (senha undefined)", async () => {
      (UserRepository.findById as jest.Mock).mockReturnValue(existingUser);
      (UserRepository.update as jest.Mock).mockReturnValue(true);

      await userService.update(1, { name: "Nome Novo" });

      expect(UserRepository.update).toHaveBeenCalledWith(1, {
        name: "Nome Novo",
        email: "antigo@email.com",
        password: undefined
      });
    });

    it("deve atualizar APENAS o email", async () => {
      (UserRepository.findById as jest.Mock).mockReturnValue(existingUser);
      (UserRepository.update as jest.Mock).mockReturnValue(true);

      await userService.update(1, { email: "novo@email.com" });

      expect(UserRepository.update).toHaveBeenCalledWith(1, {
        name: "Antigo",
        email: "novo@email.com",
        password: undefined
      });
    });

    it("deve atualizar APENAS a senha (com hash)", async () => {
      (UserRepository.findById as jest.Mock).mockReturnValue(existingUser);
      (UserRepository.update as jest.Mock).mockReturnValue(true);
      (require("bcrypt").hash as jest.Mock).mockResolvedValue("nova_hash_segura");

      await userService.update(1, { password: "123" });

      expect(UserRepository.update).toHaveBeenCalledWith(1, {
        name: "Antigo",
        email: "antigo@email.com",
        password: "nova_hash_segura"
      });
    });

    it("deve atualizar TUDO (Nome, Email e Senha)", async () => {
      (UserRepository.findById as jest.Mock).mockReturnValue(existingUser);
      (UserRepository.update as jest.Mock).mockReturnValue(true);
      (require("bcrypt").hash as jest.Mock).mockResolvedValue("hash_completa");

      await userService.update(1, { name: "Full", email: "full@test.com", password: "123" });

      expect(UserRepository.update).toHaveBeenCalledWith(1, {
        name: "Full",
        email: "full@test.com",
        password: "hash_completa"
      });
    });

    it("deve lançar erro ao tentar atualizar usuário inexistente", async () => {
      (UserRepository.findById as jest.Mock).mockReturnValue(null);
      await expect(userService.update(99, { name: "Fantasma" })).rejects.toThrow("Usuário não encontrado");
    });
  });

  // DELETAR
  describe("delete", () => {
    it("deve deletar com sucesso", async () => {
      (UserRepository.delete as jest.Mock).mockReturnValue(true);
      const result = await userService.delete(1);
      expect(result).toBe(true);
    });

    it("deve lançar erro ao falhar no delete", async () => {
      (UserRepository.delete as jest.Mock).mockReturnValue(false);
      await expect(userService.delete(1)).rejects.toThrow("Usuário não encontrado ou já deletado");
    });
  });
});
