import { Component } from '../../core/Component';
import { AuthService } from '../../services/AuthService';
import { UserService } from '../../services/UserService';
import { toast } from '../../services/ToastService';
import { Validator } from '../../utils/Validator';
import template from './ProfileView.html';
import './ProfileView.css';

export class ProfileView extends Component {
    private userService: UserService;
    private isEditing: boolean = false;
    private isChangingPassword: boolean = false;

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

        return template
            .replace(/{{userName}}/g, user.name || '')
            .replace(/{{userEmail}}/g, user.email || '')
            .replace(/{{userInitial}}/g, initial);
    }

    afterRender(): void {
        this.attachEventListeners();
        this.updateLastPasswordChange();
    }

    private attachEventListeners(): void {
        // Botão Editar Perfil
        const editButton = document.querySelector('#edit-profile-btn') as HTMLButtonElement;
        editButton?.addEventListener('click', () => this.toggleEditMode());

        // Botão Cancelar
        const cancelButton = document.querySelector('#cancel-btn') as HTMLButtonElement;
        cancelButton?.addEventListener('click', () => this.cancelEdit());

        // Botão Salvar
        const saveButton = document.querySelector('#save-profile-btn') as HTMLButtonElement;
        saveButton?.addEventListener('click', () => this.saveProfile());

        // Botão Alterar Senha
        const changePasswordBtn = document.querySelector('#change-password-btn') as HTMLButtonElement;
        changePasswordBtn?.addEventListener('click', () => this.togglePasswordModal());

        // Botão Fechar Modal
        const closeModalBtn = document.querySelector('#close-modal-btn') as HTMLButtonElement;
        closeModalBtn?.addEventListener('click', () => this.togglePasswordModal());

        // Botão Cancelar Modal
        const cancelModalBtn = document.querySelector('#cancel-modal-btn') as HTMLButtonElement;
        cancelModalBtn?.addEventListener('click', () => this.togglePasswordModal());

        // Botão Salvar Nova Senha
        const savePasswordBtn = document.querySelector('#save-password-btn') as HTMLButtonElement;
        savePasswordBtn?.addEventListener('click', () => this.changePassword());

        // Upload de Avatar (opcional - pode ser implementado posteriormente)
        const avatarUploadBtn = document.querySelector('#avatar-upload-btn') as HTMLButtonElement;
        avatarUploadBtn?.addEventListener('click', () => this.handleAvatarUpload());

        // Validação em tempo real
        const nameInput = document.querySelector('#profile-name') as HTMLInputElement;
        const emailInput = document.querySelector('#profile-email') as HTMLInputElement;

        nameInput?.addEventListener('input', () => this.validateField('name', nameInput.value));
        emailInput?.addEventListener('input', () => this.validateField('email', emailInput.value));
    }

    private toggleEditMode(): void {
        this.isEditing = !this.isEditing;

        const nameInput = document.querySelector('#profile-name') as HTMLInputElement;
        const emailInput = document.querySelector('#profile-email') as HTMLInputElement;
        const editButton = document.querySelector('#edit-profile-btn') as HTMLButtonElement;
        const actionButtons = document.querySelector('#action-buttons') as HTMLDivElement;

        if (this.isEditing) {
            nameInput.disabled = false;
            emailInput.disabled = false;
            nameInput.classList.add('editing');
            emailInput.classList.add('editing');
            editButton.style.display = 'none';
            actionButtons.style.display = 'flex';
        } else {
            nameInput.disabled = true;
            emailInput.disabled = true;
            nameInput.classList.remove('editing');
            emailInput.classList.remove('editing');
            editButton.style.display = 'inline-flex';
            actionButtons.style.display = 'none';
        }
    }

    private cancelEdit(): void {
        const user = AuthService.user;
        if (!user) return;

        const nameInput = document.querySelector('#profile-name') as HTMLInputElement;
        const emailInput = document.querySelector('#profile-email') as HTMLInputElement;

        nameInput.value = user.name || '';
        emailInput.value = user.email || '';

        this.clearFieldError('name');
        this.clearFieldError('email');

        this.toggleEditMode();
    }

    private async saveProfile(): Promise<void> {
        const nameInput = document.querySelector('#profile-name') as HTMLInputElement;
        const emailInput = document.querySelector('#profile-email') as HTMLInputElement;
        const saveButton = document.querySelector('#save-profile-btn') as HTMLButtonElement;

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
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        try {
            const user = AuthService.user;
            if (!user) throw new Error('Usuário não autenticado');

            await this.userService.update(user.id, { name, email });

            // Atualizar dados no localStorage (já que AuthService usa localStorage)
            localStorage.setItem('user_data', JSON.stringify({ ...user, name, email }));

            toast.success('Perfil atualizado com sucesso!');
            this.toggleEditMode();

            // Atualizar a sidebar com novos dados
            this.updateSidebarUserInfo(name, email);

            // Recarregar a página para atualizar os dados no AuthService
            window.location.reload();

        } catch (error: any) {
            console.error('Erro ao salvar perfil:', error);
            toast.error(error.message || 'Erro ao atualizar perfil. Tente novamente.');
        } finally {
            saveButton.disabled = false;
            saveButton.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        }
    }

    private togglePasswordModal(): void {
        const modal = document.querySelector('#password-modal') as HTMLDivElement;
        modal.classList.toggle('active');

        if (modal.classList.contains('active')) {
            // Limpar campos ao abrir
            const currentPasswordInput = document.querySelector('#current-password') as HTMLInputElement;
            const newPasswordInput = document.querySelector('#new-password') as HTMLInputElement;
            const confirmPasswordInput = document.querySelector('#confirm-password') as HTMLInputElement;

            currentPasswordInput.value = '';
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';

            this.clearFieldError('current-password');
            this.clearFieldError('new-password');
            this.clearFieldError('confirm-password');
        }
    }

    private async changePassword(): Promise<void> {
        const currentPasswordInput = document.querySelector('#current-password') as HTMLInputElement;
        const newPasswordInput = document.querySelector('#new-password') as HTMLInputElement;
        const confirmPasswordInput = document.querySelector('#confirm-password') as HTMLInputElement;
        const savePasswordBtn = document.querySelector('#save-password-btn') as HTMLButtonElement;

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validações
        let hasErrors = false;

        if (!currentPassword) {
            this.showFieldError('current-password', 'Senha atual é obrigatória');
            hasErrors = true;
        }

        if (newPassword.length < 6) {
            this.showFieldError('new-password', 'A senha deve ter no mínimo 6 caracteres');
            hasErrors = true;
        }

        if (newPassword !== confirmPassword) {
            this.showFieldError('confirm-password', 'As senhas não coincidem');
            hasErrors = true;
        }

        if (hasErrors) {
            return;
        }

        // Desabilitar botão e mostrar loading
        savePasswordBtn.disabled = true;
        savePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Alterando...';

        try {
            const user = AuthService.user;
            if (!user) throw new Error('Usuário não autenticado');

            await this.userService.changePassword(user.id, currentPassword, newPassword);

            toast.success('Senha alterada com sucesso!');
            this.togglePasswordModal();

            // Atualizar data da última alteração
            this.updateLastPasswordChange();

        } catch (error: any) {
            console.error('Erro ao alterar senha:', error);

            if (error.message.includes('Senha atual incorreta')) {
                this.showFieldError('current-password', 'Senha atual incorreta');
            } else {
                toast.error(error.message || 'Erro ao alterar senha. Tente novamente.');
            }
        } finally {
            savePasswordBtn.disabled = false;
            savePasswordBtn.innerHTML = '<i class="fas fa-lock"></i> Alterar Senha';
        }
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
        const errorElement = document.querySelector(`#${field}-error`) as HTMLSpanElement;
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        const inputElement = document.querySelector(`#profile-${field}`) as HTMLInputElement;
        if (!inputElement) {
            const passwordInput = document.querySelector(`#${field}`) as HTMLInputElement;
            passwordInput?.classList.add('error');
        } else {
            inputElement.classList.add('error');
        }
    }

    private clearFieldError(field: string): void {
        const errorElement = document.querySelector(`#${field}-error`) as HTMLSpanElement;
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }

        const inputElement = document.querySelector(`#profile-${field}`) as HTMLInputElement;
        if (!inputElement) {
            const passwordInput = document.querySelector(`#${field}`) as HTMLInputElement;
            passwordInput?.classList.remove('error');
        } else {
            inputElement.classList.remove('error');
        }
    }

    private updateSidebarUserInfo(name: string, email: string): void {
        const sidebarUserName = document.querySelector('.sidebar-user-name') as HTMLSpanElement;
        const sidebarUserEmail = document.querySelector('.sidebar-user-email') as HTMLSpanElement;

        if (sidebarUserName) sidebarUserName.textContent = name;
        if (sidebarUserEmail) sidebarUserEmail.textContent = email;
    }

    private updateLastPasswordChange(): void {
        // Por enquanto, vamos usar um valor fixo
        // Isso pode ser melhorado com um campo no banco de dados posteriormente
        const lastChangeElement = document.querySelector('#last-password-change') as HTMLSpanElement;
        if (lastChangeElement) {
            lastChangeElement.textContent = 'Última alteração há 3 meses.';
        }
    }

    private handleAvatarUpload(): void {
        // Criar input file dinamicamente
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/gif';
        input.style.display = 'none';

        input.addEventListener('change', async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            // Validar tamanho (máx 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Imagem deve ter no máximo 2MB');
                return;
            }

            // Validar tipo
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
                toast.error('Formato inválido. Use JPG, PNG ou GIF');
                return;
            }

            toast.info('Upload de avatar será implementado em breve!');
            // TODO: Implementar upload de avatar quando backend estiver pronto
        });

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }
}
