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


export interface Task {
    id: number;
    title: string;
    description: string;
    tip: string;
    priority: TaskPriority;
    status: TaskStatus;
    estimate: number;
    project_id: number;
}