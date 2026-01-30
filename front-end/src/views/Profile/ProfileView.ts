import { Component } from '../../core/Component';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { toast } from '../../services/ToastService';
import { Validator } from '../../utils/Validator';
import { Button } from '../../components/Button/Button';
import { PasswordModal } from '../../components/PasswordModal/PasswordModal';
import template from './ProfileView.html';
import './ProfileView.css';

export class ProfileView extends Component {
    private userService: UserService;
    private isEditing: boolean = false;

    constructor(containerId: string) {
        super(containerId);
        this.userService = new UserService();
    }

    getTemplate(): string {
        const user = AuthService.user;

        if (!user) {
            window.location.href = '/login';
            return '';
        }

        const initial = user.name?.charAt(0).toUpperCase() || 'U';

        // Botão Editar Perfil
        const btnEdit = new Button({
            text: 'Editar Perfil',
            variant: 'primary',
            action: 'edit-profile',
            icon: 'fa-solid fa-edit'
        });

        // Botão Alterar Senha
        const btnChangePassword = new Button({
            text: 'Alterar Senha',
            variant: 'outline',
            action: 'change-password',
            icon: 'fa-solid fa-lock'
        });

        // Botão Cancelar
        const btnCancel = new Button({
            text: 'Cancelar',
            variant: 'ghost',
            action: 'cancel'
        });

        // Botão Salvar
        const btnSave = new Button({
            text: 'Salvar Alterações',
            variant: 'primary',
            action: 'save',
            icon: 'fa-solid fa-save'
        });

        return template
            .replace(/{{userName}}/g, user.name || '')
            .replace(/{{userEmail}}/g, user.email || '')
            .replace(/{{userInitial}}/g, initial)
            .replace('{{btn_edit}}', btnEdit.render())
            .replace('{{btn_change_password}}', btnChangePassword.render())
            .replace('{{btn_cancel}}', btnCancel.render())
            .replace('{{btn_save}}', btnSave.render());
    }

    protected afterRender(): void {
        this.bindEvents();
        this.updateLastPasswordChange();
    }

