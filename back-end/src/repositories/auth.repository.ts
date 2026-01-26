import {db} from "../database/db";
import { User, UserCreateDto } from "../interfaces/user";

export class AuthRepository {
    static create(userData: UserCreateDto, hashedPassword: string) {
        const result = db.prepare(`INSERT INTO users (name, email, password)
      VALUES (?, ?, ?, datetime('now'))`).run(userData.name, userData.email, hashedPassword);
        if (result.changes === 0) {
            throw new Error('Falha ao inserir usuário no banco de dados');
        } 
        return result.lastInsertRowid as number;
    }
    static exists(email: string): boolean {
    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE email = ?
    `).get(email) as { count: number };

    return result.count > 0;
  }
  static findById(id: number): User | undefined {
    return db.prepare(`
      SELECT id, name, email, password, created_at
      FROM users
      WHERE id = ?
    `).get(id) as User | undefined;
  }
}
