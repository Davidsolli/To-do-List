import template from './UsersView.html';
import './UsersView.css';
import { Component } from '../../core/Component';
import { User } from '../../models/User';
import { UserService } from '../../services/UserService';
import { AuthService } from '../../services/AuthService';
import { Modal } from '../../components/Modal/Modal';
import { UserForm } from '../../components/UserForm/UserForm';

export class UsersView extends Component {
    private users: User[] = [];
    private filteredUsers: User[] = [];
    private currentModal: Modal | null = null;

    getTemplate(): string {
        return template;
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
            this.users = [];
            this.filteredUsers = [];
        }
    }

    private renderUsers(): void {
        const list = this.container.querySelector('[data-users-list]');
        const emptyState = this.container.querySelector('[data-empty-state]');

        if (!list || !emptyState) return;

        list.innerHTML = '';

        if (this.filteredUsers.length === 0) {
            emptyState.removeAttribute('hidden');
            return;
        }

        emptyState.setAttribute('hidden', 'true');

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
                    <button class="action-btn" data-action="edit-user" data-user-id="${user.id}" title="Editar usuário">
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor">
                            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                        </svg>
                    </button>
                    <button class="action-btn action-btn--danger" data-action="delete-user" data-user-id="${user.id}" title="Deletar usuário" ${isCurrentUser ? 'disabled' : ''}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor">
                            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;

        const editBtn = row.querySelector('[data-action="edit-user"]');
        const deleteBtn = row.querySelector('[data-action="delete-user"]');

        editBtn?.addEventListener('click', () => this.openEditModal(user));
        deleteBtn?.addEventListener('click', () => this.handleDeleteUser(user));

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

        newUserBtn?.addEventListener('click', () => this.openCreateModal());
    }

    private openCreateModal(): void {
        const form = new UserForm({
            onSubmit: (user) => this.handleCreateUser(user),
            onCancel: () => this.closeModal()
        });

        this.currentModal = new Modal({
            title: 'Criar Novo Usuário',
            content: form.render(),
            onClose: () => {
                this.currentModal = null;
            }
        });

        this.currentModal.open();

        setTimeout(() => {
            const modalElement = this.currentModal?.getElement();
            if (modalElement) {
                form.bindEvents(modalElement);
            }
        }, 0);
    }

    private openEditModal(user: User): void {
        const form = new UserForm({
            initialData: user,
            onSubmit: (updatedData) => this.handleUpdateUser(user.id, updatedData),
            onCancel: () => this.closeModal()
        });

        this.currentModal = new Modal({
            title: 'Editar Usuário',
            content: form.render(),
            onClose: () => {
                this.currentModal = null;
            }
        });

        this.currentModal.open();

        setTimeout(() => {
            const modalElement = this.currentModal?.getElement();
            if (modalElement) {
                form.bindEvents(modalElement);
            }
        }, 0);
    }

    private async handleCreateUser(user: Partial<User>): Promise<void> {
        try {
            await UserService.create(user);
            this.closeModal();
            await this.reloadUsers();
        } catch (error) {
            console.error('Failed to create user', error);
            alert('Erro ao criar usuário. Verifique os dados e tente novamente.');
        }
    }

    private async handleUpdateUser(id: number, user: Partial<User>): Promise<void> {
        try {
            await UserService.update(id, user);
            this.closeModal();
            await this.reloadUsers();
        } catch (error) {
            console.error('Failed to update user', error);
            alert('Erro ao atualizar usuário. Verifique os dados e tente novamente.');
        }
    }

    private async handleDeleteUser(user: User): Promise<void> {
        const currentUser = AuthService.user;

        if (currentUser?.id === user.id) {
            alert('Você não pode deletar seu próprio usuário!');
            return;
        }

        const confirmed = confirm(`Tem certeza que deseja deletar o usuário "${user.name}"?`);

        if (!confirmed) return;

        try {
            await UserService.delete(user.id);
            await this.reloadUsers();
        } catch (error) {
            console.error('Failed to delete user', error);
            alert('Erro ao deletar usuário. Tente novamente.');
        }
    }

    private async reloadUsers(): Promise<void> {
        try {
            this.users = await UserService.getAll();
            this.filteredUsers = [...this.users];
            this.renderUsers();
        } catch (error) {
            console.error('Failed to reload users', error);
        }
    }

    private closeModal(): void {
        if (this.currentModal) {
            this.currentModal.close();
        }
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
