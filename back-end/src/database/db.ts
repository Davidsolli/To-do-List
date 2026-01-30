import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = path.resolve(process.cwd(), "src/database/app.db");

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath);

console.log("Banco SQLite pronto:", dbPath);

// Habilitar foreign keys
db.pragma("foreign_keys = ON");

// Criar tabelas
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    tip TEXT,
    priority TEXT,
    status TEXT,
    estimate INTEGER,
    project_id INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
  );

  insert into users (name, email, password, role) values ('admin', 'admin@email.com', '$2b$10$KCb2a.p.D1.ZQ74944gdcekGfETuXSXd1HJUFxtEDpmsoMQ4YPFGu', 'admin');
`);

console.log("Tabelas criadas/validadas com sucesso!");
