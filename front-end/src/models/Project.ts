import { Task } from './Task';
import { ProjectRole } from './Collaboration';

// Interface combinada: id como number (develop) + tasks opcionais (HEAD para Kanban)
export interface Project {
    id: number;
    name: string;
    user_id: number;
    description: string;
    tasks?: Task[]; // Campo adicional do HEAD usado no Kanban
    role?: ProjectRole; // Cargo do usuário no projeto
    taskStats?: {
        completed: number;
        total: number;
    };
}
