import template from './ConfirmDialog.html';
import './ConfirmDialog.css';

export interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
}

export class ConfirmDialog {
    private overlay: HTMLElement | null = null;
    private options: ConfirmDialogOptions;

    constructor(options: ConfirmDialogOptions) {
        this.options = {
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
            ...options
        };
    }

    show(): void {
        // Remove any existing dialog
        this.hide();

        // Create and append dialog to document
        const div = document.createElement('div');
        div.innerHTML = this.render();
        this.overlay = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.overlay);

        // Show dialog with animation
        requestAnimationFrame(() => {
            this.overlay?.classList.add('confirm-dialog-overlay--visible');
        });

        // Bind events
        this.bindEvents();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    private render(): string {
        return template
            .replace('{{title}}', this.options.title)
            .replace('{{message}}', this.options.message)
            .replace('{{confirmText}}', this.options.confirmText || 'Confirmar')
            .replace('{{cancelText}}', this.options.cancelText || 'Cancelar');
    }

    private bindEvents(): void {
        if (!this.overlay) return;

        const confirmBtn = this.overlay.querySelector('[data-action="confirm"]');
        const cancelBtn = this.overlay.querySelector('[data-action="cancel"]');

        confirmBtn?.addEventListener('click', async () => {
            await this.options.onConfirm();
            this.hide();
        });

        cancelBtn?.addEventListener('click', () => {
            this.options.onCancel?.();
            this.hide();
        });

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.options.onCancel?.();
                this.hide();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', this.handleEscKey);
    }

    private handleEscKey = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            this.options.onCancel?.();
            this.hide();
        }
    };

    hide(): void {
        if (this.overlay) {
            this.overlay.classList.remove('confirm-dialog-overlay--visible');
            setTimeout(() => {
                this.overlay?.remove();
                this.overlay = null;
            }, 200);
        }
        document.removeEventListener('keydown', this.handleEscKey);
        document.body.style.overflow = '';
    }

    static hideAll(): void {
        const dialogs = document.querySelectorAll('.confirm-dialog-overlay');
        dialogs.forEach(dialog => dialog.remove());
        document.body.style.overflow = '';
    }
}
