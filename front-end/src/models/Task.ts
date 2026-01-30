// Enums do develop (padrão do projeto)
export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  UNDER_REVIEW = "under_review",
}

// Interface com campos opcionais do HEAD (necessários para o Kanban)
export interface Task {
    id: number;
    title: string;
    description?: string; // Opcional (HEAD)
    tip?: string; // Opcional (HEAD) - Backend has tip
    priority: TaskPriority;
    status: TaskStatus;
    estimate?: number; // Opcional (HEAD)
    project_id: number;
}