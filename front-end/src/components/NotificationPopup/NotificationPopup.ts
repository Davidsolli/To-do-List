import { NotificationService } from '../../services/NotificationService';
import { InviteService } from '../../services/InviteService';
import { Notification, NotificationType, parseNotificationData } from '../../models/Collaboration';
import template from './NotificationPopup.html';
import './NotificationPopup.css';

export class NotificationPopup {
    private container: HTMLElement;
    private isOpen: boolean = false;
    private notifications: Notification[] = [];
    private unreadCount: number = 0;
    private pollInterval: ReturnType<typeof setInterval> | null = null;

    constructor(container: HTMLElement | string) {
        if (typeof container === 'string') {
            const el = document.getElementById(container);
            if (!el) {
                throw new Error(`Container #${container} not found`);
            }
            this.container = el;
        } else {
            this.container = container;
        }
        this.render();
        this.startPolling();
    }

    public isVisible(): boolean {
        return this.isOpen;
    }

    public show(): void {
        this.open();
    }

    public hide(): void {
        this.close();
    }

    public refresh(): void {
        this.loadNotifications();
    }

    private render(): void {
        this.container.innerHTML = template;
        this.bindEvents();
        this.loadNotifications();
    }

    private bindEvents(): void {
        // Mark all as read button
        const markAllBtn = this.container.querySelector('#btn-mark-all');
        markAllBtn?.addEventListener('click', () => this.markAllAsRead());

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.container.contains(e.target as Node)) {
                this.close();
            }
        });
    }

    public toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    public open(): void {
        const popup = this.container.querySelector('.notification-popup');
        popup?.classList.add('notification-popup--open');
        this.isOpen = true;
        // Render notifications when opening (they're already loaded from polling)
        this.renderNotifications();
    }

    public close(): void {
        const popup = this.container.querySelector('.notification-popup');
        popup?.classList.remove('notification-popup--open');
        this.isOpen = false;
    }

    private async loadNotifications(): Promise<void> {
        try {
            const { notifications, count } = await NotificationService.getUnread();
            
            // Always update the badge count
            this.unreadCount = count;
            this.updateBadge();
            
            // Only update the list if popup is open
            if (this.isOpen) {
                this.notifications = notifications.slice(0, 10); // Show max 10 in popup
                this.renderNotifications();
            } else {
                // Store notifications for when popup opens
                this.notifications = notifications.slice(0, 10);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    private renderNotifications(): void {
        const list = this.container.querySelector('#notification-list');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = '<div class="notification-popup__empty">Nenhuma notificação nova</div>';
            return;
        }

        list.innerHTML = this.notifications.map(n => this.renderNotificationItem(n)).join('');

        // Bind action buttons
        list.querySelectorAll('[data-accept]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const inviteId = parseInt((btn as HTMLElement).dataset.accept!);
                this.handleAcceptInvite(inviteId);
            });
        });

        list.querySelectorAll('[data-decline]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const inviteId = parseInt((btn as HTMLElement).dataset.decline!);
                this.handleDeclineInvite(inviteId);
            });
        });

        // Mark as read on click
        list.querySelectorAll('.notification-popup__item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt((item as HTMLElement).dataset.id!);
                this.handleNotificationClick(id);
            });
        });
    }

    private renderNotificationItem(notification: Notification): string {
        const data = parseNotificationData(notification.data);
        const iconClass = this.getIconClass(notification.type);
        const icon = this.getIcon(notification.type);
        const timeAgo = this.formatTimeAgo(notification.created_at);

        let actions = '';
        if (notification.type === NotificationType.INVITE && data?.invite_id) {
            actions = `
                <div class="notification-popup__actions">
                    <button class="notification-popup__action-btn notification-popup__action-btn--accept" data-accept="${data.invite_id}">
                        Aceitar
                    </button>
                    <button class="notification-popup__action-btn notification-popup__action-btn--decline" data-decline="${data.invite_id}">
                        Recusar
                    </button>
                </div>
            `;
        }

        return `
            <div class="notification-popup__item ${notification.read ? '' : 'notification-popup__item--unread'}" 
                 data-id="${notification.id}">
                <div class="notification-popup__icon ${iconClass}">
                    <span class="material-icons-outlined">${icon}</span>
                </div>
                <div class="notification-popup__content">
                    <p class="notification-popup__message">${notification.message}</p>
                    <span class="notification-popup__time">${timeAgo}</span>
                    ${actions}
                </div>
            </div>
        `;
    }

    private getIconClass(type: NotificationType): string {
        const classes: Record<string, string> = {
            [NotificationType.INVITE]: 'notification-popup__icon--invite',
            [NotificationType.ROLE_CHANGE]: 'notification-popup__icon--role',
            [NotificationType.ADMIN_PROMOTED]: 'notification-popup__icon--role',
            [NotificationType.REMOVED]: 'notification-popup__icon--removed',
            [NotificationType.ASSIGNMENT]: 'notification-popup__icon--assignment',
        };
        return classes[type] || '';
    }

    private getIcon(type: NotificationType): string {
        const icons: Record<string, string> = {
            [NotificationType.INVITE]: 'mail',
            [NotificationType.ROLE_CHANGE]: 'admin_panel_settings',
            [NotificationType.ADMIN_PROMOTED]: 'star',
            [NotificationType.REMOVED]: 'person_remove',
            [NotificationType.ASSIGNMENT]: 'assignment_ind',
        };
        return icons[type] || 'notifications';
    }

    private formatTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        return date.toLocaleDateString('pt-BR');
    }

    private updateBadge(): void {
        const badge = this.container.querySelector('#notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount.toString();
            badge.classList.toggle('notification-popup__badge--empty', this.unreadCount === 0);
        }

        // Update all notification badges in the sidebar
        const badges = [
            document.querySelector('#notificationBadge'),
            document.querySelector('#mobileNotificationBadge'),
            document.querySelector('#sidebarNotificationBadge')
        ];

        badges.forEach(badge => {
            if (badge) {
                if (this.unreadCount > 0) {
                    badge.textContent = this.unreadCount > 99 ? '99+' : String(this.unreadCount);
                    (badge as HTMLElement).style.display = 'flex';
                } else {
                    (badge as HTMLElement).style.display = 'none';
                }
            }
        });
    }

    private async handleNotificationClick(id: number): Promise<void> {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;

        // Mark as read
        if (!notification.read) {
            await NotificationService.markAsRead(id);
            notification.read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.updateBadge();
        }

        // Navigate based on type
        const data = parseNotificationData(notification.data);
        if (data?.project_id) {
            window.location.href = `/projetos/${data.project_id}`;
            this.close();
        }
    }

    private async handleAcceptInvite(inviteId: number): Promise<void> {
        try {
            await InviteService.accept(inviteId);
            (window as any).toast?.success('Convite aceito! Você agora faz parte do projeto.');
            this.loadNotifications();
        } catch (error: any) {
            (window as any).toast?.error(error.message || 'Erro ao aceitar convite');
        }
    }

    private async handleDeclineInvite(inviteId: number): Promise<void> {
        try {
            await InviteService.decline(inviteId);
            (window as any).toast?.info('Convite recusado');
            this.loadNotifications();
        } catch (error: any) {
            (window as any).toast?.error(error.message || 'Erro ao recusar convite');
        }
    }

    private async markAllAsRead(): Promise<void> {
        try {
            await NotificationService.markAllAsRead();
            this.notifications.forEach(n => n.read = true);
            this.unreadCount = 0;
            this.renderNotifications();
            this.updateBadge();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    }

    private startPolling(): void {
        // Poll every 15 seconds for new notifications (more frequent for better UX)
        this.pollInterval = setInterval(async () => {
            await this.loadNotifications();
        }, 15000);
    }

    public destroy(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    public getUnreadCount(): number {
        return this.unreadCount;
    }
}
