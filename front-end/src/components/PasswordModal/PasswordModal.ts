import template from './PasswordModal.html';
import './PasswordModal.css';
import { UserService } from '../../services/UserService';
import { AuthService } from '../../services/AuthService';

export interface PasswordModalOptions {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export class PasswordModal {
    private overlay: HTMLElement | null = null;
    private options: PasswordModalOptions;
    private userService: UserService;

    constructor(options: PasswordModalOptions = {}) {
        this.options = options;
        this.userService = new UserService();
    }

    show(): void {
        // Remove any existing modal
        this.hide();

        // Create and append modal to document
        const div = document.createElement('div');
        div.innerHTML = this.render();
        this.overlay = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.overlay);

        // Show modal with animation
        requestAnimationFrame(() => {
            this.overlay?.classList.add('modal-overlay--visible');
        });

        // Bind events
        this.bindEvents();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus first input
        const firstInput = this.overlay.querySelector('input') as HTMLInputElement;
        firstInput?.focus();
    }

    private render(): string {
        return template;
    }

    private bindEvents(): void {
        if (!this.overlay) return;

        const closeBtn = this.overlay.querySelector('[data-action="close"]');
        const cancelBtn = this.overlay.querySelector('[data-action="cancel"]');
        const saveBtn = this.overlay.querySelector('[data-action="save"]');
        const form = this.overlay.querySelector('[data-form="password"]') as HTMLFormElement;

        closeBtn?.addEventListener('click', () => {
            this.options.onCancel?.();
            this.hide();
        });

        cancelBtn?.addEventListener('click', () => {
            this.options.onCancel?.();
            this.hide();
        });

        saveBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
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

    private async handleSubmit(): Promise<void> {
        if (!this.overlay) return;

        const currentPasswordInput = this.overlay.querySelector('#current-password') as HTMLInputElement;
        const newPasswordInput = this.overlay.querySelector('#new-password') as HTMLInputElement;
        const confirmPasswordInput = this.overlay.querySelector('#confirm-password') as HTMLInputElement;

        const currentPassword = currentPasswordInput?.value || '';
        const newPassword = newPasswordInput?.value || '';
        const confirmPassword = confirmPasswordInput?.value || '';

        // Clear previous errors
        this.clearErrors();

        // Validations
        let hasErrors = false;

        if (!currentPassword) {
            this.showFieldError('current-password', 'Senha atual é obrigatória');
            hasErrors = true;
        }

        if (newPassword.length < 8) {
            this.showFieldError('new-password', 'A senha deve ter no mínimo 8 caracteres');
            hasErrors = true;
        }

        if (newPassword !== confirmPassword) {
            this.showFieldError('confirm-password', 'As senhas não coincidem');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        // Disable buttons during save
        const saveBtn = this.overlay.querySelector('[data-action="save"]') as HTMLButtonElement;
        const cancelBtn = this.overlay.querySelector('[data-action="cancel"]') as HTMLButtonElement;

        if (saveBtn) {
            saveBtn.disabled = true;
            const textSpan = saveBtn.querySelector('.btn-text');
            if (textSpan) textSpan.textContent = 'Alterando...';
        }
        if (cancelBtn) cancelBtn.disabled = true;

        try {
            const user = AuthService.user;
            if (!user) throw new Error('Usuário não autenticado');

            await this.userService.changePassword(user.id, currentPassword, newPassword);

            this.options.onSuccess?.();
            this.hide();
        } catch (error: any) {
            console.error('Erro ao alterar senha:', error);

            if (error.message.includes('Senha atual incorreta')) {
                this.showFieldError('current-password', 'Senha atual incorreta');
            } else {
                this.showError(error.message || 'Erro ao alterar senha. Tente novamente.');
            }

            // Re-enable buttons
            if (saveBtn) {
                saveBtn.disabled = false;
                const textSpan = saveBtn.querySelector('.btn-text');
                if (textSpan) textSpan.textContent = 'Alterar Senha';
            }
            if (cancelBtn) cancelBtn.disabled = false;
        }
    }

    private showFieldError(field: string, message: string): void {
        if (!this.overlay) return;

        const input = this.overlay.querySelector(`#${field}`) as HTMLInputElement;
        const errorEl = this.overlay.querySelector(`[data-bind="${field}-error"]`) as HTMLElement;

        if (input) input.classList.add('error');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    private showError(message: string): void {
        if (!this.overlay) return;

        const errorEl = this.overlay.querySelector('[data-bind="error"]') as HTMLElement;
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    private clearErrors(): void {
        if (!this.overlay) return;

        const inputs = this.overlay.querySelectorAll('.form-input');
        inputs.forEach(input => input.classList.remove('error'));

        const errors = this.overlay.querySelectorAll('.field-error, .form-error');
        errors.forEach((error: Element) => {
            (error as HTMLElement).style.display = 'none';
            (error as HTMLElement).textContent = '';
        });
    }

    private handleEscKey = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            this.options.onCancel?.();
            this.hide();
        }
    };

    hide(): void {
        if (this.overlay) {
            this.overlay.classList.remove('modal-overlay--visible');
            setTimeout(() => {
                this.overlay?.remove();
                this.overlay = null;
            }, 200);
        }
        document.removeEventListener('keydown', this.handleEscKey);
        document.body.style.overflow = '';
    }

    static hideAll(): void {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        document.body.style.overflow = '';
    }
}
