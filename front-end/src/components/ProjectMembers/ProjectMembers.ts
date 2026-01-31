import { ProjectService } from '../../services/ProjectService';
import { InviteService } from '../../services/InviteService';
import { UserService } from '../../services/UserService';
import { ProjectMember, ProjectRole, ProjectInvite } from '../../models/Collaboration';
import { User } from '../../models/User';
import template from './ProjectMembers.html';
import './ProjectMembers.css';

export class ProjectMembers {
    private container: HTMLElement;
    private projectId: number;
    private members: ProjectMember[] = [];
    private owner: User | null = null;
    private ownerId: number = 0;
    private invites: ProjectInvite[] = [];
    private currentUserId: number;
    private currentUserRole: ProjectRole | null = null;
    private selectedMemberId: number | null = null;

    constructor(container: HTMLElement | string, projectId: number, userRole?: ProjectRole) {
        if (typeof container === 'string') {
            const el = document.getElementById(container);
            if (!el) {
                throw new Error(`Container #${container} not found`);
            }
            this.container = el;
        } else {
            this.container = container;
        }
        this.projectId = projectId;
        this.currentUserRole = userRole || null;
        
        const user = JSON.parse(localStorage.getItem('user_data') || '{}');
        this.currentUserId = user.id;
        
        this.render();
    }

    public refresh(): void {
        this.loadData();
    }

    private render(): void {
        this.container.innerHTML = template;
        this.bindEvents();
        this.loadData();
    }

    private bindEvents(): void {
        // Invite button
        const inviteBtn = this.container.querySelector('#btn-invite-member');
        inviteBtn?.addEventListener('click', () => this.openInviteModal());

        // Invite form
        const inviteForm = this.container.querySelector('#invite-form');
        inviteForm?.addEventListener('submit', (e) => this.handleInvite(e));

        // Modal close buttons
        this.container.querySelector('#close-invite-modal')?.addEventListener('click', () => this.closeModal('invite-modal'));
        this.container.querySelector('#cancel-invite')?.addEventListener('click', () => this.closeModal('invite-modal'));
        this.container.querySelector('#close-role-modal')?.addEventListener('click', () => this.closeModal('role-modal'));
        this.container.querySelector('#cancel-role')?.addEventListener('click', () => this.closeModal('role-modal'));
        this.container.querySelector('#close-transfer-modal')?.addEventListener('click', () => this.closeModal('transfer-modal'));
        this.container.querySelector('#cancel-transfer')?.addEventListener('click', () => this.closeModal('transfer-modal'));

        // Confirm buttons
        this.container.querySelector('#confirm-role')?.addEventListener('click', () => this.handleRoleChange());
        this.container.querySelector('#confirm-transfer')?.addEventListener('click', () => this.handleTransfer());
    }

    private async loadData(): Promise<void> {
        try {
            // Load members
            const members = await ProjectService.getMembers(this.projectId);
            this.members = members;

            // Find owner from members list
            const ownerMember = members.find(m => m.role === ProjectRole.OWNER);
            this.ownerId = ownerMember?.user_id || 0;

            // Load owner details
            if (this.ownerId) {
                this.owner = await UserService.getById(this.ownerId);
            }

            // Determine current user's role
            if (this.currentUserId === this.ownerId) {
                this.currentUserRole = ProjectRole.OWNER;
            } else {
                const currentMember = members.find(m => m.user_id === this.currentUserId);
                this.currentUserRole = currentMember?.role || null;
            }

            // Load pending invites if admin or owner
            if (this.currentUserRole === ProjectRole.OWNER || this.currentUserRole === ProjectRole.ADMIN) {
                this.invites = await InviteService.getProjectInvites(this.projectId);
            }

            this.renderOwner();
            this.renderMembers();
            this.renderInvites();
            this.updateUIForRole();
        } catch (error) {
            console.error('Error loading project members:', error);
        }
    }

    private renderOwner(): void {
        const ownerContainer = this.container.querySelector('#project-owner');
        if (!ownerContainer || !this.owner) return;

        const initial = this.owner.name.charAt(0).toUpperCase();
        const isCurrentUser = this.owner.id === this.currentUserId;

        ownerContainer.innerHTML = `
            <div class="project-members__owner-card">
                <div class="project-members__avatar">${initial}</div>
                <div class="project-members__info">
                    <p class="project-members__name">
                        ${this.owner.name} ${isCurrentUser ? '(você)' : ''}
                        <span class="project-members__role-badge project-members__role-badge--owner">Owner</span>
                    </p>
                    <p class="project-members__email">${this.owner.email}</p>
                </div>
            </div>
        `;
    }

