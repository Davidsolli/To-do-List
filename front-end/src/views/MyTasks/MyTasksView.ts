import { Component } from '../../core/Component';
import template from './MyTasksView.html';
import './MyTasksView.css';
import { TaskService, TaskResponse } from '../../services/TaskService';
import { ProjectService } from '../../services/ProjectService';
import { TaskPriority, TaskStatus } from '../../models/Task';
import { DateFormatter } from '../../utils/DateFormatter';
import { app } from '../../App';

interface Filters {
    search: string;
    project: string;
    priority: string;
    status: string;
    role: string;
}

interface SortConfig {
    by: 'estimate' | 'priority' | 'created' | 'title' | 'status';
    order: 'asc' | 'desc';
}

export class MyTasksView extends Component {
    private allTasks: TaskResponse[] = [];
    private filteredTasks: TaskResponse[] = [];
    private filters: Filters = {
        search: '',
        project: '',
        priority: '',
        status: '',
        role: ''
    };
    private sort: SortConfig = {
        by: 'estimate',
        order: 'asc'
    };

    getTemplate(): string {
        return template;
    }

    protected afterRender(): void {
        this.loadTasks();
        this.bindEvents();
    }

    private bindEvents(): void {
        const container = this.container.querySelector('.my-tasks-container');
        if (!container) return;

        // Filtros
        const searchInput = container.querySelector('#filter-search') as HTMLInputElement;
        const projectSelect = container.querySelector('#filter-project') as HTMLSelectElement;
        const prioritySelect = container.querySelector('#filter-priority') as HTMLSelectElement;
        const statusSelect = container.querySelector('#filter-status') as HTMLSelectElement;
        const roleSelect = container.querySelector('#filter-role') as HTMLSelectElement;
        const sortBySelect = container.querySelector('#sort-by') as HTMLSelectElement;
        const sortOrderSelect = container.querySelector('#sort-order') as HTMLSelectElement;

        // Event listeners para filtros
        searchInput?.addEventListener('input', (e) => {
            this.filters.search = (e.target as HTMLInputElement).value;
            this.applyFiltersAndSort();
        });

        projectSelect?.addEventListener('change', (e) => {
            this.filters.project = (e.target as HTMLSelectElement).value;
            this.applyFiltersAndSort();
        });

        prioritySelect?.addEventListener('change', (e) => {
            this.filters.priority = (e.target as HTMLSelectElement).value;
            this.applyFiltersAndSort();
        });

        statusSelect?.addEventListener('change', (e) => {
            this.filters.status = (e.target as HTMLSelectElement).value;
            this.applyFiltersAndSort();
        });

        roleSelect?.addEventListener('change', (e) => {
            this.filters.role = (e.target as HTMLSelectElement).value;
            this.applyFiltersAndSort();
        });

        sortBySelect?.addEventListener('change', (e) => {
            this.sort.by = (e.target as HTMLSelectElement).value as any;
            this.applyFiltersAndSort();
        });

        sortOrderSelect?.addEventListener('change', (e) => {
            this.sort.order = (e.target as HTMLSelectElement).value as 'asc' | 'desc';
            this.applyFiltersAndSort();
        });

        // Click em tarefa para navegar ao projeto
        container.addEventListener('click', (e) => {
            const taskItem = (e.target as HTMLElement).closest('.task-item');
            if (taskItem) {
                const projectId = taskItem.getAttribute('data-project-id');
                if (projectId) {
                    app.navigate(`/projetos/${projectId}`);
                }
            }
        });
    }

