import template from './UsersView.html';
import './UsersView.css';
import { Component } from '../../core/Component';
import { User } from '../../models/User';
import { UserService } from '../../services/UserService';
import { AuthService } from '../../services/AuthService';
import { Button } from '../../components/Button/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { UserModal } from '../../components/UserModal/UserModal';
import { toast } from '../../services/ToastService';

export class UsersView extends Component {
    private users: User[] = [];
    private filteredUsers: User[] = [];

    getTemplate(): string {
        const btnNewUser = new Button({
            text: 'Novo Usuário',
            variant: 'primary',
            action: 'new-user',
            icon: 'fa-solid fa-plus'
        });

        return template.replace('{{btn_new_user}}', btnNewUser.render());
    }

    protected async afterRender(): Promise<void> {
        await this.loadUsers();
        this.renderUsers();
        this.bindEvents();
    }

    private async loadUsers(): Promise<void> {
        try {
            this.users = await UserService.getAll();
            this.filteredUsers = this.users;
        } catch (error) {
            console.error('Failed to load users', error);
            toast.error('Erro ao carregar usuários');
            this.users = [];
            this.filteredUsers = [];
        }
    }

    private renderUsers(): void {
        const list = this.container.querySelector('[data-bind="users-list"]') as HTMLElement;
        const emptyState = this.container.querySelector('[data-bind="empty-state"]') as HTMLElement;

        if (!list || !emptyState) return;

        list.innerHTML = '';

        if (this.filteredUsers.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        this.filteredUsers.forEach(user => {
            const row = this.createUserRow(user);
            list.appendChild(row);
        });
    }

    private createUserRow(user: User): HTMLTableRowElement {
        const row = document.createElement('tr');
        const currentUser = AuthService.user;
        const isCurrentUser = currentUser?.id === user.id;

        const userName = user.name || '';
        const userEmail = user.email || '';
        const userRole = user.role || 'user';

        row.innerHTML = `
            <td>
                <div class="user-name">${this.escapeHtml(userName)}</div>
            </td>
            <td>
                <div class="user-email">${this.escapeHtml(userEmail)}</div>
            </td>
            <td>
                <span class="user-role user-role--${userRole}">${userRole === 'admin' ? 'Admin' : 'Usuário'}</span>
            </td>
            <td>
                <div class="user-actions">
                    <button class="action-btn" data-action="edit-user" data-user-id="${user.id}" title="Editar usuário" ${isCurrentUser ? 'disabled' : ''}>
                        <i class="material-icons-outlined">edit</i>
                    </button>
                    <button class="action-btn action-btn--danger" data-action="delete-user" data-user-id="${user.id}" title="Deletar usuário" ${isCurrentUser ? 'disabled' : ''}>
                        <i class="material-icons-outlined">delete</i>
                    </button>
                </div>
            </td>
        `;

        const editBtn = row.querySelector('[data-action="edit-user"]');
        const deleteBtn = row.querySelector('[data-action="delete-user"]');

        editBtn?.addEventListener('click', () => {
            if (!isCurrentUser) {
                this.openEditModal(user);
            }
        });

        deleteBtn?.addEventListener('click', () => {
            if (!isCurrentUser) {
                this.handleDeleteUser(user);
            }
        });

        return row;
    }

    private bindEvents(): void {
        const searchInput = this.container.querySelector<HTMLInputElement>('[data-action="search"]');
        const newUserBtn = this.container.querySelector('[data-action="new-user"]');

        searchInput?.addEventListener('input', () => {
            const value = searchInput.value.toLowerCase();

            this.filteredUsers = this.users.filter(user =>
                user.name.toLowerCase().includes(value) ||
                user.email.toLowerCase().includes(value)
            );

            this.renderUsers();
        });

        newUserBtn?.addEventListener('click', () => {
            this.openCreateModal();
        });
    }

    private openCreateModal(): void {
        const modal = new UserModal({
            mode: 'create',
            onSuccess: (user) => {
                toast.success('Usuário criado com sucesso');
                this.users.push(user);
                this.filteredUsers = [...this.users];
                this.renderUsers();
            }
        });

        modal.show();
    }

    private openEditModal(user: User): void {
        const modal = new UserModal({
            mode: 'edit',
            userId: user.id,
            onSuccess: (updatedUser) => {
                toast.success('Usuário atualizado com sucesso');
                const index = this.users.findIndex(u => u.id === user.id);
                if (index !== -1) {
                    this.users[index] = updatedUser;
                    this.filteredUsers = [...this.users];
                    this.renderUsers();
                }
            }
        });

        modal.show();
    }

    private handleDeleteUser(user: User): void {
        const currentUser = AuthService.user;

        if (currentUser?.id === user.id) {
            toast.error('Você não pode deletar seu próprio usuário!');
            return;
        }

        const dialog = new ConfirmDialog({
            title: 'Excluir Usuário',
            message: `Tem certeza que deseja excluir o usuário "${user.name}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    await UserService.delete(user.id);
                    toast.success('Usuário excluído com sucesso');
                    await this.reloadUsers();
                } catch (error) {
                    console.error('Failed to delete user', error);
                    toast.error('Erro ao deletar usuário. Tente novamente.');
                }
            }
        });

        dialog.show();
    }

    private async reloadUsers(): Promise<void> {
        try {
            this.users = await UserService.getAll();
            this.filteredUsers = [...this.users];
            this.renderUsers();
        } catch (error) {
            console.error('Failed to reload users', error);
            toast.error('Erro ao recarregar usuários');
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
