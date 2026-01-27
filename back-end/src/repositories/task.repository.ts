import { db } from "../database/db";
import { Task, TaskCreateDTO } from "../interfaces/task";

export class TaskRepository {
  static create(taskData: TaskCreateDTO): Task {
    const result = db
      .prepare(
        `
        INSERT INTO tasks (title, description, tip, priority, status, estimate, project_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        taskData.title,
        taskData.description || null,
        taskData.tip || null,
        taskData.priority || null,
        taskData.status || null,
        taskData.estimate || null,
        taskData.project_id,
      );

    if (result.changes === 0) {
      throw new Error("Falha ao inserir tarefa no banco de dados");
    }

    const newTask = this.findById(result.lastInsertRowid as number);

    if (!newTask) {
      throw new Error("Erro ao buscar tarefa criada");
    }

    return newTask;
  }

  static findById(id: number): Task | undefined {
    return db
      .prepare(
        `
            SELECT id, title, description, tip, priority, status, estimate, project_id
            FROM tasks
            WHERE id = ?
        `,
      )
      .get(id) as Task | undefined;
  }

  static findByProjectId(projectId: number): Task[] {
    return db
      .prepare(
        `
            SELECT id, title, description, tip, priority, status, estimate, project_id
            FROM tasks
            WHERE project_id = ?
        `,
      )
      .all(projectId) as Task[];
  }
}
