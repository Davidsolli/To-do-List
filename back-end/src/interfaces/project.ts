export interface Project {
    id?: number;
    name: string;
    user_id: number;
    description: string;
}

export type ProjectCreateDto = Omit<Project, 'id'>;
