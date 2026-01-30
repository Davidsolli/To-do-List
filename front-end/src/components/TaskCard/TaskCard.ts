import { Task } from '../../models/Task';
import template from './TaskCard.html';
import './TaskCard.css';

export class TaskCard {
    private task: Task;

    constructor(taskId: string, task: Task) {
        this.task = task;
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

        this.bindEvents(element);
        return element;
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