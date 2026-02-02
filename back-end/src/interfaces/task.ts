import { TaskPriority, TaskStatus } from "../enums/task.enums";

export interface TaskAssignee {
  user_id: number;
  user_name?: string;
  user_email?: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  tip?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimate?: number;
  project_id: number;
  assignees?: TaskAssignee[];
  reviewers?: TaskAssignee[];
}

export type TaskCreateDTO = Omit<Task, "id" | "assignees" | "reviewers">;

export type TaskResponseDTO = Task;
