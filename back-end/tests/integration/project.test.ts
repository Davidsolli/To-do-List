import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/database/db";
import jwt from "jsonwebtoken";
import { UserRole } from "../../src/enums/userRoles.enums";

describe("Integração - Rotas de Projetos", () => {
  let token: string;

  beforeAll(() => {
    db.prepare("DELETE FROM projects").run();
    db.prepare("DELETE FROM users").run();

    db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)").run(
      1,
      "Test User",
      "test@user.com",
      "123456",
      UserRole.USER
    );

    token = jwt.sign({ id: 1, email: "test@user.com", role: UserRole.USER }, "segredo_super_seguranca");
  });

  // TESTE 1: CRIAR PROJETO (POST)
  it("deve criar um novo projeto com sucesso", async () => {
    const response = await request(app)
      .post("/api/projects")
      .set("Cookie", [`token=${token}`])
      .send({
        name: "Projeto Alpha",
        description: "Projeto 1 de ciclo."
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.name).toBe("Projeto Alpha");
  });

  // TESTE 2: VALIDAR DUPLICIDADE (REGRA DE NEGÓCIO)
  it("não deve permitir criar projeto com mesmo nome para o mesmo usuário", async () => {
    const response = await request(app)
      .post("/api/projects")
      .set("Cookie", [`token=${token}`])
      .send({
        name: "Projeto Alpha",
        description: "Projeto 2 de ciclo."
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Você já possui um projeto com este nome.");
  });

  // TESTE 3: LISTAR PROJETO PELO ID DO USUÁRIO (GET)
  it("deve listar todos os projetos de um usuário", async () => {
    const response = await request(app)
      .get("/api/projects/user/1")
      .set("Cookie", [`token=${token}`]);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].user_id).toBe(1);
  });

  // TESTE 4: ATUALIZAÇÃO PARCIAL (PUT)
  it("deve permitir atualizar APENAS a descrição", async () => {
    const projetoCriado = await request(app)
      .post("/api/projects")
      .set("Cookie", [`token=${token}`])
      .send({
        name: "Projeto Update", 
        description: "Descrição Velha"
    });
    const idProjeto = projetoCriado.body.id;

    // 2. ATUALIZA usando o ID que acabamos de receber
    const response = await request(app)
      .put(`/api/projects/${idProjeto}`)
      .set("Cookie", [`token=${token}`])
      .send({
        description: "Descrição Atualizada com Sucesso"
      });

    expect(response.status).toBe(200);
    expect(response.body.description).toBe("Descrição Atualizada com Sucesso");
    expect(response.body.name).toBe("Projeto Update");
  });

  // TESTE 5: DELETAR (DELETE)
  it("deve deletar um projeto existente", async () => {
    const projetoCriado = await request(app)
      .post("/api/projects")
      .set("Cookie", [`token=${token}`])
      .send({
        name: "Projeto Delete", 
        description: "Vai ser apagado"
    });
    const idProjeto = projetoCriado.body.id;

    const response = await request(app)
      .delete(`/api/projects/${idProjeto}`)
      .set("Cookie", [`token=${token}`]);

    expect(response.status).toBe(204);

    const check = await request(app)
        .get(`/api/projects/${idProjeto}`)
        .set("Cookie", [`token=${token}`]);
    expect([400, 404]).toContain(check.status); 
  });
});