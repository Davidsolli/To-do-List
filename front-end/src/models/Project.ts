import { Task } from './Task';

export interface Project {
    id: string;
    name: string;        // Alterado de 'title' para 'name'
    description: string;
    user_id: number;
    tasks?: Task[];
}