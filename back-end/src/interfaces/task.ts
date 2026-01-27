export interface Task {
    id: number;
    title: string;
    description?: string;
    tip?: string;
    priority?: string;
    status?: string;
    estimate?: number;
    project_id: number;
}

export type TaskCreateDto = Omit<Task, 'id'>;

export type TaskResponseDTO = Task;