    private async loadTasks(): Promise<void> {
        const listContainer = this.container.querySelector('#tasks-list');
        if (!listContainer) return;

        try {
            const user = JSON.parse(localStorage.getItem('user_data') || '{}');
            const response: any = await TaskService.getUserTasks();

            // Extrair array de tarefas
            let tasks: TaskResponse[] = [];
            if (Array.isArray(response)) {
                tasks = response;
            } else if (response && Array.isArray(response.data)) {
                tasks = response.data;
            } else if (response && Array.isArray(response.tasks)) {
                tasks = response.tasks;
            }

            // Enriquecer com nomes de projetos
            this.allTasks = await this.enrichTasksWithProjectNames(tasks);

            // Carregar lista de projetos no filtro
            await this.populateProjectFilter();

            // Aplicar filtros e ordenação inicial
            this.applyFiltersAndSort();

        } catch (error) {
            console.error('Erro ao carregar tarefas:', error);
            listContainer.innerHTML = '<p class="form-error">Erro ao carregar tarefas.</p>';
        }
    }

    private async enrichTasksWithProjectNames(tasks: TaskResponse[]): Promise<TaskResponse[]> {
        try {
            const projects = await ProjectService.getUserProjects();
            const projectMap = new Map(projects.map(p => [p.id, p.name]));

            return tasks.map(task => ({
                ...task,
                project_name: task.project_id ? projectMap.get(task.project_id) : undefined
            }));
        } catch (error) {
            console.error('Erro ao buscar nomes dos projetos:', error);
            return tasks;
        }
    }

    private async populateProjectFilter(): Promise<void> {
        const projectSelect = this.container.querySelector('#filter-project') as HTMLSelectElement;
        if (!projectSelect) return;

        try {
            const projects = await ProjectService.getUserProjects();
            
            // Limpar e adicionar opção padrão
            projectSelect.innerHTML = '<option value="">Todos</option>';
            
            // Adicionar projetos
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id.toString();
                option.textContent = project.name;
                projectSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
        }
    }

