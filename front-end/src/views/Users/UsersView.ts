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
    private currentPage: number = 1;
    private totalPages: number = 1;
    private itemsPerPage: number = 15;

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
        const loadingState = this.container.querySelector('[data-bind="loading-state"]') as HTMLElement;
        const table = this.container.querySelector('[data-bind="users-table"]') as HTMLElement;

        if (!list || !emptyState || !loadingState || !table) return;

        // Hide loading state
        loadingState.style.display = 'none';

        list.innerHTML = '';

        if (this.filteredUsers.length === 0) {
            emptyState.style.display = 'block';
            table.style.display = 'none';
            this.updatePagination();
            return;
        }

        emptyState.style.display = 'none';
        table.style.display = 'table'; // Show table (headers + body)

        // Calcular paginação
        this.totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = this.filteredUsers.slice(startIndex, endIndex);

        paginatedUsers.forEach(user => {
            const row = this.createUserRow(user);
            list.appendChild(row);
        });

        this.updatePagination();
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

            this.currentPage = 1;
            this.renderUsers();
        });

        newUserBtn?.addEventListener('click', () => {
            this.openCreateModal();
        });

        // Pagination
        this.container.querySelector("#btn-prev-page")?.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderUsers();
                this.container.querySelector('.users-container')?.scrollIntoView({ behavior: 'smooth' });
            }
        });

        this.container.querySelector("#btn-next-page")?.addEventListener("click", () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.renderUsers();
                this.container.querySelector('.users-container')?.scrollIntoView({ behavior: 'smooth' });
            }
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

    private updatePagination(): void {
        const pageInfo = this.container.querySelector('#page-info');
        const prevBtn = this.container.querySelector('#btn-prev-page') as HTMLButtonElement;
        const nextBtn = this.container.querySelector('#btn-next-page') as HTMLButtonElement;

        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
