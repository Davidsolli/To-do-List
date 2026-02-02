import { Component } from '../../core/Component';
import template from './MyTasksView.html';
import './MyTasksView.css';
import { TaskService, TaskResponse } from '../../services/TaskService';
import { ProjectService } from '../../services/ProjectService';
import { TaskPriority, TaskStatus } from '../../models/Task';
import { DateFormatter } from '../../utils/DateFormatter';
import { app } from '../../App';
import { Input } from '../../components/Input/Input';
import { Select, SelectOption } from '../../components/Select/Select';

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
    private currentPage: number = 1;
    private totalPages: number = 1;
    private itemsPerPage: number = 20;
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

    // Componentes customizados
    private projectSelect?: Select;
    private prioritySelect?: Select;
    private statusSelect?: Select;
    private roleSelect?: Select;
    private sortBySelect?: Select;
    private sortOrderSelect?: Select;

    getTemplate(): string {
        return template;
    }

    protected afterRender(): void {
        this.renderFilters();
        this.loadTasks();
        this.bindEvents();
    }

    private renderFilters(): void {
        const container = this.container.querySelector('#filters-container');
        if (!container) return;

        // Input de busca
        const searchInput = new Input({
            id: 'filter-search',
            type: 'text',
            placeholder: 'Buscar por título...',
            icon: 'fa-solid fa-magnifying-glass'
        });

        // Select de projeto (será populado depois)
        this.projectSelect = new Select({
            name: 'filter-project',
            placeholder: 'Todos os projetos',
            options: [{ value: 'ALL', label: 'Todos', selected: true }],
            onChange: (value) => {
                this.filters.project = value;
                this.applyFiltersAndSort();
            }
        });

        // Select de prioridade
        this.prioritySelect = new Select({
            name: 'filter-priority',
            placeholder: 'Todas as prioridades',
            options: [
                { value: 'ALL', label: 'Todas', selected: true },
                { value: 'high', label: 'Alta' },
                { value: 'medium', label: 'Média' },
                { value: 'low', label: 'Baixa' }
            ],
            onChange: (value) => {
                this.filters.priority = value;
                this.applyFiltersAndSort();
            }
        });

        // Select de status
        this.statusSelect = new Select({
            name: 'filter-status',
            placeholder: 'Todos os status',
            options: [
                { value: 'ALL', label: 'Todos', selected: true },
                { value: 'pending', label: 'Pendente' },
                { value: 'in_progress', label: 'Em Progresso' },
                { value: 'ready', label: 'Pronto' },
                { value: 'under_review', label: 'Em Revisão' },
                { value: 'completed', label: 'Concluído' }
            ],
            onChange: (value) => {
                this.filters.status = value;
                this.applyFiltersAndSort();
            }
        });

        // Select de papel
        this.roleSelect = new Select({
            name: 'filter-role',
            placeholder: 'Todos os papéis',
            options: [
                { value: 'ALL', label: 'Todos', selected: true },
                { value: 'assignee', label: 'Responsável' },
                { value: 'reviewer', label: 'Revisor' }
            ],
            onChange: (value) => {
                this.filters.role = value;
                this.applyFiltersAndSort();
            }
        });

        // Select de ordenação
        this.sortBySelect = new Select({
            name: 'sort-by',
            placeholder: 'Ordenar por',
            options: [
                { value: 'estimate', label: 'Prazo', selected: true },
                { value: 'priority', label: 'Prioridade' },
                { value: 'title', label: 'Título' },
                { value: 'status', label: 'Status' }
            ],
            onChange: (value) => {
                this.sort.by = value as any;
                this.applyFiltersAndSort();
            }
        });

        // Select de ordem
        this.sortOrderSelect = new Select({
            name: 'sort-order',
            placeholder: 'Ordem',
            options: [
                { value: 'asc', label: 'Crescente', selected: true },
                { value: 'desc', label: 'Decrescente' }
            ],
            onChange: (value) => {
                this.sort.order = value as 'asc' | 'desc';
                this.applyFiltersAndSort();
            }
        });

        // Renderizar componentes
        container.innerHTML = `
            <div class="filters-row">
                <span class="row-label">Filtros</span>
                <div class="row-items">
                    <div class="filter-item">${searchInput.render()}</div>
                    <div class="filter-item" data-component="project-select">${this.projectSelect.render()}</div>
                    <div class="filter-item" data-component="priority-select">${this.prioritySelect.render()}</div>
                    <div class="filter-item" data-component="status-select">${this.statusSelect.render()}</div>
                    <div class="filter-item" data-component="role-select">${this.roleSelect.render()}</div>
                </div>
            </div>
            
            <div class="filters-row">
                <span class="row-label">Ordenação</span>
                <div class="row-items">
                    <div class="filter-item" data-component="sortby-select">${this.sortBySelect.render()}</div>
                    <div class="filter-item" data-component="sortorder-select">${this.sortOrderSelect.render()}</div>
                </div>
            </div>
        `;

        // Bind eventos dos componentes Select
        const projectSelectEl = container.querySelector('[data-component="project-select"] [data-select]') as HTMLElement;
        const prioritySelectEl = container.querySelector('[data-component="priority-select"] [data-select]') as HTMLElement;
        const statusSelectEl = container.querySelector('[data-component="status-select"] [data-select]') as HTMLElement;
        const roleSelectEl = container.querySelector('[data-component="role-select"] [data-select]') as HTMLElement;
        const sortBySelectEl = container.querySelector('[data-component="sortby-select"] [data-select]') as HTMLElement;
        const sortOrderSelectEl = container.querySelector('[data-component="sortorder-select"] [data-select]') as HTMLElement;

        if (projectSelectEl) this.projectSelect.bindEvents(projectSelectEl);
        if (prioritySelectEl) this.prioritySelect.bindEvents(prioritySelectEl);
        if (statusSelectEl) this.statusSelect.bindEvents(statusSelectEl);
        if (roleSelectEl) this.roleSelect.bindEvents(roleSelectEl);
        if (sortBySelectEl) this.sortBySelect.bindEvents(sortBySelectEl);
        if (sortOrderSelectEl) this.sortOrderSelect.bindEvents(sortOrderSelectEl);

        // Bind evento de busca no input
        const searchInputEl = container.querySelector('#filter-search') as HTMLInputElement;
        searchInputEl?.addEventListener('input', (e) => {
            this.filters.search = (e.target as HTMLInputElement).value;
            this.applyFiltersAndSort();
        });
    }

    private bindEvents(): void {
        const container = this.container.querySelector('.my-tasks-container');
        if (!container) return;

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

        // Initialize filters toggle (after elements exist)
        this.initFiltersToggle();

        // Pagination
        this.container.querySelector("#btn-prev-page")?.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderTasks();
                this.container.querySelector('.my-tasks-container')?.scrollIntoView({ behavior: 'smooth' });
            }
        });

        this.container.querySelector("#btn-next-page")?.addEventListener("click", () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.renderTasks();
                this.container.querySelector('.my-tasks-container')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Toggle filters collapse state and persist preference
    private initFiltersToggle(): void {
        const container = this.container.querySelector('.my-tasks-container');
        if (!container) return;

        const accordion = container.querySelector('#filters-accordion') as HTMLElement;
        const toggle = container.querySelector('#filters-toggle') as HTMLButtonElement;
        if (!accordion || !toggle) return;

        const STORAGE_KEY = 'mytasks_filters_collapsed';
        const collapsed = localStorage.getItem(STORAGE_KEY) === 'true';

        if (collapsed) {
            accordion.classList.add('collapsed');
            toggle.setAttribute('aria-expanded', 'false');
        }

        toggle.addEventListener('click', () => {
            const isCollapsed = accordion.classList.toggle('collapsed');
            toggle.setAttribute('aria-expanded', (!isCollapsed).toString());
            localStorage.setItem(STORAGE_KEY, isCollapsed.toString());
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
        if (!this.projectSelect) return;

        try {
            const projects = await ProjectService.getUserProjects();
            
            const options: SelectOption[] = [
                { value: 'ALL', label: 'Todos', selected: true },
                ...projects.map(project => ({
                    value: project.id.toString(),
                    label: project.name
                }))
            ];

            // Recriar o select com as novas opções
            this.projectSelect = new Select({
                name: 'filter-project',
                placeholder: 'Todos os projetos',
                options,
                onChange: (value) => {
                    this.filters.project = value;
                    this.applyFiltersAndSort();
                }
            });

            // Re-render do select de projetos
            const container = this.container.querySelector('[data-component="project-select"]');
            if (container) {
                container.innerHTML = this.projectSelect.render();
                const selectEl = container.querySelector('[data-select]') as HTMLElement;
                if (selectEl) {
                    this.projectSelect.bindEvents(selectEl);
                }
            }
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
            if (this.filters.project && this.filters.project !== 'ALL' && task.project_id?.toString() !== this.filters.project) {
                return false;
            }

            // Filtro de prioridade
            if (this.filters.priority && this.filters.priority !== 'ALL' && task.priority !== this.filters.priority) {
                return false;
            }

            // Filtro de status
            if (this.filters.status && this.filters.status !== 'ALL' && task.status !== this.filters.status) {
                return false;
            }

            // Filtro de papel
            if (this.filters.role && this.filters.role !== 'ALL') {
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

        this.currentPage = 1; // Reset para primeira página ao aplicar filtros
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

        // Renderizar tarefas com paginação
        if (this.filteredTasks.length === 0) {
            listContainer.innerHTML = '<div class="empty-state-msg">Nenhuma tarefa encontrada com os filtros aplicados.</div>';
            this.updatePagination();
            return;
        }

        // Calcular paginação
        this.totalPages = Math.ceil(this.filteredTasks.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedTasks = this.filteredTasks.slice(startIndex, endIndex);

        const user = JSON.parse(localStorage.getItem('user_data') || '{}');

        listContainer.innerHTML = paginatedTasks.map(task => {
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

        this.updatePagination();
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

    private updatePagination(): void {
        const pageInfo = this.container.querySelector('#page-info');
        const prevBtn = this.container.querySelector('#btn-prev-page') as HTMLButtonElement;
        const nextBtn = this.container.querySelector('#btn-next-page') as HTMLButtonElement;

        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    }
}