    private bindEvents(): void {
        // Adicionar listeners diretos aos botões
        const editBtn = this.container.querySelector('[data-action="edit-profile"]') as HTMLButtonElement;
        const cancelBtn = this.container.querySelector('[data-action="cancel"]') as HTMLButtonElement;
        const saveBtn = this.container.querySelector('[data-action="save"]') as HTMLButtonElement;
        const changePasswordBtn = this.container.querySelector('[data-action="change-password"]') as HTMLButtonElement;

        editBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleToggleEditMode();
        });

        cancelBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleCancelEdit();
        });

        saveBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSaveProfile();
        });

        changePasswordBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleShowPasswordModal();
        });

        // Validação em tempo real
        const nameInput = this.container.querySelector('[data-bind="name"]') as HTMLInputElement;
        const emailInput = this.container.querySelector('[data-bind="email"]') as HTMLInputElement;

        nameInput?.addEventListener('input', () => this.validateField('name', nameInput.value));
        emailInput?.addEventListener('input', () => this.validateField('email', emailInput.value));
    }

    private handleToggleEditMode(): void {
        this.isEditing = !this.isEditing;

        const nameInput = this.container.querySelector('[data-bind="name"]') as HTMLInputElement;
        const emailInput = this.container.querySelector('[data-bind="email"]') as HTMLInputElement;
        const editButton = this.container.querySelector('[data-action="edit-profile"]') as HTMLButtonElement;
        const actionButtons = this.container.querySelector('[data-section="action-buttons"]') as HTMLDivElement;

        if (this.isEditing) {
            nameInput.disabled = false;
            emailInput.disabled = false;
            nameInput.classList.add('editing');
            emailInput.classList.add('editing');
            editButton.style.display = 'none';
            actionButtons.style.display = 'flex';
            nameInput.focus();
        } else {
            nameInput.disabled = true;
            emailInput.disabled = true;
            nameInput.classList.remove('editing');
            emailInput.classList.remove('editing');
            editButton.style.display = 'inline-flex';
            actionButtons.style.display = 'none';
        }
    }

    private handleCancelEdit(): void {
        const user = AuthService.user;
        if (!user) return;

        const nameInput = this.container.querySelector('[data-bind="name"]') as HTMLInputElement;
        const emailInput = this.container.querySelector('[data-bind="email"]') as HTMLInputElement;

        nameInput.value = user.name || '';
        emailInput.value = user.email || '';

        this.clearFieldError('name');
        this.clearFieldError('email');

        this.handleToggleEditMode();
    }

    private async handleSaveProfile(): Promise<void> {
        const nameInput = this.container.querySelector('[data-bind="name"]') as HTMLInputElement;
        const emailInput = this.container.querySelector('[data-bind="email"]') as HTMLInputElement;
        const saveButton = this.container.querySelector('[data-action="save"]') as HTMLButtonElement;

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        // Validações
        let hasErrors = false;

        if (!this.validateField('name', name)) {
            hasErrors = true;
        }

        if (!this.validateField('email', email)) {
            hasErrors = true;
        }

        if (hasErrors) {
            toast.alert('Por favor, corrija os erros antes de salvar.');
            return;
        }

        // Desabilitar botão e mostrar loading
        saveButton.disabled = true;
        const textSpan = saveButton.querySelector('.btn-text');
        const originalText = textSpan?.textContent || 'Salvar Alterações';
        if (textSpan) textSpan.textContent = 'Salvando...';

        try {
            const user = AuthService.user;
            if (!user) throw new Error('Usuário não autenticado');

            await this.userService.update(user.id, { name, email });

            // Atualizar dados no localStorage
            localStorage.setItem('user_data', JSON.stringify({ ...user, name, email }));

            toast.success('Perfil atualizado com sucesso!');
            this.handleToggleEditMode();

            // Recarregar a página para atualizar os dados
            setTimeout(() => window.location.reload(), 1000);

        } catch (error: any) {
            console.error('Erro ao salvar perfil:', error);
            toast.error(error.message || 'Erro ao atualizar perfil. Tente novamente.');
        } finally {
            saveButton.disabled = false;
            if (textSpan) textSpan.textContent = originalText;
        }
    }

    private handleShowPasswordModal(): void {
        const modal = new PasswordModal({
            onSuccess: () => {
                toast.success('Senha alterada com sucesso!');
                this.updateLastPasswordChange();
            }
        });

        modal.show();
    }

    private validateField(field: string, value: string): boolean {
        this.clearFieldError(field);

        if (field === 'name') {
            if (!value || value.length < 3) {
                this.showFieldError('name', 'Nome deve ter no mínimo 3 caracteres');
                return false;
            }
        }

        if (field === 'email') {
            if (!Validator.isEmail(value)) {
                this.showFieldError('email', 'E-mail inválido');
                return false;
            }
        }

        return true;
    }

    private showFieldError(field: string, message: string): void {
        const errorElement = this.container.querySelector(`[data-bind="${field}-error"]`) as HTMLSpanElement;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        const inputElement = this.container.querySelector(`[data-bind="${field}"]`) as HTMLInputElement;
        inputElement?.classList.add('error');
    }

    private clearFieldError(field: string): void {
        const errorElement = this.container.querySelector(`[data-bind="${field}-error"]`) as HTMLSpanElement;
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }

        const inputElement = this.container.querySelector(`[data-bind="${field}"]`) as HTMLInputElement;
        inputElement?.classList.remove('error');
    }

    private updateLastPasswordChange(): void {
        // Por enquanto, vamos usar um valor fixo
        // Isso pode ser melhorado com um campo no banco de dados posteriormente
        const lastChangeElement = this.container.querySelector('[data-bind="last-password-change"]') as HTMLSpanElement;
        if (lastChangeElement) {
            lastChangeElement.textContent = 'Última alteração há 3 meses.';
        }
    }
}
