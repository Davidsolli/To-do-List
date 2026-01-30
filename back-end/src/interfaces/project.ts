export interface Project {
    id?: number;
    name: string;
    user_id: number;
    description: string;
}

export type ProjectCreateDTO = Omit<Project, 'id'>;

export type ProjectUpdateDTO = Partial<Omit<Project, "id">>
