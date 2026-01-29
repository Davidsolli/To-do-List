export interface Task {
    id: number;
    title: string;
    project_name: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    status: 'Pendente' | 'Em andamento' | 'Concluída';
    due_date: string;
}