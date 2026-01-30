import { Task } from './Task';

// Interface combinada: id como number (develop) + tasks opcionais (HEAD para Kanban)
export interface Project {
    id: number;
    name: string;
    user_id: number;
    description: string;
    tasks?: Task[]; // Campo adicional do HEAD usado no Kanban
}
