import { db } from "../database/db";
import { User, UserResponseDTO, UserUpdateDTO } from "../interfaces/user";

export default class UserRepository {
  static findAll(): UserResponseDTO[] {
    return db
      .prepare(
        `
      SELECT id, name, email
      FROM users
    `,
      )
      .all() as UserResponseDTO[];
  }

  static findById(id: number): User | undefined {
    return db
      .prepare(
        `
      SELECT id, name, email
      FROM users
      WHERE id = ?
    `,
      )
      .get(id) as User | undefined;
  }

  static update(id: number, user: UserUpdateDTO): boolean {
    const fields: string[] = [];
    const values: any[] = [];

    if (user.name) {
      fields.push("name = ?");
      values.push(user.name);
    }

    if (user.email) {
      fields.push("email = ?");
      values.push(user.email);
    }
    
    if (user.password) {
      fields.push("password = ?");
      values.push(user.password);
    }

    if (fields.length === 0) return false;

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    const result = db.prepare(sql).run(...values);
    return result.changes > 0;
  }

  static delete(id: number): boolean {
    const result = db
      .prepare(
        `
      DELETE FROM users 
      WHERE id = ?
    `,
      )
      .run(id);

    return result.changes > 0;
  }
}
