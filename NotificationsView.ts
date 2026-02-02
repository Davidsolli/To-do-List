import { Component } from '../../core/Component';
import template from './NotificationsView.html';
import './NotificationsView.css';
import { NotificationService } from "../../services/NotificationService";
import { InviteService } from "../../services/InviteService";
import { Notification, NotificationType, parseNotificationData } from "../../models/Collaboration";
import { app } from "../../App";

export class NotificationsView extends Component {
    private currentPage: number = 1;
    private totalPages: number = 1;
    private notifications: Notification[] = [];

    getTemplate(): string {
        return template;
    }

    protected afterRender(): void {
        this.bindEvents();
        this.loadNotifications();
    }

    private bindEvents() {
        const btnMarkAll = this.container.querySelector("#btn-mark-all-read");
        if (btnMarkAll) {
            btnMarkAll.addEventListener("click", () => this.markAllAsRead());
        }

        // Pagination
        this.container.querySelector("#btn-prev-page")?.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadNotifications();
            }
        });

        this.container.querySelector("#btn-next-page")?.addEventListener("click", () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.loadNotifications();
            }
        });
    }

    private async loadNotifications() {
        try {
            const result = await NotificationService.getAll(this.currentPage, 20);
            this.notifications = result.notifications;
            this.totalPages = Math.ceil(result.total / 20) || 1;
            this.renderNotifications();
            this.updatePagination();
        } catch (error) {
            (window as any).toast?.error("Erro ao carregar notificações");
        }
    }

    private renderNotifications() {
        const container = this.container.querySelector("#notifications-list");
        if (!container) return;

        container.innerHTML = "";

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="notifications-empty">
                    <span class="material-icons-outlined">notifications_off</span>
                    <p>Nenhuma notificação encontrada</p>
                </div>
            `;
            return;
        }

        this.notifications.forEach(n => {
            const item = document.createElement("div");
            item.className = `notification-card ${n.read ? 'notification-card--read' : 'notification-card--unread'}`;

            const data = parseNotificationData(n.data);
            const icon = this.getNotificationIcon(n.type);
            const iconClass = this.getIconClass(n.type);

            let actions = '';
            if (n.type === NotificationType.INVITE && data?.invite_id) {
                actions = `
                    <div class="notification-card__actions">
                        <button class="btn btn--success btn--sm" data-accept="${data.invite_id}">Aceitar</button>
                        <button class="btn btn--secondary btn--sm" data-decline="${data.invite_id}">Recusar</button>
                    </div>
                `;
            }

            item.innerHTML = `
                <div class="notification-card__icon ${iconClass}">
                    <span class="material-icons-outlined">${icon}</span>
                </div>
                <div class="notification-card__content">
                    <p class="notification-card__message">${n.message}</p>
                    <span class="notification-card__time">${this.formatDate(n.created_at)}</span>
                    ${actions}
                </div>
                <div class="notification-card__actions-secondary">
                    ${!n.read ? `
                        <button class="btn-icon" title="Marcar como lida" data-mark-read="${n.id}">
                            <span class="material-icons-outlined">done</span>
                        </button>
                    ` : ''}
                    <button class="btn-icon btn-icon--danger" title="Excluir" data-delete="${n.id}">
                        <span class="material-icons-outlined">delete_outline</span>
                    </button>
                </div>
            `;

            // Bind event listeners
            const btnRead = item.querySelector('[data-mark-read]');
            btnRead?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.markAsRead(n.id);
            });

            const btnDelete = item.querySelector('[data-delete]');
            btnDelete?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteNotification(n.id);
            });

            const btnAccept = item.querySelector('[data-accept]');
            btnAccept?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.acceptInvite(parseInt((btnAccept as HTMLElement).dataset.accept!));
            });

            const btnDecline = item.querySelector('[data-decline]');
            btnDecline?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.declineInvite(parseInt((btnDecline as HTMLElement).dataset.decline!));
            });

            // Click on card to navigate
            if (data?.project_id) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    if (!n.read) this.markAsRead(n.id);
                    window.location.href = `/projetos/${data.project_id}`;
                });
            }

            container.appendChild(item);
        });
    }

    private getNotificationIcon(type: NotificationType): string {
        const icons: Record<string, string> = {
            [NotificationType.INVITE]: 'mail',
            [NotificationType.ROLE_CHANGE]: 'admin_panel_settings',
            [NotificationType.ADMIN_PROMOTED]: 'star',
            [NotificationType.REMOVED]: 'person_remove',
            [NotificationType.ASSIGNMENT]: 'assignment_ind',
        };
        return icons[type] || 'notifications';
    }

    private getIconClass(type: NotificationType): string {
        const classes: Record<string, string> = {
            [NotificationType.INVITE]: 'notification-card__icon--invite',
            [NotificationType.ROLE_CHANGE]: 'notification-card__icon--role',
            [NotificationType.ADMIN_PROMOTED]: 'notification-card__icon--role',
            [NotificationType.REMOVED]: 'notification-card__icon--removed',
            [NotificationType.ASSIGNMENT]: 'notification-card__icon--assignment',
        };
        return classes[type] || '';
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();

        // Se a diferença for negativa ou muito pequena (menos de 1 minuto), mostrar "Agora"
        if (diffMs < 60000) {
            return 'Agora';
        }

        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        // Menos de 1 hora
        if (diffMinutes < 60) {
            return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''} atrás`;
        }

        // Menos de 24 horas
        if (diffHours < 24) {
            return `${diffHours} hora${diffHours !== 1 ? 's' : ''} atrás`;
        }

        // Hoje (mesmo dia)
        if (diffDays === 0) {
            return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Ontem
        if (diffDays === 1) {
            return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Menos de 7 dias
        if (diffDays < 7) {
            return `${diffDays} dias atrás`;
        }

        // Mais de 7 dias - mostrar data completa
        return date.toLocaleDateString('pt-BR');
    }

    private updatePagination(): void {
        const pageInfo = this.container.querySelector('#page-info');
        const prevBtn = this.container.querySelector('#btn-prev-page') as HTMLButtonElement;
        const nextBtn = this.container.querySelector('#btn-next-page') as HTMLButtonElement;

        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    }

    private async markAsRead(id: number) {
        try {
            await NotificationService.markAsRead(id);
            const notification = this.notifications.find(n => n.id === id);
            if (notification) notification.read = true;
            this.renderNotifications();
        } catch (error) {
            console.error(error);
        }
    }

    private async deleteNotification(id: number) {
        try {
            await NotificationService.delete(id);
            this.notifications = this.notifications.filter(n => n.id !== id);
            this.renderNotifications();
        } catch (error) {
            (window as any).toast?.error("Erro ao excluir notificação");
        }
    }

    private async markAllAsRead() {
        try {
            await NotificationService.markAllAsRead();
            this.notifications.forEach(n => n.read = true);
            this.renderNotifications();
            (window as any).toast?.success("Todas as notificações marcadas como lidas");
        } catch (error) {
            (window as any).toast?.error("Erro ao marcar todas como lidas");
        }
    }

    private async acceptInvite(inviteId: number) {
        try {
            await InviteService.accept(inviteId);
            (window as any).toast?.success("Convite aceito! Você agora faz parte do projeto.");
            app.sidebar?.refreshProjectsList();
            this.loadNotifications();
        } catch (error: any) {
            (window as any).toast?.error(error.message || "Erro ao aceitar convite");
        }
    }

    private async declineInvite(inviteId: number) {
        try {
            await InviteService.decline(inviteId);
            (window as any).toast?.info("Convite recusado");
            this.loadNotifications();
        } catch (error: any) {
            (window as any).toast?.error(error.message || "Erro ao recusar convite");
        }
    }
}
