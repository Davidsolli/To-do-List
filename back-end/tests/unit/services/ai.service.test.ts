import { AIService } from "../../../src/services/ai.service";
import Groq from "groq-sdk";

// Mock do Groq SDK
jest.mock("groq-sdk");

describe("AIService - Testes Unitários", () => {
  let mockCreate: jest.Mock;
  let MockedGroq: jest.MockedClass<typeof Groq>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configurar variável de ambiente ANTES de qualquer outra coisa
    process.env.GROQ_API_KEY = "test_api_key";

    // Mock do método chat.completions.create
    mockCreate = jest.fn();
    MockedGroq = Groq as jest.MockedClass<typeof Groq>;
    MockedGroq.mockImplementation(
      () =>
        ({
          chat: {
            completions: {
              create: mockCreate,
            },
          },
        } as any)
    );

    // Resetar o cliente lazy
    (AIService as any).groq = null;
  });

  afterEach(() => {
    delete process.env.GROQ_API_KEY;
    (AIService as any).groq = null;
  });

  describe("generateTaskTip", () => {
    it("deve gerar uma dica com sucesso quando título é fornecido", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Divida em etapas menores para melhor foco!",
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await AIService.generateTaskTip("Estudar React");

      expect(result).toBe("Divida em etapas menores para melhor foco!");
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 100,
        })
      );
    });

    it("deve gerar uma dica incluindo descrição quando fornecida", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "Comece pelos hooks básicos: useState e useEffect!",
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await AIService.generateTaskTip(
        "Estudar React",
        "Aprender hooks do React"
      );

      expect(result).toBe("Comece pelos hooks básicos: useState e useEffect!");
      expect(mockCreate).toHaveBeenCalledTimes(1);

      // Verificar que o prompt inclui a descrição
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain("Aprender hooks do React");
    });

    it("deve lançar erro quando GROQ_API_KEY não está configurada", async () => {
      // Resetar o cliente e remover a API key
      (AIService as any).groq = null;
      delete process.env.GROQ_API_KEY;

      await expect(
        AIService.generateTaskTip("Estudar React")
      ).rejects.toThrow("GROQ_API_KEY não configurada");

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("deve lançar erro quando a IA não retorna conteúdo", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(
        AIService.generateTaskTip("Estudar React")
      ).rejects.toThrow("Falha ao gerar dica com IA");
    });

    it("deve lançar erro quando a API do Groq falha", async () => {
      mockCreate.mockRejectedValue(new Error("API Error"));

      await expect(
        AIService.generateTaskTip("Estudar React")
      ).rejects.toThrow("Erro ao gerar dica: API Error");
    });

    it("deve fazer trim no conteúdo retornado pela IA", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "  Dica com espaços  \n",
            },
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await AIService.generateTaskTip("Estudar React");

      expect(result).toBe("Dica com espaços");
    });
  });
});
