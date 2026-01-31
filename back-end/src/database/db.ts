import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

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
`);

console.log("Tabelas criadas/validadas com sucesso!");

// Criar usuário admin apenas se configurado via variáveis de ambiente
const adminEmail = process.env.ADMIN_EMAIL;
const adminName = process.env.ADMIN_NAME;
const adminPassword = process.env.ADMIN_PASSWORD;

if (adminEmail && adminName && adminPassword) {
  const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ?").get(adminEmail);

  if (!existingAdmin) {
    // Fazer hash da senha
    const passwordHash = bcrypt.hashSync(adminPassword, 10);

    db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
      adminName,
      adminEmail,
      passwordHash,
      "admin"
    );

    console.log("✅ Usuário admin criado com sucesso!");
  } else {
    console.log("ℹ️ Usuário admin já existe.");
  }
} else {
  // Verifica se já existe pelo menos um usuário admin
  const anyAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();

  if (!anyAdmin) {
    console.warn("⚠️ AVISO: Nenhum usuário admin encontrado e variáveis de ambiente não configuradas.");
    console.warn("⚠️ Configure ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no .env");
  }
}
