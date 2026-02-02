import { Task } from '../../models/Task';
import template from './TaskCard.html';
import './TaskCard.css';

export interface TaskCardPermissions {
    canEdit: boolean;
    canDelete: boolean;
    canChangeStatus: boolean;
}

export class TaskCard {
    private task: Task;
    private permissions: TaskCardPermissions;

    constructor(taskId: string, task: Task, permissions?: TaskCardPermissions) {
        this.task = task;
        this.permissions = permissions || { canEdit: true, canDelete: true, canChangeStatus: true };
    }

    getTemplate(): string {
        let html = template;

        const priorityMap: Record<string, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' };

        // Substituições
        html = html.replace(/\${id}/g, String(this.task.id));
        html = html.replace(/\${title}/g, this.task.title);
        // Fallback for desc
        html = html.replace(/\${description}/g, this.task.description || 'Sem descrição');

        const priority = this.task.priority || 'medium';
        html = html.replace(/\${priority}/g, priority);
        html = html.replace(/\${priorityLabel}/g, priorityMap[priority] || 'Média');

        // Date Display from Timestamp
        let dateDisplay = 'Sem data';
        if (this.task.estimate) {
            const date = new Date(this.task.estimate);
            if (!isNaN(date.getTime())) {
                dateDisplay = date.toLocaleDateString('pt-BR');
            }
        }

        // Replace the mock date placeholder
        // Note: The template currently has <span class="task-card__date">12/12/2025</span>
        html = html.replace('<span class="task-card__date">12/12/2025</span>', `<span class="task-card__date">${dateDisplay}</span>`);

        // Remove unused placeholders if any
        html = html.replace(/\${estimate}/g, String(this.task.estimate || 0));
        html = html.replace(/\${tipClass}/g, this.task.tip ? '' : 'hidden');

        return html;
    }

    public getElement(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = this.getTemplate().trim();
        const element = wrapper.firstChild as HTMLElement;

        // Set draggable based on permissions
        if (!this.permissions.canChangeStatus) {
            element.setAttribute('draggable', 'false');
            element.classList.add('task-card--readonly');
        }

        this.renderAssignees(element);
        this.renderReviewers(element);
        this.updateActionsVisibility(element);
        this.bindEvents(element);
        return element;
    }

    private updateActionsVisibility(element: HTMLElement): void {
        const editBtn = element.querySelector('[data-action="edit"]') as HTMLElement;
        const deleteBtn = element.querySelector('[data-action="delete"]') as HTMLElement;

        if (editBtn && !this.permissions.canEdit) {
            editBtn.style.display = 'none';
        }
        if (deleteBtn && !this.permissions.canDelete) {
            deleteBtn.style.display = 'none';
        }

        // Hide entire actions container if no actions available
        const actionsContainer = element.querySelector('.task-card__actions') as HTMLElement;
        if (actionsContainer && !this.permissions.canEdit && !this.permissions.canDelete) {
            actionsContainer.style.display = 'none';
        }
    }

    private renderAssignees(element: HTMLElement): void {
        const assigneesContainer = element.querySelector('[data-assignees]');
        if (!assigneesContainer) return;

        const assignees = this.task.assignees || [];
        
        if (assignees.length === 0) {
            assigneesContainer.innerHTML = '';
            return;
        }

        // Show up to 3 avatars, then +N
        const maxVisible = 3;
        const visibleAssignees = assignees.slice(0, maxVisible);
        const remainingCount = assignees.length - maxVisible;

        let html = '<div class="task-card__assignee-list" title="Responsáveis">';
        
        visibleAssignees.forEach(assignee => {
            const initial = (assignee.user_name || 'U').charAt(0).toUpperCase();
            html += `
                <div class="task-card__assignee" title="${assignee.user_name || 'Usuário'}">
                    <span>${initial}</span>
                </div>
            `;
        });

        if (remainingCount > 0) {
            html += `
                <div class="task-card__assignee task-card__assignee--more" title="${remainingCount} mais">
                    <span>+${remainingCount}</span>
                </div>
            `;
        }

        html += '</div>';
        assigneesContainer.innerHTML = html;
    }

    private renderReviewers(element: HTMLElement): void {
        const assigneesContainer = element.querySelector('[data-assignees]');
        if (!assigneesContainer) return;

        const reviewers = this.task.reviewers || [];
        
        if (reviewers.length === 0) return;

        // Add reviewers indicator
        let html = '<div class="task-card__reviewer-list" title="Revisores">';
        
        const maxVisible = 2;
        const visibleReviewers = reviewers.slice(0, maxVisible);
        const remainingCount = reviewers.length - maxVisible;

        visibleReviewers.forEach(reviewer => {
            const initial = (reviewer.user_name || 'R').charAt(0).toUpperCase();
            html += `
                <div class="task-card__reviewer" title="Revisor: ${reviewer.user_name || 'Usuário'}">
                    <span>${initial}</span>
                </div>
            `;
        });

        if (remainingCount > 0) {
            html += `
                <div class="task-card__reviewer task-card__reviewer--more" title="${remainingCount} mais revisores">
                    <span>+${remainingCount}</span>
                </div>
            `;
        }

        html += '</div>';
        assigneesContainer.insertAdjacentHTML('beforeend', html);
    }

    private bindEvents(element: HTMLElement): void {
        const editBtn = element.querySelector('[data-action="edit"]');
        const deleteBtn = element.querySelector('[data-action="delete"]');

        editBtn?.addEventListener('click', (e) => this.handleEdit(e));
        deleteBtn?.addEventListener('click', (e) => this.handleDelete(e));

        // Drag events
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer?.setData('text/plain', String(this.task.id));
            element.classList.add('dragging');
        });

        element.addEventListener('dragend', () => {
            element.classList.remove('dragging');
        });

        // Click for details
        element.addEventListener('click', () => this.handleCardClick(element));
    }

    private handleDelete(e: Event) {
        e.stopPropagation();
        // Emits event so KanbanView can show custom modal
        const target = e.target as HTMLElement;
        target.dispatchEvent(new CustomEvent('delete-requested', {
            bubbles: true,
            detail: { task: this.task }
        }));
    }

    private handleEdit(e: Event) {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        target.dispatchEvent(new CustomEvent('edit-requested', {
            bubbles: true,
            detail: { task: this.task }
        }));
    }

    private handleCardClick(element: HTMLElement) {
        // Details view can be a modal too in the future, for now just silent or emit
        // Removing alert() as per user request to avoid native dialogs
        console.log('Card clicked', this.task);

        element.dispatchEvent(new CustomEvent('details-requested', {
            bubbles: true,
            detail: { task: this.task }
        }));
    }
}