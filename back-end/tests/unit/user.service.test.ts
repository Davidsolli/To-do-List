import UserService from "../../src/services/user.service";
import UserRepository from "../../src/repositories/user.repository";

// Mocks
jest.mock("../../src/repositories/user.repository");
jest.mock("bcrypt", () => ({ hash: jest.fn() })); // Mock do bcrypt para uso futuro

describe("Unitário - UserService", () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  // BLOCO: BUSCA POR ID (GET)
  describe("getById", () => {
    it("deve retornar os dados do usuário quando o ID for válido", async () => {
      // Cenário
      const mockUser = { id: 1, name: "Teste Unitario", email: "teste@unit.com" };
      (UserRepository.findById as jest.Mock).mockReturnValue(mockUser);

      // Ação
      const result = await userService.getById(1);

      // Verificação
      expect(result).toEqual(mockUser);
      expect(UserRepository.findById).toHaveBeenCalledWith(1);
    });

    it("deve lançar erro 'Usuário não encontrado' quando o ID não existir", async () => {
      // Cenário
      (UserRepository.findById as jest.Mock).mockReturnValue(undefined);

      // Ação & Verificação
      await expect(userService.getById(99)).rejects.toThrow("Usuário não encontrado");
    });
  });
});