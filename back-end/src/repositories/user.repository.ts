import { db } from "../database/db";
import { User, UserResponseDTO } from "../interfaces/user";

export default class UserRepository {
  static findAll(): UserResponseDTO[] {
    return db.prepare(`
      SELECT id, name, email
      FROM users
    `).all() as UserResponseDTO[];
  }

  static findById(id: number): User | undefined {
    return db.prepare(`
      SELECT id, name, email
      FROM users
      WHERE id = ?
    `).get(id) as User | undefined;
  }

  static update(id: number, name: string, email: string, password: string): boolean {
    const result = db.prepare(`
      UPDATE users 
      SET name = ?, email = ?, password = ?
      WHERE id = ?
    `).run(name, email, password, id);

    return result.changes > 0;
  }

  static delete(id: number): boolean {
    const result = db.prepare(`
      DELETE FROM users 
      WHERE id = ?
    `).run(id);

    return result.changes > 0;
  }
}

