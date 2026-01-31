import { Component } from '../../core/Component';
import { Project } from '../../models/Project';
import { Task } from '../../models/Task';
import { User } from '../../models/User';
import { ProjectService } from '../../services/ProjectService';
import { UserService } from '../../services/UserService';
import { TaskService } from '../../services/TaskService';
import { toast } from '../../services/ToastService';
import { TaskCard } from '../../components/TaskCard/TaskCard';
import { Modal } from '../../components/Modal/Modal';
import { Button } from '../../components/Button/Button';
import { Select } from '../../components/Select/Select';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { ProjectModal } from '../../components/ProjectModal/ProjectModal';
import { ProjectMembers } from '../../components/ProjectMembers/ProjectMembers';
import { TaskComments } from '../../components/TaskComments/TaskComments';
import { ProjectRole, ProjectMember, AuditLog } from '../../models/Collaboration';
import { AuthService } from '../../services/AuthService';
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
    private currentView: 'kanban' | 'members' | 'activity' = 'kanban';
    private projectMembersComponent: ProjectMembers | null = null;
    private userRole: ProjectRole | null = null;
    private members: ProjectMember[] = [];

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

        // 4. Setup tabs
        this.setupTabs();

        // 5. Setup ProjectMembers component
        this.setupProjectMembersComponent();

        // 6. Load user role and members
        await this.loadUserRoleAndMembers();
    }

    private async loadUserRoleAndMembers(): Promise<void> {
        if (!this.projectId) return;

        try {
            // Get user's role in the project
            const currentUser = AuthService.user;
            if (!currentUser) return;

            // Load members to determine role
            this.members = await ProjectService.getMembers(this.projectId);
            const memberCount = this.container.querySelector('#members-count');
            if (memberCount) {
                memberCount.textContent = String(this.members.length);
            }

            // System admin has full access
            if (currentUser.role === 'admin') {
                this.userRole = ProjectRole.OWNER; // Treat system admin as owner
            } else if (this.project && this.project.user_id === currentUser.id) {
                this.userRole = ProjectRole.OWNER;
            } else {
                // Find current user's role from members
                const userMember = this.members.find(m => m.user_id === currentUser.id);
                if (userMember) {
                    // Ensure the role is properly cast from string to enum
                    const roleStr = userMember.role as string;
                    if (roleStr === 'owner' || roleStr === ProjectRole.OWNER) {
                        this.userRole = ProjectRole.OWNER;
                    } else if (roleStr === 'admin' || roleStr === ProjectRole.ADMIN) {
                        this.userRole = ProjectRole.ADMIN;
                    } else {
                        this.userRole = ProjectRole.MEMBER;
                    }
                }
            }

            // Update role badge
            this.updateRoleBadge();

            // Update UI based on permissions
            this.updateUIForPermissions();

        } catch (error) {
            console.error('Error loading user role:', error);
        }
    }

    private updateRoleBadge(): void {
        const badge = this.container.querySelector('#user-role-badge') as HTMLElement;
        const roleText = this.container.querySelector('#user-role-text');
        
        if (badge && roleText && this.userRole) {
            badge.style.display = 'flex';
            
            const roleNames: Record<string, string> = {
                [ProjectRole.OWNER]: 'Proprietário',
                [ProjectRole.ADMIN]: 'Administrador',
                [ProjectRole.MEMBER]: 'Membro'
            };
            
            roleText.textContent = roleNames[this.userRole] || 'Membro';
            
            // Add role-specific class
            badge.classList.remove('role-owner', 'role-admin', 'role-member');
            badge.classList.add(`role-${this.userRole}`);
        }
    }

    private updateUIForPermissions(): void {
        const canEdit = this.userRole === ProjectRole.OWNER || this.userRole === ProjectRole.ADMIN;
        const isOwner = this.userRole === ProjectRole.OWNER;

        // Show/hide edit/delete buttons based on permissions
        const editBtn = this.container.querySelector('[data-action="btn-edit-project"]') as HTMLElement;
        const deleteBtn = this.container.querySelector('[data-action="btn-delete-project"]') as HTMLElement;

        if (editBtn) editBtn.style.display = canEdit ? '' : 'none';
        if (deleteBtn) deleteBtn.style.display = isOwner ? '' : 'none';

        // Members button visibility (admin or owner can manage)
        const membersBtn = this.container.querySelector('[data-action="btn-members"]') as HTMLElement;
        if (membersBtn) {
            // Everyone can see members, but button shows management capability
            membersBtn.title = canEdit ? 'Gerenciar Membros' : 'Ver Membros';
        }
    }

    private setupTabs(): void {
        const tabs = this.container.querySelectorAll('.view-tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const view = (tab as HTMLElement).dataset.view as 'kanban' | 'members' | 'activity';
                if (view) {
                    this.switchView(view);
                }
            });
        });
    }

    private switchView(view: 'kanban' | 'members' | 'activity'): void {
        this.currentView = view;

        // Update tab active states
        const tabs = this.container.querySelectorAll('.view-tab');
        tabs.forEach(tab => {
            if ((tab as HTMLElement).dataset.view === view) {
                tab.classList.add('view-tab--active');
            } else {
                tab.classList.remove('view-tab--active');
            }
        });

        // Show/hide view content
        const views = ['kanban', 'members', 'activity'];
        views.forEach(v => {
            const viewEl = this.container.querySelector(`#${v}-view`) as HTMLElement;
            if (viewEl) {
                if (v === view) {
                    viewEl.classList.remove('view-content--hidden');
                } else {
                    viewEl.classList.add('view-content--hidden');
                }
            }
        });

        // Load view-specific data
        if (view === 'activity') {
            this.loadActivityLog();
        } else if (view === 'members' && this.projectMembersComponent) {
            this.projectMembersComponent.refresh();
        }
    }

    private setupProjectMembersComponent(): void {
        const container = this.container.querySelector('#project-members-container') as HTMLElement;
        if (container && this.projectId) {
            this.projectMembersComponent = new ProjectMembers(
                container, 
                parseInt(this.projectId),
                this.userRole || ProjectRole.MEMBER
            );
        }
    }

    private async loadActivityLog(): Promise<void> {
        if (!this.projectId) return;

        const activityList = this.container.querySelector('#activity-list');
        if (!activityList) return;

        try {
            const logs = await ProjectService.getAuditLogs(this.projectId);
            this.renderActivityLog(logs);
        } catch (error) {
            console.error('Error loading activity log:', error);
            activityList.innerHTML = `
                <div class="activity-empty">
                    <span class="material-icons-outlined">error_outline</span>
                    <p>Erro ao carregar atividades</p>
                </div>
            `;
        }
    }

    private renderActivityLog(logs: AuditLog[]): void {
        const activityList = this.container.querySelector('#activity-list');
        if (!activityList) return;

        if (logs.length === 0) {
            activityList.innerHTML = `
                <div class="activity-empty">
                    <span class="material-icons-outlined">history</span>
                    <p>Nenhuma atividade registrada</p>
                </div>
            `;
            return;
        }

        activityList.innerHTML = logs.map(log => `
            <div class="activity-item">
                <div class="activity-icon">
                    <span class="material-icons-outlined">${this.getActivityIcon(log.action)}</span>
                </div>
                <div class="activity-content">
                    <p class="activity-message">
                        <strong>${log.user_name || 'Usuário'}</strong> ${this.getActivityDescription(log)}
                    </p>
                    <span class="activity-time">${this.formatActivityTime(log.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    private getActivityIcon(action: string): string {
        const icons: Record<string, string> = {
            'task_created': 'add_task',
            'task_updated': 'edit',
            'task_deleted': 'delete',
            'task_status_changed': 'swap_horiz',
            'member_added': 'person_add',
            'member_removed': 'person_remove',
            'member_role_changed': 'admin_panel_settings',
            'project_updated': 'edit_note',
            'invite_sent': 'mail',
            'invite_accepted': 'check_circle',
            'ownership_transferred': 'swap_horiz'
        };
        return icons[action] || 'history';
    }

    private getActivityDescription(log: AuditLog): string {
        let details: Record<string, any> = {};
        
        if (log.details) {
            if (typeof log.details === 'string') {
                try {
                    details = JSON.parse(log.details);
                } catch {
                    // If details is not valid JSON, use it as a plain message
                    return log.details;
                }
            } else {
                details = log.details;
            }
        }
        
        const descriptions: Record<string, string> = {
            'task_created': `criou a tarefa "${details.task_title || 'Nova tarefa'}"`,
            'task_updated': `atualizou a tarefa "${details.task_title || 'tarefa'}"`,
            'task_deleted': `excluiu a tarefa "${details.task_title || 'tarefa'}"`,
            'task_status_changed': `moveu "${details.task_title || 'tarefa'}" para ${details.new_status || 'novo status'}`,
            'member_added': `adicionou ${details.member_name || 'um membro'} ao projeto`,
            'member_removed': `removeu ${details.member_name || 'um membro'} do projeto`,
            'member_role_changed': `alterou o papel de ${details.member_name || 'membro'} para ${details.new_role || 'novo papel'}`,
            'project_updated': 'atualizou as informações do projeto',
            'invite_sent': `enviou um convite para ${details.email || 'um usuário'}`,
            'invite_accepted': `aceitou o convite para o projeto`,
            'ownership_transferred': `transferiu a propriedade para ${details.new_owner_name || 'outro usuário'}`
        };

        return descriptions[log.action] || `realizou a ação: ${log.action}`;
    }

    private formatActivityTime(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays} dias atrás`;
        
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
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

        // Calculate permissions based on user role
        const canEdit = this.userRole === ProjectRole.OWNER || this.userRole === ProjectRole.ADMIN;
        const cardPermissions = {
            canEdit,
            canDelete: canEdit,
            canChangeStatus: canEdit || this.userRole === ProjectRole.MEMBER
        };

        // Render Cards
        tasks.forEach(task => {
            // Check if current user is assignee or reviewer for specific permissions
            const userId = JSON.parse(localStorage.getItem('user_data') || '{}').id;
            const isAssignee = task.assignees?.some(a => a.user_id === userId) || false;
            const isReviewer = task.reviewers?.some(r => r.user_id === userId) || false;
            
            const taskPermissions = {
                ...cardPermissions,
                canChangeStatus: canEdit || isAssignee || isReviewer
            };

            const card = new TaskCard(`task-${task.id}`, task, taskPermissions);
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

        // Only show add buttons if user can create tasks
        if (canEdit) {
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
    }

    private bindEvents() {
        const view = this.container.querySelector('.project-details-container');
        if (!view) return;

        view.querySelector('[data-action="btn-add-task"]')?.addEventListener('click', () => this.openTaskModal());
        view.querySelector('[data-action="btn-filter"]')?.addEventListener('click', () => this.openFilterModal());
        view.querySelector('[data-action="btn-edit-project"]')?.addEventListener('click', () => this.openEditProjectModal());
        view.querySelector('[data-action="btn-delete-project"]')?.addEventListener('click', () => this.openDeleteProjectModal());
        view.querySelector('[data-action="btn-members"]')?.addEventListener('click', () => this.switchView('members'));

        // Drag and Drop
        this.setupDragAndDrop(view as HTMLElement);
    }

    private setupDragAndDrop(view: HTMLElement) {
        const columns = view.querySelectorAll('.kanban-column');
        const canEdit = this.userRole === ProjectRole.OWNER || this.userRole === ProjectRole.ADMIN;

        columns.forEach(col => {
            col.addEventListener('dragover', (e: any) => {
                e.preventDefault();
                
                const targetStatus = (col as HTMLElement).dataset.status;
                const restrictedStatuses = ['under_review', 'completed'];
                
                // Check if can drop to this column
                if (restrictedStatuses.includes(targetStatus || '') && !canEdit) {
                    // Check if user is assignee/reviewer of the dragged task
                    const taskId = e.dataTransfer.getData('text/plain');
                    // Can't reliably check here, so allow dragover but validate on drop
                }
                
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
            // Find the task to check permissions before moving
            const task = this.allTasks.find((t: Task) => t.id === parseInt(taskId));
            if (!task) {
                (window as any).toast.error('Tarefa não encontrada');
                return;
            }

            const userId = JSON.parse(localStorage.getItem('user_data') || '{}').id;
            const isAssignee = task.assignees?.some((a: { user_id: number }) => a.user_id === userId) || false;
            const isReviewer = task.reviewers?.some((r: { user_id: number }) => r.user_id === userId) || false;
            const canEdit = this.userRole === ProjectRole.OWNER || this.userRole === ProjectRole.ADMIN;

            // Check permissions for restricted statuses
            const restrictedStatuses = ['under_review', 'completed'];
            if (restrictedStatuses.includes(status)) {
                if (!canEdit && !isAssignee && !isReviewer) {
                    (window as any).toast.error('Você não tem permissão para mover para este status');
                    return;
                }
                
                // Additional check: only reviewers can move to completed
                if (status === 'completed' && !canEdit && !isReviewer) {
                    (window as any).toast.error('Apenas revisores ou admins podem marcar como concluído');
                    return;
                }
            }

            // Check if user can move tasks at all
            if (!canEdit && !isAssignee && !isReviewer) {
                (window as any).toast.error('Você não tem permissão para mover esta tarefa');
                return;
            }

            await TaskService.updateStatus(taskId, status);

            // Track move time locally
            localStorage.setItem(`task_move_${taskId}`, String(Date.now()));

            (window as any).toast.success('Tarefa movida!');
            this.loadProjectData(); // Reload to sync
        } catch (error: any) {
            console.error(error);
            (window as any).toast.error(error.message || 'Erro ao mover tarefa.');
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

        // Get current assignees and reviewers
        const currentAssigneeIds = task?.assignees?.map(a => a.user_id) || [];
        const currentReviewerIds = task?.reviewers?.map(r => r.user_id) || [];

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

        // Build members list HTML
        const membersListHtml = this.members.length > 0 
            ? this.members.map(m => `
                <label class="member-select-item ${currentAssigneeIds.includes(m.user_id) ? 'selected' : ''}" data-user-id="${m.user_id}">
                    <input type="checkbox" name="assignees" value="${m.user_id}" ${currentAssigneeIds.includes(m.user_id) ? 'checked' : ''}>
                    <div class="member-avatar">${(m.user_name || 'U').charAt(0).toUpperCase()}</div>
                    <div class="member-info">
                        <div class="member-name">${m.user_name || 'Usuário'}</div>
                        <div class="member-role">${m.role}</div>
                    </div>
                </label>
            `).join('')
            : '<div class="member-select-empty">Nenhum membro no projeto</div>';

        // Build reviewers list HTML
        const reviewersListHtml = this.members.length > 0
            ? this.members.map(m => `
                <label class="member-select-item ${currentReviewerIds.includes(m.user_id) ? 'selected' : ''}" data-user-id="${m.user_id}">
                    <input type="checkbox" name="reviewers" value="${m.user_id}" ${currentReviewerIds.includes(m.user_id) ? 'checked' : ''}>
                    <div class="member-avatar">${(m.user_name || 'U').charAt(0).toUpperCase()}</div>
                    <div class="member-info">
                        <div class="member-name">${m.user_name || 'Usuário'}</div>
                        <div class="member-role">${m.role}</div>
                    </div>
                </label>
            `).join('')
            : '<div class="member-select-empty">Nenhum membro no projeto</div>';

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
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fa-solid fa-user"></i> Responsáveis</label>
                        <div class="member-select-container">
                            <div class="member-select-list" data-assignees-list>
                                ${membersListHtml}
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label><i class="fa-solid fa-user-check"></i> Revisores</label>
                        <div class="member-select-container">
                            <div class="member-select-list" data-reviewers-list>
                                ${reviewersListHtml}
                            </div>
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

            // Handle checkbox selection visual feedback
            modalEl.querySelectorAll('.member-select-item input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const target = e.target as HTMLInputElement;
                    const item = target.closest('.member-select-item');
                    if (item) {
                        item.classList.toggle('selected', target.checked);
                    }
                });
            });

            const form = modalEl.querySelector('#task-form') as HTMLFormElement;
            form.addEventListener('submit', (e) => {
                // Get selected assignees and reviewers
                const assigneeCheckboxes = form.querySelectorAll('input[name="assignees"]:checked');
                const reviewerCheckboxes = form.querySelectorAll('input[name="reviewers"]:checked');
                const assigneeIds = Array.from(assigneeCheckboxes).map(cb => Number((cb as HTMLInputElement).value));
                const reviewerIds = Array.from(reviewerCheckboxes).map(cb => Number((cb as HTMLInputElement).value));

                this.handleSaveTask(e, prioritySelect, assigneeIds, reviewerIds);
                modal.close();
            });
            modalEl.querySelector('[data-action="cancel-task"]')?.addEventListener('click', () => modal.close());
        }
    }

    private async handleSaveTask(e: Event, prioritySelect: Select, assigneeIds: number[] = [], reviewerIds: number[] = []) {
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
            let taskId: number;
            
            if (this.currentEditTaskId) {
                await TaskService.update(String(this.currentEditTaskId), data);
                taskId = this.currentEditTaskId;
                
                // Update assignees
                if (assigneeIds.length > 0 || (this.currentEditTaskId)) {
                    await TaskService.updateAssignees(String(taskId), assigneeIds);
                }
                
                // Update reviewers
                if (reviewerIds.length > 0 || (this.currentEditTaskId)) {
                    await TaskService.updateReviewers(String(taskId), reviewerIds);
                }
                
                (window as any).toast.success('Tarefa atualizada!');
            } else {
                const createdTask = await TaskService.create({ ...data, status: this.currentStatusForCreation as any }, assigneeIds);
                taskId = createdTask.id;
                
                // Update reviewers for new task
                if (reviewerIds.length > 0) {
                    await TaskService.updateReviewers(String(taskId), reviewerIds);
                }
                
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

    private async openTaskDetailModal(task: Task) {
        // Priority labels
        const priorityLabels: Record<string, string> = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta'
        };

        // Status labels
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

        // Get current user permissions
        const currentUser = AuthService.user;
        const canEdit = this.userRole === ProjectRole.OWNER || this.userRole === ProjectRole.ADMIN;

        // Render assignees with edit capability
        const assignees = task.assignees || [];
        const assigneesHtml = this.renderPeopleList(assignees, 'assignee', canEdit);

        // Render reviewers with edit capability
        const reviewers = task.reviewers || [];
        const reviewersHtml = this.renderPeopleList(reviewers, 'reviewer', canEdit);

        // Priority options
        const priorityOptions = [
            { value: 'low', label: 'Baixa' },
            { value: 'medium', label: 'Média' },
            { value: 'high', label: 'Alta' }
        ];

        // Status options
        const statusOptions = [
            { value: 'pending', label: 'Pendente' },
            { value: 'in_progress', label: 'Em Andamento' },
            { value: 'under_review', label: 'Em Revisão' },
            { value: 'completed', label: 'Concluído' }
        ];

        const detailHtml = `
            <div class="task-detail-modal" data-task-id="${task.id}">
                <div class="task-detail-layout">
                    <!-- Panel Header -->
                    <div class="panel-header">
                        <div class="panel-header-left">
                            <span class="panel-header-title">Detalhes da Tarefa</span>
                        </div>
                        <div class="panel-header-right">
                            ${canEdit ? `
                                <button class="panel-action-btn panel-action-btn--danger" data-action="detail-delete-btn" title="Excluir tarefa">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            ` : ''}
                            <button class="panel-close-btn" data-action="close-panel">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="task-detail-main">
                        <!-- Editable Title -->
                        <div class="inline-editable-group ${canEdit ? 'can-edit' : ''}">
                            <h2 class="task-detail-title inline-editable" data-field="title">
                                <span class="editable-value">${task.title}</span>
                                ${canEdit ? '<button class="btn-inline-edit"><i class="fa-solid fa-pen"></i></button>' : ''}
                            </h2>
                            <div class="inline-edit-form hidden">
                                <input type="text" class="inline-edit-input" value="${task.title}" data-field="title">
                                <div class="inline-edit-actions">
                                    <button class="btn-inline-save" title="Salvar"><i class="fa-solid fa-check"></i></button>
                                    <button class="btn-inline-cancel" title="Cancelar"><i class="fa-solid fa-xmark"></i></button>
                                </div>
                            </div>
                        </div>

                        <!-- Editable Description -->
                        <div class="task-detail-section">
                            <div class="section-header">
                                <i class="fa-solid fa-align-left"></i>
                                <span>Descrição</span>
                            </div>
                            <div class="inline-editable-group ${canEdit ? 'can-edit' : ''}">
                                <div class="section-body inline-editable" data-field="description">
                                    <span class="editable-value">${task.description || '<span class="text-muted">Clique para adicionar descrição...</span>'}</span>
                                    ${canEdit ? '<button class="btn-inline-edit"><i class="fa-solid fa-pen"></i></button>' : ''}
                                </div>
                                <div class="inline-edit-form hidden">
                                    <textarea class="inline-edit-textarea" data-field="description" rows="3">${task.description || ''}</textarea>
                                    <div class="inline-edit-actions">
                                        <button class="btn-inline-save" title="Salvar"><i class="fa-solid fa-check"></i></button>
                                        <button class="btn-inline-cancel" title="Cancelar"><i class="fa-solid fa-xmark"></i></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- AI Tip -->
                        <div class="task-detail-section">
                            <div class="section-header">
                                <i class="fa-solid fa-lightbulb"></i>
                                <span>Dica da IA</span>
                                <button class="btn-icon btn-regenerate" id="btn-regenerate-tip" title="Regenerar dica">
                                    <i class="fa-solid fa-rotate"></i>
                                </button>
                            </div>
                            <div class="section-body ai-tip-box" id="ai-tip-content">
                                ${task.tip ? `<p>${task.tip}</p>` : '<p class="text-muted"><i class="fa-solid fa-circle-notch fa-spin"></i> Gerando dica...</p>'}
                            </div>
                        </div>

                        <!-- Comments -->
                        <div class="task-detail-section task-comments-section" id="task-comments-container">
                            <!-- Comments will be rendered here -->
                        </div>
                    </div>

                    <!-- Metadata Sidebar -->
                    <div class="task-detail-sidebar">
                        <!-- Status -->
                        <div class="sidebar-section">
                            <div class="sidebar-label">
                                <i class="fa-solid fa-circle-dot"></i>
                                Status
                            </div>
                            <div class="sidebar-content">
                                ${canEdit ? `
                                    <select class="inline-select inline-select--status" data-field="status" data-status="${task.status}">
                                        ${statusOptions.map(opt => `
                                            <option value="${opt.value}" ${task.status === opt.value ? 'selected' : ''}>${opt.label}</option>
                                        `).join('')}
                                    </select>
                                ` : `<span class="status-badge status-badge--${statusClass}">${statusLabel}</span>`}
                            </div>
                        </div>

                        <!-- Priority -->
                        <div class="sidebar-section">
                            <div class="sidebar-label">
                                <i class="fa-solid fa-flag"></i>
                                Prioridade
                            </div>
                            <div class="sidebar-content">
                                ${canEdit ? `
                                    <select class="inline-select inline-select--priority" data-field="priority" data-priority="${task.priority}">
                                        ${priorityOptions.map(opt => `
                                            <option value="${opt.value}" ${task.priority === opt.value ? 'selected' : ''}>${opt.label}</option>
                                        `).join('')}
                                    </select>
                                ` : `<span class="priority-badge priority-badge--${task.priority}">${priorityLabel}</span>`}
                            </div>
                        </div>

                        <!-- Prazo -->
                        <div class="sidebar-section">
                            <div class="sidebar-label">
                                <i class="fa-solid fa-calendar"></i>
                                Prazo
                            </div>
                            <div class="sidebar-content">
                                ${canEdit ? `
                                    <input type="date" class="inline-date" data-field="estimate" value="${task.estimate ? new Date(task.estimate).toISOString().split('T')[0] : ''}">
                                ` : `<span class="date-value">${task.estimate ? new Date(task.estimate).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>`}
                            </div>
                        </div>

                        <!-- Assignees -->
                        <div class="sidebar-section">
                            <div class="sidebar-label">
                                <i class="fa-solid fa-user"></i>
                                Responsáveis
                                ${canEdit ? '<button class="btn-add-inline" data-action="add-assignee" title="Adicionar"><i class="fa-solid fa-plus"></i></button>' : ''}
                            </div>
                            <div class="sidebar-content" id="assignees-container">
                                ${assigneesHtml}
                            </div>
                        </div>

                        <!-- Reviewers -->
                        <div class="sidebar-section">
                            <div class="sidebar-label">
                                <i class="fa-solid fa-user-check"></i>
                                Revisores
                                ${canEdit ? '<button class="btn-add-inline" data-action="add-reviewer" title="Adicionar"><i class="fa-solid fa-plus"></i></button>' : ''}
                            </div>
                            <div class="sidebar-content" id="reviewers-container">
                                ${reviewersHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modal = new Modal({
            title: '',
            content: detailHtml,
            onClose: () => { }
        });

        modal.open();

        const modalEl = modal.getElement();
        if (modalEl) {
            // Add class for side panel
            const modalContainer = modalEl.querySelector('.modal__container') as HTMLElement;
            if (modalContainer) {
                modalContainer.classList.add('modal-content--wide');
            }

            // Close panel button
            modalEl.querySelector('[data-action="close-panel"]')?.addEventListener('click', () => {
                modal.close();
            });

            // Delete button
            modalEl.querySelector('[data-action="detail-delete-btn"]')?.addEventListener('click', () => {
                modal.close();
                this.openDeleteTaskModal(task);
            });

            // Setup inline editing
            this.setupInlineEditing(task, modalEl, modal);

            // Add assignee button
            modalEl.querySelector('[data-action="add-assignee"]')?.addEventListener('click', () => {
                this.openPeopleSelector(task, 'assignee', modalEl);
            });

            // Add reviewer button
            modalEl.querySelector('[data-action="add-reviewer"]')?.addEventListener('click', () => {
                this.openPeopleSelector(task, 'reviewer', modalEl);
            });

            // Remove person buttons
            modalEl.querySelectorAll('[data-action="remove-person"]').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const target = e.currentTarget as HTMLElement;
                    const userId = Number(target.dataset.userId);
                    const type = target.dataset.type as 'assignee' | 'reviewer';
                    await this.removePerson(task, userId, type, modalEl);
                });
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

            // Render comments section
            const commentsContainer = modalEl.querySelector('#task-comments-container');
            if (commentsContainer && currentUser) {
                const taskComments = new TaskComments(task.id, currentUser.id);
                taskComments.render().then(commentsEl => {
                    commentsContainer.appendChild(commentsEl);
                });
            }
        }
    }

    private setupInlineEditing(task: Task, modalEl: HTMLElement, modal: Modal): void {
        // Inline text/textarea editing (title, description)
        modalEl.querySelectorAll('.inline-editable').forEach(el => {
            const editBtn = el.querySelector('.btn-inline-edit');
            const group = el.closest('.inline-editable-group');
            const form = group?.querySelector('.inline-edit-form');
            
            if (!editBtn || !form) return;

            // Click edit button
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                el.classList.add('hidden');
                form.classList.remove('hidden');
                const input = form.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
                input?.focus();
                input?.select();
            });

            // Save button
            form.querySelector('.btn-inline-save')?.addEventListener('click', async () => {
                const input = form.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement;
                const field = input.dataset.field;
                const value = input.value;

                if (field) {
                    await this.saveInlineEdit(task, field, value, modalEl);
                    el.classList.remove('hidden');
                    form.classList.add('hidden');
                }
            });

            // Cancel button
            form.querySelector('.btn-inline-cancel')?.addEventListener('click', () => {
                el.classList.remove('hidden');
                form.classList.add('hidden');
            });

            // Enter to save, Escape to cancel
            form.querySelector('input, textarea')?.addEventListener('keydown', async (e: Event) => {
                const ke = e as KeyboardEvent;
                const input = e.target as HTMLInputElement | HTMLTextAreaElement;
                
                if (ke.key === 'Enter' && !ke.shiftKey && input.tagName !== 'TEXTAREA') {
                    ke.preventDefault();
                    const field = input.dataset.field;
                    if (field) {
                        await this.saveInlineEdit(task, field, input.value, modalEl);
                        el.classList.remove('hidden');
                        form.classList.add('hidden');
                    }
                } else if (ke.key === 'Escape') {
                    el.classList.remove('hidden');
                    form.classList.add('hidden');
                }
            });
        });

        // Select fields (status, priority)
        modalEl.querySelectorAll('.inline-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const target = e.target as HTMLSelectElement;
                const field = target.dataset.field;
                const value = target.value;
                if (field) {
                    // Update data attribute for CSS styling
                    if (field === 'status') {
                        target.setAttribute('data-status', value);
                    } else if (field === 'priority') {
                        target.setAttribute('data-priority', value);
                    }
                    await this.saveInlineEdit(task, field, value, modalEl);
                }
            });
        });

        // Date field (converts to timestamp)
        modalEl.querySelectorAll('.inline-date').forEach(input => {
            input.addEventListener('change', async (e) => {
                const target = e.target as HTMLInputElement;
                const field = target.dataset.field;
                const dateValue = target.value;
                if (field) {
                    // Convert date string to timestamp or null
                    const timestamp = dateValue ? new Date(dateValue).getTime() : null;
                    await this.saveInlineEdit(task, field, timestamp, modalEl);
                }
            });
        });
    }

    private async saveInlineEdit(task: Task, field: string, value: any, modalEl: HTMLElement): Promise<void> {
        try {
            const updateData: any = {};
            updateData[field] = value;

            await TaskService.update(String(task.id), updateData);

            // Update local task object
            (task as any)[field] = value;

            // Update displayed value
            if (field === 'title') {
                const titleEl = modalEl.querySelector('.task-detail-title .editable-value');
                if (titleEl) titleEl.textContent = value;
            } else if (field === 'description') {
                const descEl = modalEl.querySelector('[data-field="description"] .editable-value');
                if (descEl) descEl.innerHTML = value || '<span class="text-muted">Clique para adicionar descrição...</span>';
            }

            // Refresh the board
            this.loadProjectData();
            toast.show('Alteração salva', 'success');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.show('Erro ao salvar alteração', 'error');
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

    private renderPeopleList(people: Array<{ user_id: number; user_name?: string }>, type: 'assignee' | 'reviewer', canEdit: boolean): string {
        if (people.length === 0) {
            return '<span class="text-muted">Nenhum</span>';
        }

        return people.map(p => `
            <div class="person-chip">
                <span class="person-avatar">${(p.user_name || 'U').charAt(0).toUpperCase()}</span>
                <span class="person-name">${p.user_name || 'Usuário'}</span>
                ${canEdit ? `
                    <button class="btn-remove-person" data-action="remove-person" data-user-id="${p.user_id}" data-type="${type}" title="Remover">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                ` : ''}
            </div>
        `).join('');
    }

    private async openPeopleSelector(task: Task, type: 'assignee' | 'reviewer', modalEl: HTMLElement) {
        const container = type === 'assignee' 
            ? modalEl.querySelector('#assignees-container')
            : modalEl.querySelector('#reviewers-container');

        if (!container) return;

        // Get already selected people
        const existingIds = type === 'assignee'
            ? (task.assignees || []).map(a => a.user_id)
            : (task.reviewers || []).map(r => r.user_id);

        // Filter available members
        const availableMembers = this.members.filter((m: ProjectMember) => !existingIds.includes(m.user_id));

        if (availableMembers.length === 0) {
            toast.show('Todos os membros já foram adicionados', 'info');
            return;
        }

        // Create dropdown selector
        const selectorHtml = `
            <div class="people-selector-dropdown">
                <div class="people-selector-header">
                    <span>Selecionar ${type === 'assignee' ? 'Responsável' : 'Revisor'}</span>
                    <button class="btn-close-selector" data-action="close-selector">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="people-selector-list">
                    ${availableMembers.map((m: ProjectMember) => `
                        <button class="people-selector-item" data-user-id="${m.user_id}" data-user-name="${m.user_name}">
                            <span class="person-avatar">${(m.user_name || 'U').charAt(0).toUpperCase()}</span>
                            <span>${m.user_name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        // Insert dropdown near the container
        const sidebarSection = container.closest('.sidebar-section');
        if (!sidebarSection) return;

        // Remove any existing dropdown
        modalEl.querySelectorAll('.people-selector-dropdown').forEach(d => d.remove());

        // Insert dropdown
        sidebarSection.insertAdjacentHTML('beforeend', selectorHtml);

        const dropdown = sidebarSection.querySelector('.people-selector-dropdown');
        if (!dropdown) return;

        // Close selector
        dropdown.querySelector('[data-action="close-selector"]')?.addEventListener('click', () => {
            dropdown.remove();
        });

        // Select person
        dropdown.querySelectorAll('.people-selector-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLElement;
                const userId = Number(target.dataset.userId);
                const userName = target.dataset.userName || 'Usuário';

                await this.addPerson(task, userId, userName, type, modalEl);
                dropdown.remove();
            });
        });

        // Close on click outside
        const handleOutsideClick = (e: MouseEvent) => {
            if (!dropdown.contains(e.target as Node) && dropdown.parentElement) {
                dropdown.remove();
                document.removeEventListener('click', handleOutsideClick);
            }
        };
        setTimeout(() => document.addEventListener('click', handleOutsideClick), 100);
    }

    private async addPerson(task: Task, userId: number, userName: string, type: 'assignee' | 'reviewer', modalEl: HTMLElement) {
        try {
            if (type === 'assignee') {
                const currentIds = (task.assignees || []).map(a => a.user_id);
                const newIds = [...currentIds, userId];
                await TaskService.updateAssignees(String(task.id), newIds);
                
                // Update local task
                if (!task.assignees) task.assignees = [];
                task.assignees.push({ user_id: userId, user_name: userName });
            } else {
                const currentIds = (task.reviewers || []).map(r => r.user_id);
                const newIds = [...currentIds, userId];
                await TaskService.updateReviewers(String(task.id), newIds);
                
                // Update local task
                if (!task.reviewers) task.reviewers = [];
                task.reviewers.push({ user_id: userId, user_name: userName });
            }

            // Update UI
            this.updatePeopleUI(task, type, modalEl);
            toast.show(`${type === 'assignee' ? 'Responsável' : 'Revisor'} adicionado com sucesso`, 'success');
            
            // Refresh the board
            this.loadProjectData();
        } catch (error) {
            console.error('Erro ao adicionar pessoa:', error);
            toast.show('Erro ao adicionar pessoa', 'error');
        }
    }

    private async removePerson(task: Task, userId: number, type: 'assignee' | 'reviewer', modalEl: HTMLElement) {
        try {
            if (type === 'assignee') {
                const newIds = (task.assignees || []).filter(a => a.user_id !== userId).map(a => a.user_id);
                await TaskService.updateAssignees(String(task.id), newIds);
                
                // Update local task
                task.assignees = (task.assignees || []).filter(a => a.user_id !== userId);
            } else {
                const newIds = (task.reviewers || []).filter(r => r.user_id !== userId).map(r => r.user_id);
                await TaskService.updateReviewers(String(task.id), newIds);
                
                // Update local task
                task.reviewers = (task.reviewers || []).filter(r => r.user_id !== userId);
            }

            // Update UI
            this.updatePeopleUI(task, type, modalEl);
            toast.show(`${type === 'assignee' ? 'Responsável' : 'Revisor'} removido com sucesso`, 'success');
            
            // Refresh the board
            this.loadProjectData();
        } catch (error) {
            console.error('Erro ao remover pessoa:', error);
            toast.show('Erro ao remover pessoa', 'error');
        }
    }

    private updatePeopleUI(task: Task, type: 'assignee' | 'reviewer', modalEl: HTMLElement) {
        const container = type === 'assignee' 
            ? modalEl.querySelector('#assignees-container')
            : modalEl.querySelector('#reviewers-container');

        if (!container) return;

        const canEdit = this.userRole === ProjectRole.OWNER || this.userRole === ProjectRole.ADMIN;
        const people = type === 'assignee' ? task.assignees || [] : task.reviewers || [];

        container.innerHTML = this.renderPeopleList(people, type, canEdit);

        // Reattach remove listeners
        container.querySelectorAll('[data-action="remove-person"]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const target = e.currentTarget as HTMLElement;
                const userId = Number(target.dataset.userId);
                const btnType = target.dataset.type as 'assignee' | 'reviewer';
                await this.removePerson(task, userId, btnType, modalEl);
            });
        });
    }
}