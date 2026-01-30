import { Component } from '../../core/Component';
import { Project } from '../../models/Project';
import { Task } from '../../models/Task';
import { User } from '../../models/User';
import { ProjectService } from '../../services/ProjectService';
import { UserService } from '../../services/UserService';
import { TaskService } from '../../services/TaskService';
import { TaskCard } from '../../components/TaskCard/TaskCard';
import { Modal } from '../../components/Modal/Modal';
import { Button } from '../../components/Button/Button';
import { Select } from '../../components/Select/Select';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { ProjectModal } from '../../components/ProjectModal/ProjectModal';
import { app } from '../../App';
import template from './ProjectDetailsView.html';
import './ProjectDetailsView.css';

export class ProjectDetailsView extends Component {
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

    // Construtor recebe parâmetros da rota
    constructor(containerId: string, params?: Record<string, string>) {
        super(containerId);
        // Extrai o ID do projeto dos parâmetros da rota
        if (params && params.id) {
            this.projectId = params.id;
        }
    }

    getTemplate(): string {
        const btnFilter = new Button({
            text: 'Filtrar',
            variant: 'ghost',
            action: 'btn-filter',
            icon: 'fa-solid fa-filter'
        });

        const btnAddTask = new Button({
            text: 'Nova Tarefa',
            variant: 'primary',
            action: 'btn-add-task',
            icon: 'fa-solid fa-plus'
        });

        const btnEditProject = new Button({
            text: '',
            variant: 'ghost-icon',
            action: 'btn-edit-project',
            icon: 'fa-solid fa-pen',
            title: 'Editar Projeto'
        });

        const btnDeleteProject = new Button({
            text: '',
            variant: 'danger-icon',
            action: 'btn-delete-project',
            icon: 'fa-solid fa-trash',
            title: 'Excluir Projeto'
        });

        return template
            .replace('{{btn_filter}}', btnFilter.render())
            .replace('{{btn_add_task}}', btnAddTask.render())
            .replace('{{btn_edit_project}}', btnEditProject.render())
            .replace('{{btn_delete_project}}', btnDeleteProject.render());
    }

    protected async afterRender(): Promise<void> {
        // Debug Log
        console.log('[ProjectDetailsView] Init. ProjectID:', this.projectId);

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

        // Add Dotted Button to each column for better UX
        Object.keys(cols).forEach(status => {
            const colBody = cols[status as keyof typeof cols];
            if (colBody) {
                const addBtn = document.createElement('div');
                addBtn.className = 'add-task-placeholder';
                addBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
                addBtn.addEventListener('click', () => this.openTaskModal(undefined, status));
                colBody.appendChild(addBtn);
            }
        });
    }

    private bindEvents() {
        const view = this.container.querySelector('.project-details-container');
        if (!view) return;

        view.querySelector('[data-action="btn-add-task"]')?.addEventListener('click', () => this.openTaskModal());
        view.querySelector('[data-action="btn-filter"]')?.addEventListener('click', () => this.openFilterModal());
        view.querySelector('[data-action="btn-edit-project"]')?.addEventListener('click', () => this.openEditProjectModal());
        view.querySelector('[data-action="btn-delete-project"]')?.addEventListener('click', () => this.openDeleteProjectModal());

        // Drag and Drop
        this.setupDragAndDrop(view as HTMLElement);
    }

