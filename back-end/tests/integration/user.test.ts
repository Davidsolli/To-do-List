import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/database/db";

describe("Integração - Fluxo de Usuários", () => {
  // Setup: Limpa o banco antes de tudo
  beforeAll(() => {
    db.prepare("DELETE FROM projects").run();
    db.prepare("DELETE FROM users").run();
  });

  let userIdCriado: number;

  // CRIAÇÃO (POST /auth/register)
  describe("Criação de Usuário", () => {
    it("deve criar um usuário válido com sucesso (201)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Gabriel Teste",
          email: "gabriel.teste@email.com",
          password: "SenhaForte123!"
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty("id");
      userIdCriado = response.body.user.id; // Guarda ID para os próximos testes
    });

    it("não deve criar usuário com email duplicado (400)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Gabriel Impostor",
          email: "gabriel.teste@email.com", // Mesmo email do anterior
          password: "OutraSenha123!"
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("não deve criar usuário faltando campos obrigatórios (400)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Gabriel Sem Senha",
          email: "sem.senha@email.com"
          // Faltando password
        });

      expect(response.status).toBe(400);
    });
    it("não deve criar usuário faltando campos obrigatórios (400)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Gabriel Sem Senha",
          //email: "sem.senha@email.com"
          password: "SenhaForte132!"
        });

      expect(response.status).toBe(400);
    });
    it("não deve criar usuário faltando campos obrigatórios (400)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          //name: "Gabriel Sem Senha",
          email: "sem.senha@email.com",
          password: "SenhaForte132!"
        });

      expect(response.status).toBe(400);
    });
  });

  // BUSCA POR ID (GET /users/:id) 
  describe("Busca de Usuário por ID", () => {
    it("deve retornar os dados do usuário criado (200)", async () => {
      const response = await request(app).get(`/api/users/${userIdCriado}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userIdCriado);
      expect(response.body.name).toBe("Gabriel Teste");
      expect(response.body.password).toBeUndefined(); // Segurança
    });

    it("deve retornar 404 (ou 400) para usuário inexistente", async () => {
      const response = await request(app).get("/api/users/99999");
      // Aceita 404 (Not Found) ou 400 (Bad Request - dependendo do seu controller)
      expect([400, 404]).toContain(response.status);
    });
  });
});