import template from './ContextMenu.html';
import './ContextMenu.css';

export interface ContextMenuOptions {
    id: string | number;
    onEdit?: (id: string | number) => void;
    onDelete?: (id: string | number) => void;
}

export class ContextMenu {
    private menuId: string;
    private element: HTMLElement | null = null;
    private options: ContextMenuOptions;

    constructor(options: ContextMenuOptions) {
        this.options = options;
        this.menuId = `menu-${options.id}`;
    }

    render(): string {
        return template
            .replace('{{menuId}}', this.menuId)
            .replace(/{{id}}/g, this.options.id.toString());
    }

    show(triggerElement: HTMLElement): void {
        // Remove any existing menu
        this.hide();

        // Create and append menu to document
        const div = document.createElement('div');
        div.innerHTML = this.render();
        this.element = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.element);

        // Position menu relative to trigger element
        this.positionMenu(triggerElement);

        // Show menu with animation
        requestAnimationFrame(() => {
            this.element?.classList.add('context-menu--visible');
        });

        // Bind events
        this.bindEvents();

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', this.handleClickOutside);
        }, 0);
    }

    private positionMenu(triggerElement: HTMLElement): void {
        if (!this.element) return;

        const rect = triggerElement.getBoundingClientRect();
        const menuWidth = 160;
        const menuHeight = this.element.offsetHeight;

        let top = rect.bottom + 8;
        let left = rect.left;

        // Adjust if menu would go off-screen horizontally
        if (left + menuWidth > window.innerWidth) {
            left = rect.right - menuWidth;
        }

        // Adjust if menu would go off-screen vertically
        if (top + menuHeight > window.innerHeight) {
            top = rect.top - menuHeight - 8;
        }

        this.element.style.top = `${top}px`;
        this.element.style.left = `${left}px`;
    }

    private bindEvents(): void {
        if (!this.element) return;

        const editBtn = this.element.querySelector('[data-action="edit"]');
        const deleteBtn = this.element.querySelector('[data-action="delete"]');

        editBtn?.addEventListener('click', () => {
            this.options.onEdit?.(this.options.id);
            this.hide();
        });

        deleteBtn?.addEventListener('click', () => {
            this.options.onDelete?.(this.options.id);
            this.hide();
        });
    }

    private handleClickOutside = (e: Event): void => {
        if (this.element && !this.element.contains(e.target as Node)) {
            this.hide();
        }
    };

    hide(): void {
        if (this.element) {
            this.element.classList.remove('context-menu--visible');
            setTimeout(() => {
                this.element?.remove();
                this.element = null;
            }, 200);
        }
        document.removeEventListener('click', this.handleClickOutside);
    }

    static hideAll(): void {
        const menus = document.querySelectorAll('.context-menu');
        menus.forEach(menu => menu.remove());
    }
}