    private setupDragAndDrop(view: HTMLElement) {
        const columns = view.querySelectorAll('.kanban-column');
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
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                dateValue = `${year}-${month}-${day}`;
            }
        }

        // Create buttons using Button component
        const btnCancel = new Button({
            text: 'Cancelar',
            variant: 'outline',
            type: 'button',
            action: 'cancel-task'
        });

        const btnSubmit = new Button({
            text: isEdit ? 'Salvar' : 'Criar',
            variant: 'primary',
            type: 'submit'
        });

        const prioritySelect = new Select({
            name: 'priority',
            options: [
                { value: 'low', label: 'Baixa', selected: task?.priority === 'low' },
                { value: 'medium', label: 'Média', selected: task?.priority === 'medium' || !task },
                { value: 'high', label: 'Alta', selected: task?.priority === 'high' }
            ]
        });

        // Form HTML
        const formHtml = `
            <form id="task-form" class="form">
                <div class="form-group">
                    <label>Título</label>
                    <input type="text" name="title" value="${task?.title || ''}" required class="form-input">
                </div>
                <div class="form-group">
                    <label>Descrição</label>
                    <textarea name="description" class="form-input" rows="3">${task?.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Prioridade</label>
                        ${prioritySelect.render()}
                    </div>
                     <div class="form-group">
                        <label>Data de Conclusão</label>
                        <div class="input-with-icon">
                            <input type="date" name="estimate" value="${dateValue}" class="form-input">
                            <i class="fa-solid fa-calendar"></i>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                     ${btnCancel.render()}
                     ${btnSubmit.render()}
                </div>
            </form>
        `;

        const modal = new Modal({
            title: isEdit ? 'Editar Tarefa' : 'Nova Tarefa',
            content: formHtml,
            onClose: () => { }
        });

        modal.open();

        const modalEl = modal.getElement();
        if (modalEl) {
            // Bind select events
            const selectEl = modalEl.querySelector('[data-name="priority"]');
            if (selectEl) {
                prioritySelect.bindEvents(selectEl as HTMLElement);
            }

            const form = modalEl.querySelector('#task-form') as HTMLFormElement;
            form.addEventListener('submit', (e) => {
                this.handleSaveTask(e, prioritySelect);
                modal.close();
            });
            modalEl.querySelector('[data-action="cancel-task"]')?.addEventListener('click', () => modal.close());
        }
    }

    private async handleSaveTask(e: Event, prioritySelect: Select) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);

        // Convert date string to timestamp (int)
        const dateStr = formData.get('estimate') as string;
        let timestamp: number | undefined = undefined;
        if (dateStr) {
            const [year, month, day] = dateStr.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day, 12, 0, 0);
            if (!isNaN(dateObj.getTime())) {
                timestamp = dateObj.getTime();
            }
        }

        const data = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            priority: prioritySelect.getValue() as any,
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
            this.loadProjectData();
        } catch (error) {
            console.error(error);
            (window as any).toast.error('Erro ao salvar.');
        }
    }

    private openEditProjectModal() {
        if (!this.project) return;

        const modal = new ProjectModal({
            mode: 'edit',
            projectId: this.project.id,
            onSuccess: () => {
                this.loadProjectData();
                app.sidebar?.refreshProjectsList();
            }
        });

        modal.show();
    }

    private openDeleteProjectModal() {
        if (!this.project) return;

        const dialog = new ConfirmDialog({
            title: 'Excluir Projeto',
            message: `Tem certeza que deseja excluir o projeto "${this.project.name}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    await ProjectService.deleteProject(this.project!.id);
                    (window as any).toast.success('Projeto excluído.');
                    app.navigate('/projetos');
                } catch (err) {
                    (window as any).toast.error('Erro ao excluir projeto.');
                }
            }
        });

        dialog.show();
    }

    private openDeleteTaskModal(task: Task) {
        const dialog = new ConfirmDialog({
            title: 'Excluir Tarefa',
            message: `Tem certeza que deseja excluir a tarefa "${task.title}"?`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    await TaskService.delete(String(task.id));
                    (window as any).toast.success('Tarefa excluída.');
                    this.loadProjectData();
                } catch (err) {
                    (window as any).toast.error('Erro ao excluir tarefa.');
                }
            }
        });

        dialog.show();
    }

    private openFilterModal() {
        // Create buttons using Button component
        const btnClear = new Button({
            text: 'Limpar Filtros',
            variant: 'outline',
            type: 'button',
            action: 'clear-filters'
        });

        const btnApply = new Button({
            text: 'Aplicar Filtros',
            variant: 'primary',
            type: 'submit'
        });

        const prioritySelect = new Select({
            name: 'priority',
            options: [
                { value: 'all', label: 'Todas', selected: this.filters.priority === 'all' },
                { value: 'low', label: 'Baixa', selected: this.filters.priority === 'low' },
                { value: 'medium', label: 'Média', selected: this.filters.priority === 'medium' },
                { value: 'high', label: 'Alta', selected: this.filters.priority === 'high' }
            ]
        });

        const formHtml = `
            <form id="filter-form" class="form">
                <div class="form-group">
                    <label>Buscar por título ou descrição</label>
                    <input type="text" name="search" value="${this.filters.search}" class="form-input" placeholder="Digite para buscar...">
                </div>
                <div class="form-group">
                    <label>Prioridade</label>
                    ${prioritySelect.render()}
                </div>
                <div class="form-actions">
                     ${btnClear.render()}
                     ${btnApply.render()}
                </div>
            </form>
        `;

        const modal = new Modal({
            title: 'Filtrar Tarefas',
            content: formHtml,
            onClose: () => { }
        });

        modal.open();

        const modalEl = modal.getElement();
        if (modalEl) {
            // Bind select events
            const selectEl = modalEl.querySelector('[data-name="priority"]');
            if (selectEl) {
                prioritySelect.bindEvents(selectEl as HTMLElement);
            }

            const form = modalEl.querySelector('#filter-form') as HTMLFormElement;
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                this.filters.search = formData.get('search') as string;
                this.filters.priority = prioritySelect.getValue();
                this.applyFilters();
                modal.close();
            });

            modalEl.querySelector('[data-action="clear-filters"]')?.addEventListener('click', () => {
                this.filters.search = '';
                this.filters.priority = 'all';
                this.applyFilters();
                modal.close();
            });
        }
    }

    private openTaskDetailModal(task: Task) {
        // Format deadline
        const deadline = task.estimate ? new Date(task.estimate).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }) : null;

        // Priority labels
        const priorityLabels: Record<string, string> = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta'
        };

        // Status labels (usando os mesmos do DashboardView)
        const statusLabels: Record<string, string> = {
            'pending': 'Pendente',
            'in_progress': 'Em Andamento',
            'under_review': 'Em Revisão',
            'completed': 'Concluído'
        };

        const statusClasses: Record<string, string> = {
            'pending': 'pending',
            'in_progress': 'doing',
            'under_review': 'review',
            'completed': 'done'
        };

        const priorityLabel = priorityLabels[task.priority] || task.priority;
        const statusLabel = statusLabels[task.status] || task.status;
        const statusClass = statusClasses[task.status] || 'pending';

        // Create buttons
        const btnEdit = new Button({
            text: 'Editar Tarefa',
            variant: 'primary',
            type: 'button',
            action: 'detail-edit-btn',
            icon: 'fa-solid fa-pen'
        });

        const btnDelete = new Button({
            text: 'Excluir',
            variant: 'danger',
            type: 'button',
            action: 'detail-delete-btn',
            icon: 'fa-solid fa-trash'
        });

        const detailHtml = `
            <div class="task-detail-view">
                <div class="task-detail-header">
                    <h2 class="task-detail-title">${task.title}</h2>
                    <div class="task-detail-meta">
                        <div class="task-detail-badges">
                            <span class="badge badge--${task.priority}">
                                ${priorityLabel}
                            </span>
                            <span class="badge badge--${statusClass}">
                                ${statusLabel}
                            </span>
                        </div>
                        ${deadline ? `
                            <div class="task-deadline">
                                <i class="fa-solid fa-calendar"></i>
                                <span>${deadline}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div class="task-detail-body">
                    <div class="task-detail-section">
                        <div class="section-label">
                            <i class="fa-solid fa-align-left"></i>
                            <span>Descrição</span>
                        </div>
                        <div class="section-content">
                            ${task.description || '<em class="text-muted">Nenhuma descrição fornecida</em>'}
                        </div>
                    </div>

                    <div class="task-detail-section">
                        <div class="section-label">
                            <i class="fa-solid fa-lightbulb"></i>
                            <span>Dica da IA</span>
                        </div>
                        <div class="ai-tip-container">
                            <div class="ai-tip-content" id="ai-tip-content">
                                ${task.tip ? `<p>${task.tip}</p>` : '<p class="text-muted loading-tip"><i class="fa-solid fa-circle-notch fa-spin"></i> Gerando dica...</p>'}
                            </div>
                            <button class="btn-regenerate-tip" id="btn-regenerate-tip" ${!task.tip ? 'disabled' : ''}>
                                <i class="fa-solid fa-rotate"></i>
                                Regenerar
                            </button>
                        </div>
                    </div>
                </div>

                <div class="task-detail-footer">
                    ${btnEdit.render()}
                    ${btnDelete.render()}
                </div>
            </div>
        `;

        const modal = new Modal({
            title: 'Detalhes da Tarefa',
            content: detailHtml,
            onClose: () => { }
        });

        modal.open();

        const modalEl = modal.getElement();
        if (modalEl) {
            // Edit button
            modalEl.querySelector('[data-action="detail-edit-btn"]')?.addEventListener('click', () => {
                modal.close();
                this.openTaskModal(task);
            });

            // Delete button
            modalEl.querySelector('[data-action="detail-delete-btn"]')?.addEventListener('click', () => {
                modal.close();
                this.openDeleteTaskModal(task);
            });

            // Generate tip if null
            if (!task.tip) {
                this.generateAndDisplayTip(task.id, modalEl, false);
            }

            // Regenerate tip button
            const btnRegenerate = modalEl.querySelector('#btn-regenerate-tip');
            btnRegenerate?.addEventListener('click', () => {
                this.generateAndDisplayTip(task.id, modalEl, true);
            });
        }
    }

    private async generateAndDisplayTip(taskId: number, modalEl: HTMLElement, force: boolean) {
        const tipContent = modalEl.querySelector('#ai-tip-content');
        const btnRegenerate = modalEl.querySelector('#btn-regenerate-tip') as HTMLButtonElement;

        if (!tipContent) return;

        // Show loading
        tipContent.innerHTML = '<p class="text-muted loading-tip"><i class="fa-solid fa-circle-notch fa-spin"></i> Gerando dica...</p>';
        if (btnRegenerate) btnRegenerate.disabled = true;

        try {
            const updatedTask = await TaskService.generateTip(String(taskId), force);

            if (updatedTask.tip) {
                // Typing effect
                this.typeWriterEffect(tipContent, updatedTask.tip, () => {
                    if (btnRegenerate) btnRegenerate.disabled = false;
                });
            }
        } catch (error) {
            console.error('Erro ao gerar dica:', error);
            tipContent.innerHTML = '<p class="text-muted error-tip"><i class="fa-solid fa-triangle-exclamation"></i> Erro ao gerar dica. Tente novamente.</p>';
            if (btnRegenerate) btnRegenerate.disabled = false;
        }
    }

    private typeWriterEffect(element: Element, text: string, onComplete?: () => void) {
        element.innerHTML = '<p></p>';
        const p = element.querySelector('p');
        if (!p) return;

        let index = 0;
        const speed = 20; // ms per character

        const type = () => {
            if (index < text.length) {
                p.textContent += text.charAt(index);
                index++;
                setTimeout(type, speed);
            } else if (onComplete) {
                onComplete();
            }
        };

        type();
    }
}