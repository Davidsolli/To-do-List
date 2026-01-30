import { Component } from '../../core/Component';
import { Project } from '../../models/Project';
import { Task, TaskStatus, TaskPriority } from '../../models/Task';
import { User } from '../../models/User';
import { ProjectService } from '../../services/ProjectService';
import { UserService } from '../../services/UserService';
import { TaskService } from '../../services/TaskService';
import { TaskCard } from '../../components/TaskCard/TaskCard';
import { Modal as ModalInstance } from '../../components/Modal/Modal';
import template from './KanbanView.html';
import './KanbanView.css';

// Adaptador para manter compatibilidade com API antiga do Modal
class ModalAdapter {
    private static instances: Map<string, ModalInstance> = new Map();

    constructor(private id: string, private title: string, private content: string) {}

    render(): string {
        return `
            <div class="modal-overlay-legacy" id="${this.id}" data-modal-id="${this.id}">
                <div class="modal-content-legacy" onclick="event.stopPropagation()">
                    <div class="modal-header-legacy">
                        <h2>${this.title}</h2>
                        <button class="modal-close" type="button" data-modal-close="${this.id}">&times;</button>
                    </div>
                    <div class="modal-body-legacy">
                        ${this.content}
                    </div>
                </div>
            </div>
        `;
    }

    static open(id: string): void {
        const overlay = document.querySelector(`[data-modal-id="${id}"]`);
        if (overlay) {
            (overlay as HTMLElement).style.display = 'flex';
            (overlay as HTMLElement).style.opacity = '1';
            (overlay as HTMLElement).style.pointerEvents = 'all';
        }
    }

    static close(id: string): void {
        const overlay = document.querySelector(`[data-modal-id="${id}"]`);
        if (overlay) {
            (overlay as HTMLElement).style.opacity = '0';
            (overlay as HTMLElement).style.pointerEvents = 'none';
            setTimeout(() => {
                (overlay as HTMLElement).style.display = 'none';
            }, 300);
        }
    }
}

const Modal = ModalAdapter;

export class KanbanView extends Component {
    private projectId: string | null = null;
    private project: Project | null = null;
    private projectOwner: User | null = null;
    private currentEditTaskId: number | null = null;
    private currentStatusForCreation: string = 'pending';
    private allTasks: Task[] = [];
    private filters = {
        search: '',
        priority: 'all'
    };

    getTemplate(): string {
        return template;
    }

    protected async afterRender(): Promise<void> {
        // 1. Get Project ID from URL
        const params = new URLSearchParams(window.location.search);
        this.projectId = params.get('id');

        // Debug Log
        console.log('[KanbanView] Init. ProjectID:', this.projectId);

        if (!this.projectId || this.projectId === 'undefined' || this.projectId === 'null') {
            (window as any).toast.error('Erro: ID do projeto inválido.');
            return;
        }

        // 2. Load Data
        await this.loadProjectData();

        // 3. Bind Events
        this.bindEvents();
    }

    private async loadProjectData() {
        if (!this.projectId) return;

        try {
            const data = await ProjectService.getById(this.projectId);
            this.project = data.project;

            // Render Header & Tasks
            this.renderHeader(data.project);
            this.allTasks = data.tasks;

            // 3. Fetch Owner
            try {
                this.projectOwner = await UserService.getById(data.project.user_id);
            } catch (err) {
                console.warn('Could not fetch project owner', err);
            }

            this.applyFilters();

        } catch (error: any) {
            console.error('Error loading project:', error);
            (window as any).toast.error('Erro ao carregar projeto.');
        }
    }

    private renderHeader(project: Project) {
        const titleEl = this.container.querySelector('#project-title');
        const descEl = this.container.querySelector('#project-desc');
        const iconEl = this.container.querySelector('#project-icon');

        if (titleEl) titleEl.textContent = project.name;
        if (descEl) descEl.textContent = project.description || 'Sem descrição';
        if (iconEl && project.name) iconEl.textContent = project.name.charAt(0).toUpperCase();
    }

