import { db } from "../database/db";
import { Task, TaskCreateDTO, TaskResponseDTO, TaskAssignee } from "../interfaces/task";
import { ReviewerRepository } from "./reviewer.repository";

export class TaskRepository {
  
  /**
   * Get assignees for a task
   */
  static getAssignees(taskId: number): TaskAssignee[] {
    return db.prepare(`
      SELECT ta.user_id, u.name as user_name, u.email as user_email
      FROM task_assignees ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.task_id = ?
    `).all(taskId) as TaskAssignee[];
  }

  /**
   * Get reviewers for a task
   */
  static getReviewers(taskId: number): TaskAssignee[] {
    return ReviewerRepository.getReviewers(taskId);
  }

  /**
   * Add assignee to a task
   */
  static addAssignee(taskId: number, userId: number): void {
    db.prepare(`
      INSERT OR IGNORE INTO task_assignees (task_id, user_id)
      VALUES (?, ?)
    `).run(taskId, userId);
  }

  /**
   * Remove assignee from a task
   */
  static removeAssignee(taskId: number, userId: number): void {
    db.prepare(`
      DELETE FROM task_assignees WHERE task_id = ? AND user_id = ?
    `).run(taskId, userId);
  }

  /**
   * Set assignees for a task (replaces all existing)
   */
  static setAssignees(taskId: number, userIds: number[]): void {
    db.prepare(`DELETE FROM task_assignees WHERE task_id = ?`).run(taskId);
    
    if (userIds.length > 0) {
      const stmt = db.prepare(`INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)`);
      userIds.forEach(userId => stmt.run(taskId, userId));
    }
  }

  /**
   * Check if user is assigned to a task
   */
  static isAssignee(taskId: number, userId: number): boolean {
    const result = db.prepare(`
      SELECT 1 FROM task_assignees WHERE task_id = ? AND user_id = ?
    `).get(taskId, userId);
    return !!result;
  }

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
    const task = db
      .prepare(
        `
            SELECT id, title, description, tip, priority, status, estimate, project_id
            FROM tasks
            WHERE id = ?
        `,
      )
      .get(id) as Task | undefined;
    
    if (task) {
      task.assignees = this.getAssignees(task.id);
      task.reviewers = this.getReviewers(task.id);
    }
    
    return task;
  }

  static findByProjectId(projectId: number): Task[] {
    const tasks = db
      .prepare(
        `
            SELECT id, title, description, tip, priority, status, estimate, project_id
            FROM tasks
            WHERE project_id = ?
        `,
      )
      .all(projectId) as Task[];
    
    // Add assignees and reviewers to each task
    return tasks.map(task => ({
      ...task,
      assignees: this.getAssignees(task.id),
      reviewers: this.getReviewers(task.id)
    }));
  }

  static findByUserId(userId: number): Task[] {
    const tasks = db
      .prepare(
        `
            SELECT t.id, t.title, t.description, t.tip, t.priority, t.status, t.estimate, t.project_id
            FROM tasks t
            INNER JOIN projects p ON t.project_id = p.id
            WHERE p.user_id = ?
        `,
      )
      .all(userId) as Task[];
    
    // Add assignees to each task
    return tasks.map(task => ({
      ...task,
      assignees: this.getAssignees(task.id)
    }));
  }

  static searchByUserIdAndKeyword(userId: number, keyword: string): Task[] {
    const searchTerm = `%${keyword}%`;
    return db
      .prepare(
        `
            SELECT t.id, t.title, t.description, t.tip, t.priority, t.status, t.estimate, t.project_id
            FROM tasks t
            INNER JOIN projects p ON t.project_id = p.id
            WHERE p.user_id = ? AND (t.title LIKE ? OR t.description LIKE ?)
        `,
      )
      .all(userId, searchTerm, searchTerm) as Task[];
  }
  static update(
    taskId: number,
    taskData: Partial<TaskCreateDTO>
  ): TaskResponseDTO {

    const result = db.prepare(`
    UPDATE tasks
    SET 
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      tip = COALESCE(?, tip),
      priority = COALESCE(?, priority),
      estimate = COALESCE(?, estimate)
    WHERE id = ?
  `).run(
      taskData.title ?? null,
      taskData.description ?? null,
      taskData.tip ?? null,
      taskData.priority ?? null,
      taskData.estimate ?? null,
      taskId
    );

    if (result.changes === 0) {
      throw new Error("Task não encontrada ou não atualizada");
    }

    const updatedTask = this.findById(taskId);

    if (!updatedTask) {
      throw new Error("Erro ao buscar task atualizada");
    }

    return updatedTask;
  }
  static updateStatus(
    taskId: number,
    status: string
  ): TaskResponseDTO {

    const result = db.prepare(`
    UPDATE tasks
    SET status = ?
    WHERE id = ?
  `).run(status, taskId);

    if (result.changes === 0) {
      throw new Error("Task não encontrada");
    }

    const updatedTask = this.findById(taskId);

    if (!updatedTask) {
      throw new Error("Erro ao buscar task atualizada");
    }

    return updatedTask;
  }

  static delete(taskId: number): void {

  const result = db.prepare(`
    DELETE FROM tasks
    WHERE id = ?
  `).run(taskId);

  if (result.changes === 0) {
    throw new Error("Task não encontrada");
  }
}

}