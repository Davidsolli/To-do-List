import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/database/db";
import jwt from "jsonwebtoken";
import { UserRole } from "../../src/enums/userRoles.enums";

describe("Integração - Rotas de Tarefas (Security)", () => {
  let tokenUserA: string;
  let tokenUserB: string;
  let projectIdUserA: number;

  beforeAll(async () => {
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

    // User A creates a project (using endpoint to ensure real flow or db direct)
    // Let's use direct DB insert to save time/complexity and isolate task test? 
    // Or use endpoint to be sure user A owns it. Let's use endpoint.
    const projectRes = await request(app)
      .post("/api/projects")
      .set("Cookie", [`token=${tokenUserA}`])
      .send({
        name: "Project User A",
        description: "My Project"
      });
    
    projectIdUserA = projectRes.body.id;
  });

  it("User A deve conseguir criar task no seu proprio projeto", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Cookie", [`token=${tokenUserA}`])
      .send({
        title: "Task valida",
        project_id: projectIdUserA
      });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe("Task valida");
  });

  it("User B NÃO deve conseguir criar task no projeto do User A", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .set("Cookie", [`token=${tokenUserB}`])
      .send({
        title: "Task invasora",
        project_id: projectIdUserA
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("Você não tem permissão para criar tarefas neste projeto");
  });
});
