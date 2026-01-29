import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/database/db";
import jwt from "jsonwebtoken";
import { UserRole } from "../../src/enums/userRoles.enums";

describe("Integração - Segurança de Projetos", () => {
  let tokenUserA: string;
  let tokenUserB: string;
  let projectIdUserA: number;

  beforeEach(async () => {
    db.prepare("DELETE FROM tasks").run();
    db.prepare("DELETE FROM projects").run();
    db.prepare("DELETE FROM users").run();

    // Create User A
    db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)").run(
      1, "User A", "userA@test.com", "123456", UserRole.USER
    );
    tokenUserA = jwt.sign({ id: 1, email: "userA@test.com", role: UserRole.USER }, "segredo_super_seguranca");

    // Create User B
    db.prepare("INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)").run(
      2, "User B", "userB@test.com", "123456", UserRole.USER
    );
    tokenUserB = jwt.sign({ id: 2, email: "userB@test.com", role: UserRole.USER }, "segredo_super_seguranca");

    // User A creates a project
    const projectRes = await request(app)
      .post("/api/projects")
      .set("Cookie", [`token=${tokenUserA}`])
      .send({
        name: "Project Private User A",
        description: "Private stuff"
      });

    projectIdUserA = projectRes.body.id;

    // Validar que o projeto foi criado corretamente
    if (!projectIdUserA) {
      throw new Error("Project was not created properly");
    }
  });

  it("User B NÃO deve conseguir acessar projeto do User A (GET)", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectIdUserA}`)
      .set("Cookie", [`token=${tokenUserB}`]);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/permissão/i);
  });

  it("User B NÃO deve conseguir atualizar projeto do User A (PUT)", async () => {
    const res = await request(app)
      .put(`/api/projects/${projectIdUserA}`)
      .set("Cookie", [`token=${tokenUserB}`])
      .send({ description: "HACKED" });

    expect(res.status).toBe(403);
  });

  it("User B NÃO deve conseguir deletar projeto do User A (DELETE)", async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectIdUserA}`)
      .set("Cookie", [`token=${tokenUserB}`]);

    expect(res.status).toBe(403);
  });
});
