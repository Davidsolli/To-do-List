import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/database/db";
import jwt from "jsonwebtoken";
import { UserRole } from "../../src/enums/userRoles.enums";

describe("Integração - Fluxo de Usuários", () => {
  let token: string;
  let adminToken: string;
  let userIdCriado: number;

  beforeEach(() => {
    db.prepare("DELETE FROM tasks").run();
    db.prepare("DELETE FROM projects").run();
    db.prepare("DELETE FROM users").run();
  });

  // Helper function to create a user and setup tokens
  async function criarUsuarioETokens() {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Gabriel Teste",
        email: "gabriel.teste@email.com",
        password: "SenhaForte123!"
      });

    userIdCriado = response.body.user.id;

    token = jwt.sign(
      {
        id: userIdCriado,
        email: "gabriel.teste@email.com",
        role: UserRole.USER
      },
      "segredo_super_seguranca"
    );

    const adminUser = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      "Admin User",
      "admin@test.com",
      "hashedpassword",
      UserRole.ADMIN
    );

    adminToken = jwt.sign(
      {
        id: adminUser.lastInsertRowid,
        email: "admin@test.com",
        role: UserRole.ADMIN
      },
      "segredo_super_seguranca"
    );
  }

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

      // Criar token para o usuário criado
      token = jwt.sign(
        {
          id: userIdCriado,
          email: "gabriel.teste@email.com",
          role: UserRole.USER
        },
        "segredo_super_seguranca"
      );

      // Criar um usuário admin para testes que necessitam de admin
      const adminUser = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
        "Admin User",
        "admin@test.com",
        "hashedpassword",
        UserRole.ADMIN
      );

      adminToken = jwt.sign(
        {
          id: adminUser.lastInsertRowid,
          email: "admin@test.com",
          role: UserRole.ADMIN
        },
        "segredo_super_seguranca"
      );
    });

    it("não deve criar usuário com email duplicado (400)", async () => {
      // Primeiro criar um usuário
      await request(app)
        .post("/api/auth/register")
        .send({
          name: "Gabriel Original",
          email: "gabriel.teste@email.com",
          password: "SenhaForte123!"
        });

      // Tentar criar outro com o mesmo email
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
      await criarUsuarioETokens();

      const response = await request(app)
        .get(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${token}`]);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(userIdCriado);
      expect(response.body.name).toBe("Gabriel Teste");
      expect(response.body.password).toBeUndefined();
    });

    it("deve retornar erro para usuário inexistente", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .get("/api/users/99999")
        .set("Cookie", [`token=${adminToken}`]);
      expect([400, 404]).toContain(response.status);
    });
  });

  // LISTAR TODOS
  describe("Listagem de Usuários", () => {
    it("deve listar todos os usuários cadastrados (200)", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .get("/api/users")
        .set("Cookie", [`token=${adminToken}`]);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  // ATUALIZAR
  describe("Atualização de Usuário", () => {
    it("deve atualizar apenas o NOME", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .put(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${token}`])
        .send({ name: "Gabriel Atualizado Nome" });

      expect(response.status).toBe(200);

      const check = await request(app)
        .get(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${token}`]);
      expect(check.body.name).toBe("Gabriel Atualizado Nome");
    });

    it("deve atualizar apenas o EMAIL", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .put(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${token}`])
        .send({ email: "atualizado@email.com" });

      expect(response.status).toBe(200);

      const check = await request(app)
        .get(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${token}`]);
      expect(check.body.email).toBe("atualizado@email.com");
    });

    it("deve atualizar apenas a SENHA", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .put(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${token}`])
        .send({ password: "NovaSenhaForte456@" });

      expect(response.status).toBe(200);
    });

    it("deve atualizar TUDO (Nome, Email e Senha)", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .put(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${token}`])
        .send({
          name: "Gabriel Full Update",
          email: "gabriel.full@update.com",
          password: "OutraSenha789!"
        });

      expect(response.status).toBe(200);

      const check = await request(app)
        .get(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${token}`]);
      expect(check.body.name).toBe("Gabriel Full Update");
      expect(check.body.email).toBe("gabriel.full@update.com");
    });

    it("deve retornar erro ao tentar atualizar ID inexistente", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .put("/api/users/99999")
        .set("Cookie", [`token=${adminToken}`])
        .send({ name: "Não Existo" });

      expect([400, 404]).toContain(response.status);
    });
  });

  // DELETAR
  describe("Remoção de Usuário", () => {
    it("deve deletar o usuário criado com sucesso", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .delete(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${adminToken}`]);
      expect([200, 204]).toContain(response.status);

      const check = await request(app)
        .get(`/api/users/${userIdCriado}`)
        .set("Cookie", [`token=${adminToken}`]);
      expect([400, 404]).toContain(check.status);
    });

    it("deve retornar erro ao tentar deletar ID inexistente", async () => {
      await criarUsuarioETokens();

      const response = await request(app)
        .delete("/api/users/99999")
        .set("Cookie", [`token=${adminToken}`]);
      expect([400, 404]).toContain(response.status);
    });
  });
});
