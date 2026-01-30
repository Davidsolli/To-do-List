// Status compatíveis com o Backend
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'under_review';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
    id: number; // Backend uses number
    title: string;
    description?: string;
    tip?: string; // Backend has tip
    status: TaskStatus;
    priority: TaskPriority; // Backend expects usage of priority
    estimate?: number;
    project_id: number; // Backend uses project_id
    // helper fields for frontend only if needed, but best to stick to backend shape
}