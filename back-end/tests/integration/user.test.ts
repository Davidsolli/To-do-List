import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/database/db";

describe("Integração - Fluxo de Usuários", () => {
  beforeAll(() => {
    db.prepare("DELETE FROM projects").run();
    db.prepare("DELETE FROM users").run();
  });

  let userIdCriado: number;

  // CRIAÇÃO
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
      userIdCriado = response.body.user.id;
    });

    it("não deve criar usuário com email duplicado (400)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Gabriel Impostor",
          email: "gabriel.teste@email.com",
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
          //SEM SENHA
        });

      expect(response.status).toBe(400);
    });
    it("não deve criar usuário faltando campos obrigatórios (400)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Gabriel Sem Senha",
          //SEM EMAIL
          password: "SenhaForte132!"
        });

      expect(response.status).toBe(400);
    });
    it("não deve criar usuário faltando campos obrigatórios (400)", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          //SEM NOME
          email: "sem.senha@email.com",
          password: "SenhaForte132!"
        });

      expect(response.status).toBe(400);
    });
  });

  // BUSCA POR ID
  describe("Busca de Usuário por ID", () => {
    it("deve retornar os dados do usuário criado (200)", async () => {
      if (!userIdCriado) return;

      const response = await request(app).get(`/api/users/${userIdCriado}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userIdCriado);
      expect(response.body.name).toBe("Gabriel Teste");
      expect(response.body.password).toBeUndefined();
    });

    it("deve retornar erro para usuário inexistente", async () => {
      const response = await request(app).get("/api/users/99999");
      expect([400, 404]).toContain(response.status);
    });
  });

  // LISTAR TODOS
  describe("Listagem de Usuários", () => {
    it("deve listar todos os usuários cadastrados (200)", async () => {
      const response = await request(app).get("/api/users");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  // ATUALIZAR
  describe("Atualização de Usuário", () => {
    it("deve atualizar apenas o NOME", async () => {
      if (!userIdCriado) return;

      const response = await request(app)
        .put(`/api/users/${userIdCriado}`)
        .send({ name: "Gabriel Atualizado Nome" });

      expect(response.status).toBe(200);

      const check = await request(app).get(`/api/users/${userIdCriado}`);
      expect(check.body.name).toBe("Gabriel Atualizado Nome");
    });

    it("deve atualizar apenas o EMAIL", async () => {
      if (!userIdCriado) return;

      const response = await request(app)
        .put(`/api/users/${userIdCriado}`)
        .send({ email: "atualizado@email.com" });

      expect(response.status).toBe(200);

      const check = await request(app).get(`/api/users/${userIdCriado}`);
      expect(check.body.email).toBe("atualizado@email.com");
    });

    it("deve atualizar apenas a SENHA", async () => {
      if (!userIdCriado) return;

      const response = await request(app)
        .put(`/api/users/${userIdCriado}`)
        .send({ password: "NovaSenhaForte456@" });

      expect(response.status).toBe(200);
    });

    it("deve atualizar TUDO (Nome, Email e Senha)", async () => {
      if (!userIdCriado) return;

      const response = await request(app)
        .put(`/api/users/${userIdCriado}`)
        .send({
          name: "Gabriel Full Update",
          email: "full@update.com",
          password: "OutraSenha789!"
        });

      expect(response.status).toBe(200);

      const check = await request(app).get(`/api/users/${userIdCriado}`);
      expect(check.body.name).toBe("Gabriel Full Update");
      expect(check.body.email).toBe("full@update.com");
    });

    it("deve retornar erro ao tentar atualizar ID inexistente", async () => {
      const response = await request(app)
        .put("/api/users/99999")
        .send({ name: "Não Existo" });

      expect([400, 404]).toContain(response.status);
    });
  });

  // DELETAR
  describe("Remoção de Usuário", () => {
    it("deve deletar o usuário criado com sucesso", async () => {
      if (!userIdCriado) return;

      const response = await request(app).delete(`/api/users/${userIdCriado}`);
      expect([200, 204]).toContain(response.status);

      const check = await request(app).get(`/api/users/${userIdCriado}`);
      expect([400, 404]).toContain(check.status);
    });

    it("deve retornar erro ao tentar deletar ID inexistente", async () => {
      const response = await request(app).delete("/api/users/99999");
      expect([400, 404]).toContain(response.status);
    });
  });
});
