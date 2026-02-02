import template from './TaskComments.html';
import './TaskComments.css';
import { CommentService, TaskComment } from '../../services/CommentService';
import { ToastService } from '../../services/ToastService';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';

export class TaskComments {
    private taskId: number;
    private currentUserId: number;
    private comments: TaskComment[] = [];
    private element: HTMLElement | null = null;
    private toastService: ToastService;

    constructor(taskId: number, currentUserId: number) {
        this.taskId = taskId;
        this.currentUserId = currentUserId;
        this.toastService = new ToastService();
    }

    async render(): Promise<HTMLElement> {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = template.trim();
        this.element = wrapper.firstChild as HTMLElement;

        await this.loadComments();
        this.bindEvents();

        return this.element;
    }

    private async loadComments(): Promise<void> {
        try {
            this.comments = await CommentService.getByTaskId(this.taskId);
            this.renderComments();
        } catch (error) {
            console.error('Error loading comments:', error);
            this.toastService.show('Erro ao carregar comentários', 'error');
        }
    }

    private renderComments(): void {
        if (!this.element) return;

        const listContainer = this.element.querySelector('[data-comments-list]');
        const countEl = this.element.querySelector('[data-count]');

        if (!listContainer) return;

        if (countEl) {
            countEl.textContent = String(this.comments.length);
        }

        if (this.comments.length === 0) {
            listContainer.innerHTML = '<div class="task-comments__empty">Nenhum comentário ainda. Seja o primeiro a comentar!</div>';
            return;
        }

        listContainer.innerHTML = this.comments.map(comment => this.renderComment(comment)).join('');

        // Bind comment actions
        listContainer.querySelectorAll('.task-comment').forEach(commentEl => {
            this.bindCommentActions(commentEl as HTMLElement);
        });
    }

    private renderComment(comment: TaskComment): string {
        const initial = (comment.user_name || 'U').charAt(0).toUpperCase();
        const timeAgo = this.formatTimeAgo(comment.created_at);
        const isOwner = comment.user_id === this.currentUserId;

        return `
            <div class="task-comment" data-comment-id="${comment.id}">
                <div class="task-comment__avatar">${initial}</div>
                <div class="task-comment__content">
                    <div class="task-comment__header">
                        <span class="task-comment__author">${comment.user_name || 'Usuário'}</span>
                        <span class="task-comment__time">${timeAgo}</span>
                    </div>
                    <p class="task-comment__text">${this.escapeHtml(comment.content)}</p>
                    <div class="task-comment__edit-form">
                        <textarea class="task-comment__edit-input" rows="2">${this.escapeHtml(comment.content)}</textarea>
                        <div class="task-comment__edit-actions">
                            <button class="task-comment__edit-btn task-comment__edit-btn--cancel" data-cancel-edit>Cancelar</button>
                            <button class="task-comment__edit-btn task-comment__edit-btn--save" data-save-edit>Salvar</button>
                        </div>
                    </div>
                    ${isOwner ? `
                        <div class="task-comment__actions">
                            <button class="task-comment__action" data-action="edit">Editar</button>
                            <button class="task-comment__action task-comment__action--delete" data-action="delete">Excluir</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    private bindCommentActions(commentEl: HTMLElement): void {
        const commentId = Number(commentEl.dataset.commentId);

        const editBtn = commentEl.querySelector('[data-action="edit"]');
        const deleteBtn = commentEl.querySelector('[data-action="delete"]');
        const cancelBtn = commentEl.querySelector('[data-cancel-edit]');
        const saveBtn = commentEl.querySelector('[data-save-edit]');

        editBtn?.addEventListener('click', () => {
            commentEl.classList.add('task-comment--editing');
        });

        cancelBtn?.addEventListener('click', () => {
            commentEl.classList.remove('task-comment--editing');
            // Reset textarea
            const textarea = commentEl.querySelector('.task-comment__edit-input') as HTMLTextAreaElement;
            const originalText = commentEl.querySelector('.task-comment__text')?.textContent || '';
            if (textarea) textarea.value = originalText;
        });

        saveBtn?.addEventListener('click', async () => {
            const textarea = commentEl.querySelector('.task-comment__edit-input') as HTMLTextAreaElement;
            const newContent = textarea?.value.trim();

            if (!newContent) {
                this.toastService.show('O comentário não pode estar vazio', 'error');
                return;
            }

            try {
                await CommentService.update(commentId, newContent);
                this.toastService.show('Comentário atualizado', 'success');
                await this.loadComments();
            } catch (error) {
                console.error('Error updating comment:', error);
                this.toastService.show('Erro ao atualizar comentário', 'error');
            }
        });

        deleteBtn?.addEventListener('click', async () => {
            const dialog = new ConfirmDialog({
                title: 'Excluir Comentário',
                message: 'Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.',
                confirmText: 'Excluir',
                onConfirm: async () => {
                    try {
                        await CommentService.delete(commentId);
                        this.toastService.show('Comentário excluído', 'success');
                        await this.loadComments();
                    } catch (error) {
                        console.error('Error deleting comment:', error);
                        this.toastService.show('Erro ao excluir comentário', 'error');
                    }
                }
            });
            dialog.show();
        });
    }

    private bindEvents(): void {
        if (!this.element) return;

        const submitBtn = this.element.querySelector('[data-submit-btn]');
        const input = this.element.querySelector('[data-comment-input]') as HTMLTextAreaElement;

        submitBtn?.addEventListener('click', () => this.handleSubmit());
        
        input?.addEventListener('keydown', (e) => {
            // Ctrl+Enter or Cmd+Enter to submit
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.handleSubmit();
            }
        });
    }

    private async handleSubmit(): Promise<void> {
        if (!this.element) return;

        const input = this.element.querySelector('[data-comment-input]') as HTMLTextAreaElement;
        const content = input?.value.trim();

        if (!content) {
            this.toastService.show('Digite um comentário', 'error');
            return;
        }

        try {
            await CommentService.create(this.taskId, content);
            input.value = '';
            this.toastService.show('Comentário adicionado', 'success');
            await this.loadComments();
        } catch (error) {
            console.error('Error creating comment:', error);
            this.toastService.show('Erro ao adicionar comentário', 'error');
        }
    }

    private formatTimeAgo(dateString: string): string {
        // SQLite salva CURRENT_TIMESTAMP em UTC, precisamos tratar isso
        // Adiciona 'Z' se não tiver timezone para indicar UTC
        const isoString = dateString.includes('Z') || dateString.includes('+') 
            ? dateString 
            : dateString.replace(' ', 'T') + 'Z';
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'agora';
        if (diffMins < 60) return `${diffMins}m atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;

        return date.toLocaleDateString('pt-BR');
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
