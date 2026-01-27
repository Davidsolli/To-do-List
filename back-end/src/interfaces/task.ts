import { TaskPriority, TaskStatus } from "../enums/task.enums";

export interface Task {
  id: number;
  title: string;
  description?: string;
  tip?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  estimate?: number;
  project_id: number;
}

export type TaskCreateDTO = Omit<Task, "id">;

export type TaskResponseDTO = Task;