    private applyFiltersAndSort(): void {
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        
        console.log('🔍 MyTasks - User ID:', user.id, 'Tipo:', typeof user.id);
        console.log('🔍 MyTasks - Total de tarefas:', this.allTasks.length);
        
        // Aplicar filtros
        this.filteredTasks = this.allTasks.filter(task => {
            // Filtro de busca
            if (this.filters.search && !task.title.toLowerCase().includes(this.filters.search.toLowerCase())) {
                return false;
            }

            // Filtro de projeto
            if (this.filters.project && task.project_id?.toString() !== this.filters.project) {
                return false;
            }

            // Filtro de prioridade
            if (this.filters.priority && task.priority !== this.filters.priority) {
                return false;
            }

            // Filtro de status
            if (this.filters.status && task.status !== this.filters.status) {
                return false;
            }

            // Filtro de papel
            if (this.filters.role) {
                const isAssignee = task.assignees?.some(a => {
                    const assigneeId = typeof a.user_id === 'string' ? parseInt(a.user_id) : a.user_id;
                    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
                    return assigneeId === userId;
                });
                const isReviewer = task.reviewers?.some(r => {
                    const reviewerId = typeof r.user_id === 'string' ? parseInt(r.user_id) : r.user_id;
                    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
                    return reviewerId === userId;
                });

                if (this.filters.role === 'assignee' && !isAssignee) {
                    return false;
                }
                if (this.filters.role === 'reviewer' && !isReviewer) {
                    return false;
                }
            }

            return true;
        });
        
        console.log('✅ MyTasks - Tarefas após filtro:', this.filteredTasks.length);

        // Aplicar ordenação
        this.filteredTasks.sort((a, b) => {
            let comparison = 0;

            switch (this.sort.by) {
                case 'estimate':
                    const dateA = a.estimate || Number.MAX_SAFE_INTEGER;
                    const dateB = b.estimate || Number.MAX_SAFE_INTEGER;
                    comparison = dateA - dateB;
                    break;

                case 'priority':
                    const priorityWeight: Record<string, number> = {
                        [TaskPriority.HIGH]: 3,
                        [TaskPriority.MEDIUM]: 2,
                        [TaskPriority.LOW]: 1
                    };
                    comparison = (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
                    break;

                case 'created':
                    const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
                    const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
                    comparison = createdA - createdB;
                    break;

                case 'title':
                    comparison = a.title.localeCompare(b.title);
                    break;

                case 'status':
                    comparison = (a.status || '').localeCompare(b.status || '');
                    break;
            }

            return this.sort.order === 'asc' ? comparison : -comparison;
        });

        this.renderTasks();
    }

    private renderTasks(): void {
        const listContainer = this.container.querySelector('#tasks-list');
        const countDisplay = this.container.querySelector('#task-count-display');
        
        if (!listContainer) return;

        // Atualizar contagem
        if (countDisplay) {
            countDisplay.textContent = `${this.filteredTasks.length} tarefa(s) encontrada(s)`;
        }

        // Renderizar tarefas
        if (this.filteredTasks.length === 0) {
            listContainer.innerHTML = '<div class="empty-state-msg">Nenhuma tarefa encontrada com os filtros aplicados.</div>';
            return;
        }

        const user = JSON.parse(localStorage.getItem('user_data') || '{}');

        listContainer.innerHTML = this.filteredTasks.map(task => {
            const isAssignee = task.assignees?.some(a => {
                const assigneeId = typeof a.user_id === 'string' ? parseInt(a.user_id) : a.user_id;
                const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
                return assigneeId === userId;
            });
            const isReviewer = task.reviewers?.some(r => {
                const reviewerId = typeof r.user_id === 'string' ? parseInt(r.user_id) : r.user_id;
                const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
                return reviewerId === userId;
            });

            const roleBadges = [];
            if (isAssignee) roleBadges.push('<span class="badge badge--assignee">Responsável</span>');
            if (isReviewer) roleBadges.push('<span class="badge badge--reviewer">Revisor</span>');

            return `
                <div class="task-item" data-project-id="${task.project_id}">
                    <div class="task-item-header">
                        <h3 class="task-item-title">${task.title}</h3>
                        <div class="task-item-badges">
                            ${this.getPriorityBadge(task.priority)}
                            ${this.getStatusBadge(task.status)}
                        </div>
                    </div>
                    <div class="task-item-body">
                        <div class="task-item-field">
                            <span class="task-item-label">Projeto</span>
                            <span class="task-item-value">${task.project_name || '-'}</span>
                        </div>
                        <div class="task-item-field">
                            <span class="task-item-label">Prazo</span>
                            <span class="task-item-value">${DateFormatter.formatDate(task.estimate)}</span>
                        </div>
                        <div class="task-item-field">
                            <span class="task-item-label">Meu Papel</span>
                            <span class="task-item-value">${roleBadges.join(' ')}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    private getPriorityBadge(priority: TaskPriority): string {
        const labels: Record<TaskPriority, string> = {
            [TaskPriority.HIGH]: 'Alta',
            [TaskPriority.MEDIUM]: 'Média',
            [TaskPriority.LOW]: 'Baixa'
        };

        const cssClasses: Record<TaskPriority, string> = {
            [TaskPriority.HIGH]: 'high',
            [TaskPriority.MEDIUM]: 'medium',
            [TaskPriority.LOW]: 'low'
        };

        const label = labels[priority] || 'Baixa';
        const cssClass = cssClasses[priority] || 'low';

        return `<span class="badge badge--${cssClass}">${label}</span>`;
    }

    private getStatusBadge(status: TaskStatus): string {
        const labels: Record<TaskStatus, string> = {
            [TaskStatus.PENDING]: 'Pendente',
            [TaskStatus.IN_PROGRESS]: 'Em Progresso',
            [TaskStatus.READY]: 'Pronto',
            [TaskStatus.COMPLETED]: 'Concluído',
            [TaskStatus.UNDER_REVIEW]: 'Em Revisão'
        };

        const cssClasses: Record<TaskStatus, string> = {
            [TaskStatus.PENDING]: 'pending',
            [TaskStatus.IN_PROGRESS]: 'doing',
            [TaskStatus.READY]: 'ready',
            [TaskStatus.COMPLETED]: 'done',
            [TaskStatus.UNDER_REVIEW]: 'doing'
        };

        const label = labels[status] || 'Pendente';
        const cssClass = cssClasses[status] || 'pending';

        return `<span class="badge badge--${cssClass}">${label}</span>`;
    }
}