    private applyFilters() {
        let filtered = [...this.allTasks];

        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(search) ||
                (t.description && t.description.toLowerCase().includes(search))
            );
        }

        if (this.filters.priority !== 'all') {
            filtered = filtered.filter(t => t.priority === this.filters.priority);
        }

        this.renderTasks(filtered);
    }

    private renderTasks(tasks: Task[]) {
        // Clear columns
        const cols = {
            pending: this.container.querySelector('#col-pending'),
            in_progress: this.container.querySelector('#col-in_progress'),
            under_review: this.container.querySelector('#col-under_review'),
            completed: this.container.querySelector('#col-completed')
        };

        const counts = {
            pending: this.container.querySelector('#count-pending'),
            in_progress: this.container.querySelector('#count-in_progress'),
            under_review: this.container.querySelector('#count-under_review'),
            completed: this.container.querySelector('#count-completed')
        };

        // Reset
        Object.values(cols).forEach(el => { if (el) el.innerHTML = ''; });
        let countMap: any = { pending: 0, in_progress: 0, under_review: 0, completed: 0 };

        // Render Cards
        tasks.forEach(task => {
            const card = new TaskCard(`task-${task.id}`, task);
            const el = card.getElement();

            // Events bubble up from Card
            el.addEventListener('edit-requested', (e: any) => this.openTaskModal(e.detail.task));
            el.addEventListener('delete-requested', (e: any) => this.openDeleteTaskModal(e.detail.task));
            el.addEventListener('details-requested', (e: any) => this.openTaskDetailModal(e.detail.task));

            if (cols[task.status as keyof typeof cols]) {
                cols[task.status as keyof typeof cols]?.appendChild(el);
                countMap[task.status]++;
            }
        });

        // Update Counts
        if (counts.pending) counts.pending.textContent = countMap.pending;
        if (counts.in_progress) counts.in_progress.textContent = countMap.in_progress;
        if (counts.under_review) counts.under_review.textContent = countMap.under_review;
        if (counts.completed) counts.completed.textContent = countMap.completed;

        // Add Dotted Button to each column for better UX (Mockup shows it in the last one at least)
        Object.keys(cols).forEach(status => {
            const colBody = cols[status as keyof typeof cols];
            if (colBody) {
                const addBtn = document.createElement('div');
                addBtn.className = 'add-task-placeholder';
                addBtn.innerHTML = '<span class="material-icons-outlined">add_circle_outline</span>';
                addBtn.addEventListener('click', () => this.openTaskModal(undefined, status));
                colBody.appendChild(addBtn);
            }
        });
    }

    private bindEvents() {
        this.container.querySelector('#btn-add-task')?.addEventListener('click', () => this.openTaskModal());
        this.container.querySelector('#btn-filter')?.addEventListener('click', () => this.openFilterModal());

        this.container.querySelector('#btn-edit-project')?.addEventListener('click', () => this.openEditProjectModal());
        this.container.querySelector('#btn-delete-project')?.addEventListener('click', () => this.openDeleteProjectModal());

        // Drag and Drop
        this.setupDragAndDrop();
    }

    private setupDragAndDrop() {
        const columns = this.container.querySelectorAll('.kanban-column');
        columns.forEach(col => {
            col.addEventListener('dragover', (e: any) => {
                e.preventDefault();
                col.classList.add('drag-over');
                e.dataTransfer.dropEffect = 'move';
            });

            col.addEventListener('dragleave', () => col.classList.remove('drag-over'));

            col.addEventListener('drop', async (e: any) => {
                e.preventDefault();
                col.classList.remove('drag-over');
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = (col as HTMLElement).dataset.status;

                if (taskId && newStatus) {
                    await this.handleTaskMove(taskId, newStatus);
                }
            });
        });
    }

    private async handleTaskMove(taskId: string, status: string) {
        try {
            await TaskService.updateStatus(taskId, status);

            // Track move time locally
            localStorage.setItem(`task_move_${taskId}`, String(Date.now()));

            (window as any).toast.success('Tarefa movida!');
            this.loadProjectData(); // Reload to sync
        } catch (error) {
            console.error(error);
            (window as any).toast.error('Erro ao mover tarefa.');
        }
    }

    private openTaskModal(task?: Task, initialStatus: string = 'pending') {
        this.currentEditTaskId = task ? task.id : null;
        this.currentStatusForCreation = initialStatus;
        const isEdit = !!task;

        // Convert timestamp (estimate) to YYYY-MM-DD for date input if exists
        let dateValue = '';
        if (task && task.estimate) {
            const date = new Date(task.estimate);
            if (!isNaN(date.getTime())) {
                // Use local date components to avoid timezone shifts
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;
            }
        }

        // Form HTML
        const formHtml = `
            <form id="task-form" class="task-form">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" name="title" value="${task?.title || ''}" required class="form-control">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea name="description" class="form-control" rows="3">${task?.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Prioridade</label>
                        <select name="priority" class="form-control">
                            <option value="low" ${task?.priority === 'low' ? 'selected' : ''}>Baixa</option>
                            <option value="medium" ${task?.priority === 'medium' ? 'selected' : (!task ? 'selected' : '')}>Média</option>
                            <option value="high" ${task?.priority === 'high' ? 'selected' : ''}>Alta</option>
                        </select>
                    </div>
                     <div class="form-group">
                        <label>Data de Conclusão</label>
                        <input type="date" name="estimate" value="${dateValue}" class="form-control">
                    </div>
                </div>
                <div class="form-actions" style="margin-top: 1rem; text-align: right;">
                     <button type="button" class="btn btn--secondary" id="cancel-task">Cancelar</button>
                     <button type="submit" class="btn btn--primary">${isEdit ? 'Salvar' : 'Criar'}</button>
                </div>
            </form>
        `;

        this.showModal('task-modal', isEdit ? 'Editar Tarefa' : 'Nova Tarefa', formHtml, (container) => {
            const form = container.querySelector('#task-form') as HTMLFormElement;
            form.addEventListener('submit', (e) => this.handleSaveTask(e));
            container.querySelector('#cancel-task')?.addEventListener('click', () => Modal.close('task-modal'));
        });
    }

    private async handleSaveTask(e: Event) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        // Convert date string to timestamp (int)
        const dateStr = formData.get('estimate') as string;
        let timestamp: number | undefined = undefined;
        if (dateStr) {
            // Parse local components to avoid UTC shift
            const [year, month, day] = dateStr.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day, 12, 0, 0);
            if (!isNaN(dateObj.getTime())) {
                timestamp = dateObj.getTime();
            }
        }

        const data = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            priority: formData.get('priority') as any,
            estimate: timestamp,
            project_id: Number(this.projectId)
        };

        try {
            if (this.currentEditTaskId) {
                await TaskService.update(String(this.currentEditTaskId), data);
                (window as any).toast.success('Tarefa atualizada!');
            } else {
                await TaskService.create({ ...data, status: this.currentStatusForCreation as any });
                (window as any).toast.success('Tarefa criada!');
            }
            Modal.close('task-modal');
            this.loadProjectData();
        } catch (error) {
            console.error(error);
            (window as any).toast.error('Erro ao salvar.');
        }
    }

    private openEditProjectModal() {
        if (!this.project) return;

        const formHtml = `
            <form id="edit-project-form" class="task-form">
                <div class="form-group">
                    <label>Nome do Projeto</label>
                    <input type="text" name="name" value="${this.project.name}" required class="form-control">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea name="description" class="form-control" rows="3">${this.project.description || ''}</textarea>
                </div>
                <div class="form-actions" style="margin-top: 1rem; text-align: right;">
                     <button type="button" class="btn btn--secondary" id="cancel-edit-project">Cancelar</button>
                     <button type="submit" class="btn btn--primary">Salvar Alterações</button>
                </div>
            </form>
        `;

        this.showModal('project-modal', 'Editar Projeto', formHtml, (container) => {
            const form = container.querySelector('#edit-project-form') as HTMLFormElement;
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = {
                    name: formData.get('name') as string,
                    description: formData.get('description') as string
                };

                try {
                    await ProjectService.update(String(this.project!.id), data);
                    (window as any).toast.success('Projeto atualizado!');
                    Modal.close('project-modal');
                    this.loadProjectData();
                } catch (err) {
                    (window as any).toast.error('Erro ao atualizar projeto.');
                }
            });
            container.querySelector('#cancel-edit-project')?.addEventListener('click', () => Modal.close('project-modal'));
        });
    }

    private openDeleteProjectModal() {
        if (!this.project) return;

        const contentHtml = `
            <p>Tem certeza que deseja excluir o projeto <strong>"${this.project.name}"</strong>? Esta ação não pode ser desfeita.</p>
            <div class="form-actions" style="margin-top: 1.5rem; text-align: right;">
                <button type="button" class="btn btn--secondary" id="cancel-delete-project">Cancelar</button>
                <button type="button" class="btn btn--danger" id="confirm-delete-project">Excluir Projeto</button>
            </div>
        `;

        this.showModal('delete-project-modal', 'Excluir Projeto', contentHtml, (container) => {
            container.querySelector('#cancel-delete-project')?.addEventListener('click', () => Modal.close('delete-project-modal'));
            container.querySelector('#confirm-delete-project')?.addEventListener('click', async () => {
                try {
                    await ProjectService.delete(String(this.project!.id));
                    (window as any).toast.success('Projeto excluído.');
                    Modal.close('delete-project-modal');
                    (window as any).app.navigate('/projects');
                } catch (err) {
                    (window as any).toast.error('Erro ao excluir projeto.');
                }
            });
        });
    }

    private openDeleteTaskModal(task: Task) {
        const contentHtml = `
            <p>Tem certeza que deseja excluir a tarefa <strong>"${task.title}"</strong>?</p>
            <div class="form-actions" style="margin-top: 1.5rem; text-align: right;">
                <button type="button" class="btn btn--secondary" id="cancel-delete-task">Cancelar</button>
                <button type="button" class="btn btn--danger" id="confirm-delete-task">Excluir Tarefa</button>
            </div>
        `;

        this.showModal('delete-task-modal', 'Excluir Tarefa', contentHtml, (container) => {
            container.querySelector('#cancel-delete-task')?.addEventListener('click', () => Modal.close('delete-task-modal'));
            container.querySelector('#confirm-delete-task')?.addEventListener('click', async () => {
                try {
                    await TaskService.delete(String(task.id));
                    (window as any).toast.success('Tarefa excluída.');
                    Modal.close('delete-task-modal');
                    this.loadProjectData();
                } catch (err) {
                    (window as any).toast.error('Erro ao excluir tarefa.');
                }
            });
        });
    }

    private openFilterModal() {
        const formHtml = `
            <form id="filter-form" class="task-form">
                <div class="form-group">
                    <label>Buscar por título ou descrição</label>
                    <input type="text" name="search" value="${this.filters.search}" class="form-control" placeholder="Digite para buscar...">
                </div>
                <div class="form-group">
                    <label>Prioridade</label>
                    <select name="priority" class="form-control">
                        <option value="all" ${this.filters.priority === 'all' ? 'selected' : ''}>Todas</option>
                        <option value="low" ${this.filters.priority === 'low' ? 'selected' : ''}>Baixa</option>
                        <option value="medium" ${this.filters.priority === 'medium' ? 'selected' : ''}>Média</option>
                        <option value="high" ${this.filters.priority === 'high' ? 'selected' : ''}>Alta</option>
                    </select>
                </div>
                <div class="form-actions" style="margin-top: 1rem; text-align: right;">
                     <button type="button" class="btn btn--secondary" id="clear-filters">Limpar Filtros</button>
                     <button type="submit" class="btn btn--primary">Aplicar Filtros</button>
                </div>
            </form>
        `;

        this.showModal('filter-modal', 'Filtrar Tarefas', formHtml, (container) => {
            const form = container.querySelector('#filter-form') as HTMLFormElement;
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                this.filters.search = formData.get('search') as string;
                this.filters.priority = formData.get('priority') as string;
                this.applyFilters();
                Modal.close('filter-modal');
            });

            container.querySelector('#clear-filters')?.addEventListener('click', () => {
                this.filters.search = '';
                this.filters.priority = 'all';
                this.applyFilters();
                Modal.close('filter-modal');
            });
        });
    }

    private openTaskDetailModal(task: Task) {
        const priorityLabels: Record<string, { label: string, color: string }> = {
            low: { label: 'Baixa Prioridade', color: '#dcfce7' },
            medium: { label: 'Média Prioridade', color: '#fef9c3' },
            high: { label: 'Alta Prioridade', color: '#fee2e2' }
        };

        const statusLabels: Record<string, string> = {
            pending: 'Pendente',
            in_progress: 'Em Progresso',
            under_review: 'Revisão',
            completed: 'Concluído'
        };

        const deadline = task.estimate ? new Date(task.estimate).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Sem prazo';
        const priorityInfo = priorityLabels[task.priority] || priorityLabels.medium;
        const owner = this.projectOwner || { name: 'Administrador', role: 'admin' };

        // Calculate move time
        const moveTime = localStorage.getItem(`task_move_${task.id}`);
        let timeDisplay = 'agora mesmo';
        if (moveTime) {
            const diffMs = Date.now() - Number(moveTime);
            const diffMin = Math.floor(diffMs / 60000);
            const diffHrs = Math.floor(diffMin / 60);
            const diffDays = Math.floor(diffHrs / 24);

            if (diffDays > 0) timeDisplay = `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
            else if (diffHrs > 0) timeDisplay = `há ${diffHrs} ${diffHrs === 1 ? 'hora' : 'horas'}`;
            else if (diffMin > 0) timeDisplay = `há ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
            else timeDisplay = 'há poucos segundos';
        }

        const detailHtml = `
            <div class="task-detail">
                <div class="task-detail-breadcrumb">Kanban Board / Detalhes da Tarefa</div>
                
                <div class="task-detail-header">
                    <div class="task-detail-header-info">
                        <h1>${task.title}</h1>
                        <p class="task-detail-meta"><span class="material-icons-outlined">calendar_today</span> Prazo: ${deadline}</p>
                    </div>
                    <div class="task-detail-header-actions">
                        <button class="btn btn--edit-task" id="detail-edit-btn">
                            <span class="material-icons-outlined">edit</span> Editar Tarefa
                        </button>
                        <button class="btn btn--delete-task-outline" id="detail-delete-btn">
                            <span class="material-icons-outlined">delete_outline</span> Excluir
                        </button>
                    </div>
                </div>

                <div class="task-detail-grid">
                    <div class="task-detail-section">
                        <label>CLASSIFICAÇÃO</label>
                        <div class="task-detail-badges">
                            <span class="badge badge--priority" style="background: ${priorityInfo.color}">${priorityInfo.label}</span>
                            <span class="badge badge--status">${statusLabels[task.status]}</span>
                        </div>
                    </div>
                    <div class="task-detail-section">
                        <label>ADMINISTRADOR</label>
                        <div class="task-detail-assignee">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(owner.name)}&background=00ed64&color=001e2b" alt="Avatar" class="assignee-avatar">
                            <div class="assignee-info">
                                <strong>${owner.name}</strong>
                                <span>${owner.role === 'admin' ? 'Administrador' : 'Usuário Responsável'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="task-detail-section description-section">
                    <div class="section-header">
                        <span class="material-icons-outlined">subject</span>
                        <label>DESCRIÇÃO</label>
                    </div>
                    <div class="description-content">
                        ${task.description || 'Nenhuma descrição fornecida.'}
                    </div>
                </div>

                <div class="task-detail-section activity-section">
                    <div class="section-header">
                        <span class="material-icons-outlined">history</span>
                        <label>HISTÓRICO</label>
                    </div>
                    <div class="activity-timeline">
                        <div class="timeline-item">
                            <div class="timeline-icon status-change"><span class="material-icons-outlined">history</span></div>
                            <div class="timeline-content">
                                <strong>${owner.name}</strong> alterou o status para <span class="badge badge--mini">${statusLabels[task.status]}</span>
                                <span class="timeline-time">${timeDisplay}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.showLargeModal('task-detail-modal', '', detailHtml, (container) => {
            container.querySelector('#detail-edit-btn')?.addEventListener('click', () => {
                Modal.close('task-detail-modal');
                this.openTaskModal(task);
            });
            container.querySelector('#detail-delete-btn')?.addEventListener('click', () => {
                Modal.close('task-detail-modal');
                this.openDeleteTaskModal(task);
            });
        });
    }

    private showLargeModal(id: string, title: string, content: string, bindFn: (container: HTMLElement) => void) {
        let modalContainer = document.getElementById(`${id}-container`);
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = `${id}-container`;
            modalContainer.className = 'large-modal-wrapper';
            this.container.appendChild(modalContainer);
        }

        const modal = new Modal(id, title, content);
        modalContainer.innerHTML = modal.render();

        bindFn(modalContainer);

        const close = () => Modal.close(id);
        modalContainer.querySelector('.modal-close')?.addEventListener('click', close);
        modalContainer.querySelector('.modal-overlay')?.addEventListener('click', close);

        // Hide standard modal header if title is empty
        if (!title) {
            const header = modalContainer.querySelector('.modal-header') as HTMLElement;
            if (header) header.style.display = 'none';
        }

        Modal.open(id);
    }

    private showModal(id: string, title: string, content: string, bindFn: (container: HTMLElement) => void) {
        let modalContainer = document.getElementById(`${id}-container`);
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = `${id}-container`;
            this.container.appendChild(modalContainer);
        }

        const modal = new Modal(id, title, content);
        modalContainer.innerHTML = modal.render();

        bindFn(modalContainer);

        // Standard close buttons
        const close = () => Modal.close(id);
        modalContainer.querySelector('.modal-close')?.addEventListener('click', close);
        modalContainer.querySelector('.modal-overlay')?.addEventListener('click', close);

        Modal.open(id);
    }

    private async handleEditProject() {
        this.openEditProjectModal();
    }

    private async handleDeleteProject() {
        this.openDeleteProjectModal();
    }
}