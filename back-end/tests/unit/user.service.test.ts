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

  //LISTAR TODOS
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
});
  