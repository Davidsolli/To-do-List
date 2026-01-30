import template from './UserModal.html';
import './UserModal.css';
import { UserService } from '../../services/UserService';
import { User } from '../../models/User';
import { Validator } from '../../utils/Validator';

export interface UserModalOptions {
    mode: 'create' | 'edit';
    userId?: number;
    onSuccess?: (user: User) => void;
    onCancel?: () => void;
}

export class UserModal {
    private overlay: HTMLElement | null = null;
    private options: UserModalOptions;
    private user: User | null = null;
    private userService: UserService;

    constructor(options: UserModalOptions) {
        this.options = options;
        this.userService = new UserService();
    }

    async show(): Promise<void> {
        // Remove any existing modal
        this.hide();

        // Load user data if in edit mode
        if (this.options.mode === 'edit' && this.options.userId) {
            try {
                this.user = await this.userService.getById(this.options.userId);
            } catch (error) {
                console.error('Erro ao carregar usuário:', error);
                this.showError('Erro ao carregar usuário. Tente novamente.');
                return;
            }
        }

        // Create and append modal to document
        const div = document.createElement('div');
        div.innerHTML = this.render();
        this.overlay = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.overlay);

        // Populate form if editing
        if (this.user) {
            this.populateForm();
        }

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
        const title = this.options.mode === 'create' ? 'Novo Usuário' : 'Editar Usuário';
        const submitText = this.options.mode === 'create' ? 'Criar' : 'Salvar';

        return template
            .replace('{{title}}', title)
            .replace('{{submitText}}', submitText);
    }

    private populateForm(): void {
        if (!this.overlay || !this.user) return;

        const nameInput = this.overlay.querySelector('[data-bind="name"]') as HTMLInputElement;
        const emailInput = this.overlay.querySelector('[data-bind="email"]') as HTMLInputElement;
        const roleSelect = this.overlay.querySelector('[data-bind="role"]') as HTMLSelectElement;
        const passwordSection = this.overlay.querySelector('[data-section="password-fields"]') as HTMLElement;
        const passwordLabel = passwordSection?.querySelector('.form-label') as HTMLElement;
        const passwordInput = this.overlay.querySelector('[data-bind="password"]') as HTMLInputElement;
        const passwordHint = passwordSection?.querySelector('small') as HTMLElement;

        if (nameInput) nameInput.value = this.user.name || '';
        if (emailInput) emailInput.value = this.user.email || '';
        if (roleSelect) roleSelect.value = this.user.role || 'user';

        // Ajustar campo de senha no modo edit (opcional)
        if (passwordSection && passwordLabel && passwordInput && passwordHint) {
            passwordLabel.textContent = 'Nova Senha (opcional)';
            passwordInput.placeholder = 'Deixe em branco para manter a senha atual';
            passwordInput.removeAttribute('required');
            passwordHint.textContent = 'Preencha apenas se quiser resetar a senha';
        }
    }

    private bindEvents(): void {
        if (!this.overlay) return;

        const closeBtn = this.overlay.querySelector('[data-action="close"]');
        const cancelBtn = this.overlay.querySelector('[data-action="cancel"]');
        const saveBtn = this.overlay.querySelector('[data-action="save"]');
        const form = this.overlay.querySelector('[data-form="user"]') as HTMLFormElement;

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

        const nameInput = this.overlay.querySelector('[data-bind="name"]') as HTMLInputElement;
        const emailInput = this.overlay.querySelector('[data-bind="email"]') as HTMLInputElement;
        const roleSelect = this.overlay.querySelector('[data-bind="role"]') as HTMLSelectElement;
        const passwordInput = this.overlay.querySelector('[data-bind="password"]') as HTMLInputElement;

        const name = nameInput?.value.trim();
        const email = emailInput?.value.trim();
        const role = roleSelect?.value as 'admin' | 'user';
        const password = passwordInput?.value;

        // Validation
        if (!name || name.length < 3) {
            this.showError('O nome deve ter pelo menos 3 caracteres.');
            nameInput?.focus();
            return;
        }

        if (!Validator.isEmail(email)) {
            this.showError('E-mail inválido.');
            emailInput?.focus();
            return;
        }

        // Validação de senha apenas se for create ou se forneceu senha no edit
        if (this.options.mode === 'create') {
            if (!password || password.length < 8) {
                this.showError('A senha deve ter pelo menos 8 caracteres.');
                passwordInput?.focus();
                return;
            }
        } else if (password && password.length > 0 && password.length < 8) {
            this.showError('A senha deve ter pelo menos 8 caracteres.');
            passwordInput?.focus();
            return;
        }

        // Disable buttons during save
        const saveBtn = this.overlay.querySelector('[data-action="save"]') as HTMLButtonElement;
        const cancelBtn = this.overlay.querySelector('[data-action="cancel"]') as HTMLButtonElement;

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando...';
        }
        if (cancelBtn) cancelBtn.disabled = true;

        try {
            let savedUser: User;

            if (this.options.mode === 'create') {
                savedUser = await UserService.create({
                    name,
                    email,
                    role,
                    password
                } as any);
            } else if (this.options.userId) {
                // Monta objeto de atualização
                const updateData: any = { name, email };

                // Se forneceu senha, inclui no update
                if (password && password.length >= 8) {
                    updateData.password = password;
                }

                // Atualiza e depois busca o usuário atualizado
                await UserService.update(this.options.userId, updateData);
                // Busca o usuário atualizado
                savedUser = await this.userService.getById(this.options.userId);
            } else {
                throw new Error('ID do usuário não fornecido');
            }

            this.options.onSuccess?.(savedUser);
            this.hide();
        } catch (error: any) {
            console.error('Erro ao salvar usuário:', error);
            this.showError(error.message || 'Erro ao salvar usuário. Tente novamente.');

            // Re-enable buttons
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = this.options.mode === 'create' ? 'Criar' : 'Salvar';
            }
            if (cancelBtn) cancelBtn.disabled = false;
        }
    }

    private showError(message: string): void {
        if (!this.overlay) return;

        const errorEl = this.overlay.querySelector('[data-bind="error"]') as HTMLElement;
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';

            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
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
