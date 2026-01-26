import { db } from "../database/db";
import { User } from "../interfaces/user";

export default class UserRepository {
  static findAll(): User[] {
    return db.prepare(`
      SELECT id, name, email, password
      FROM users
    `).all() as User[];
  }

  static findById(id: number): User | undefined {
    return db.prepare(`
      SELECT id, name, email, password
      FROM users
      WHERE id = ?
    `).get(id) as User | undefined;
  }

  static update(id: number, name: string, email: string): boolean {
    const result = db.prepare(`
      UPDATE users 
      SET name = ?, email = ? 
      WHERE id = ?
    `).run(name, email, id);

    return result.changes > 0;
  }
}