    private renderMembers(): void {
        const list = this.container.querySelector('#members-list');
        if (!list) return;

        // Filter out the owner - they're displayed separately
        const nonOwnerMembers = this.members.filter(m => m.role !== ProjectRole.OWNER);

        if (nonOwnerMembers.length === 0) {
            list.innerHTML = `
                <div class="project-members__empty">
                    <span class="material-icons-outlined">group</span>
                    <p>Nenhum membro além do owner</p>
                </div>
            `;
            return;
        }

        list.innerHTML = nonOwnerMembers.map(member => {
            const initial = (member.user_name || '?').charAt(0).toUpperCase();
            const isCurrentUser = member.user_id === this.currentUserId;
            const roleClass = member.role === ProjectRole.ADMIN ? 'project-members__role-badge--admin' : '';
            const avatarClass = member.role === ProjectRole.ADMIN ? 'project-members__avatar--admin' : 'project-members__avatar--member';

            const canManage = this.currentUserRole === ProjectRole.OWNER || 
                             (this.currentUserRole === ProjectRole.ADMIN && !isCurrentUser);

            let actions = '';
            if (canManage) {
                actions = `
                    <div class="project-members__actions">
                        <button class="project-members__action-btn" data-action="role" data-member-id="${member.user_id}">
                            Alterar Papel
                        </button>
                        ${this.currentUserRole === ProjectRole.OWNER ? `
                            <button class="project-members__action-btn" data-action="transfer" data-member-id="${member.user_id}">
                                Transferir
                            </button>
                        ` : ''}
                        <button class="project-members__action-btn project-members__action-btn--danger" data-action="remove" data-member-id="${member.user_id}">
                            Remover
                        </button>
                    </div>
                `;
            }

            return `
                <div class="project-members__member-card" data-member-id="${member.user_id}">
                    <div class="project-members__avatar ${avatarClass}">${initial}</div>
                    <div class="project-members__info">
                        <p class="project-members__name">
                            ${member.user_name} ${isCurrentUser ? '(você)' : ''}
                            <span class="project-members__role-badge ${roleClass}">${member.role}</span>
                        </p>
                        <p class="project-members__email">${member.user_email}</p>
                    </div>
                    ${actions}
                </div>
            `;
        }).join('');

        // Bind action buttons
        list.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = (btn as HTMLElement).dataset.action;
                const memberId = parseInt((btn as HTMLElement).dataset.memberId!);
                this.handleMemberAction(action!, memberId);
            });
        });
    }

    private renderInvites(): void {
        const invitesSection = this.container.querySelector('#pending-invites');
        const invitesList = this.container.querySelector('#invites-list');
        if (!invitesSection || !invitesList) return;

        if (this.invites.length === 0) {
            invitesSection.classList.add('project-members__invites--empty');
            return;
        }

        invitesSection.classList.remove('project-members__invites--empty');

        invitesList.innerHTML = this.invites.map(invite => `
            <div class="project-members__invite-card" data-invite-id="${invite.id}">
                <span class="project-members__invite-email">${invite.email}</span>
                <span class="project-members__invite-status">Pendente</span>
                <button class="project-members__invite-cancel" data-cancel-invite="${invite.id}">
                    <span class="material-icons-outlined">close</span>
                </button>
            </div>
        `).join('');

        // Bind cancel buttons
        invitesList.querySelectorAll('[data-cancel-invite]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const inviteId = parseInt((btn as HTMLElement).dataset.cancelInvite!);
                await this.cancelInvite(inviteId);
            });
        });
    }

    private updateUIForRole(): void {
        const inviteBtn = this.container.querySelector('#btn-invite-member') as HTMLElement;
        
        if (this.currentUserRole !== ProjectRole.OWNER && this.currentUserRole !== ProjectRole.ADMIN) {
            if (inviteBtn) inviteBtn.style.display = 'none';
            const invitesSection = this.container.querySelector('#pending-invites') as HTMLElement;
            if (invitesSection) invitesSection.style.display = 'none';
        }
    }

    private handleMemberAction(action: string, memberId: number): void {
        this.selectedMemberId = memberId;
        const member = this.members.find(m => m.user_id === memberId);
        if (!member) return;

        switch (action) {
            case 'role':
                this.openRoleModal(member);
                break;
            case 'transfer':
                this.openTransferModal(member);
                break;
            case 'remove':
                this.confirmRemoveMember(member);
                break;
        }
    }

    private openInviteModal(): void {
        const modal = this.container.querySelector('#invite-modal');
        modal?.classList.add('modal-overlay--visible');
        (this.container.querySelector('#invite-email') as HTMLInputElement)?.focus();
    }

    private openRoleModal(member: ProjectMember): void {
        const modal = this.container.querySelector('#role-modal');
        const userName = this.container.querySelector('#role-user-name');
        if (userName) userName.textContent = member.user_name || '';
        
        // Pre-select current role
        const radio = this.container.querySelector(`input[value="${member.role}"]`) as HTMLInputElement;
        if (radio) radio.checked = true;

        modal?.classList.add('modal-overlay--visible');
    }

    private openTransferModal(member: ProjectMember): void {
        const modal = this.container.querySelector('#transfer-modal');
        const userName = this.container.querySelector('#transfer-user-name');
        if (userName) userName.textContent = member.user_name || '';
        modal?.classList.add('modal-overlay--visible');
    }

    private closeModal(modalId: string): void {
        const modal = this.container.querySelector(`#${modalId}`);
        modal?.classList.remove('modal-overlay--visible');
        this.selectedMemberId = null;
    }

    private async handleInvite(e: Event): Promise<void> {
        e.preventDefault();
        const emailInput = this.container.querySelector('#invite-email') as HTMLInputElement;
        const email = emailInput?.value.trim();

        if (!email) return;

        try {
            await ProjectService.inviteUser(this.projectId, email);
            (window as any).toast?.success('Convite enviado com sucesso!');
            this.closeModal('invite-modal');
            emailInput.value = '';
            this.loadData(); // Reload to show new invite
        } catch (error: any) {
            (window as any).toast?.error(error.message || 'Erro ao enviar convite');
        }
    }

    private async handleRoleChange(): Promise<void> {
        if (!this.selectedMemberId) return;

        const selectedRole = (this.container.querySelector('input[name="member-role"]:checked') as HTMLInputElement)?.value as ProjectRole;
        if (!selectedRole) return;

        try {
            await ProjectService.updateMemberRole(this.projectId, this.selectedMemberId, selectedRole);
            (window as any).toast?.success('Papel atualizado com sucesso!');
            this.closeModal('role-modal');
            this.loadData();
        } catch (error: any) {
            (window as any).toast?.error(error.message || 'Erro ao atualizar papel');
        }
    }

    private async handleTransfer(): Promise<void> {
        if (!this.selectedMemberId) return;

        try {
            await ProjectService.transferOwnership(this.projectId, this.selectedMemberId);
            (window as any).toast?.success('Propriedade transferida com sucesso!');
            this.closeModal('transfer-modal');
            this.loadData();
        } catch (error: any) {
            (window as any).toast?.error(error.message || 'Erro ao transferir propriedade');
        }
    }

    private async confirmRemoveMember(member: ProjectMember): Promise<void> {
        const confirmed = confirm(`Tem certeza que deseja remover ${member.user_name} do projeto?`);
        if (!confirmed) return;

        try {
            const result = await ProjectService.removeMember(this.projectId, member.user_id);
            
            let message = 'Membro removido com sucesso!';
            if (result.tasksAffected > 0) {
                message += ` ${result.tasksAffected} tarefa(s) ficaram sem responsável.`;
            }
            
            (window as any).toast?.success(message);
            this.loadData();
        } catch (error: any) {
            (window as any).toast?.error(error.message || 'Erro ao remover membro');
        }
    }

    private async cancelInvite(inviteId: number): Promise<void> {
        try {
            await InviteService.cancel(inviteId);
            (window as any).toast?.info('Convite cancelado');
            this.loadData();
        } catch (error: any) {
            (window as any).toast?.error(error.message || 'Erro ao cancelar convite');
        }
    }
}
