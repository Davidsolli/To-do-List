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
    private static currentOpenMenu: ContextMenu | null = null;

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
        // Se já existe um menu aberto para o mesmo ID, apenas fecha (toggle)
        if (ContextMenu.currentOpenMenu &&
            ContextMenu.currentOpenMenu.menuId === this.menuId) {
            ContextMenu.hideAll();
            return;
        }

        // Remove ALL existing menus before creating a new one
        ContextMenu.hideAll();

        // Create and append menu to document
        const div = document.createElement('div');
        div.innerHTML = this.render();
        this.element = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.element);

        // Position menu relative to trigger element
        this.positionMenu(triggerElement);

        // Show menu with animation
        requestAnimationFrame(() => {
            if (this.element) {
                this.element.classList.add('context-menu--visible');
            }
        });

        // Bind internal events
        this.bindEvents();

        // Marcar como menu atualmente aberto
        ContextMenu.currentOpenMenu = this;

        // Inicia a escuta global para fechar ao clicar fora, se ainda não estiver ativa
        ContextMenu.initGlobalClickListener();
    }

    private positionMenu(triggerElement: HTMLElement): void {
        if (!this.element) return;

        const rect = triggerElement.getBoundingClientRect();
        const menuWidth = 160;

        let top = rect.bottom + 8;
        let left = rect.left;

        // Adjust if menu would go off-screen horizontally
        if (left + menuWidth > window.innerWidth) {
            left = rect.right - menuWidth;
        }

        this.element.style.top = `${top}px`;
        this.element.style.left = `${left}px`;
    }

    private bindEvents(): void {
        if (!this.element) return;

        const editBtn = this.element.querySelector('[data-action="edit"]');
        const deleteBtn = this.element.querySelector('[data-action="delete"]');

        editBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.options.onEdit?.(this.options.id);
            this.hide();
        });

        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.options.onDelete?.(this.options.id);
            this.hide();
        });
    }

    /**
     * Esconde apenas esta instância
     */
    hide(): void {
        if (this.element) {
            this.element.classList.remove('context-menu--visible');
            const el = this.element;
            setTimeout(() => {
                el.remove();
            }, 200);
            this.element = null;
        }

        if (ContextMenu.currentOpenMenu === this) {
            ContextMenu.currentOpenMenu = null;
        }
    }

    /**
     * Limpeza global de todos os menus e listeners
     */
    static hideAll(): void {
        if (ContextMenu.currentOpenMenu) {
            ContextMenu.currentOpenMenu.hide();
        }
        // Fallback: remover qualquer elemento que tenha sobrado no DOM
        const menus = document.querySelectorAll('.context-menu');
        menus.forEach(menu => menu.remove());
        ContextMenu.currentOpenMenu = null;
    }

    // Gestão global de cliques para fechar menus
    private static isGlobalListenerActive = false;

    private static initGlobalClickListener(): void {
        if (ContextMenu.isGlobalListenerActive) return;

        document.addEventListener('click', ContextMenu.handleGlobalClick, true); // Use capture phase
        ContextMenu.isGlobalListenerActive = true;
    }

    private static handleGlobalClick = (e: MouseEvent): void => {
        // Se não houver menu aberto, não faz nada
        if (!ContextMenu.currentOpenMenu) return;

        const target = e.target as HTMLElement;
        const menuElement = ContextMenu.currentOpenMenu.element;

        // Se o clique foi fora do menu aberto, fecha ele
        if (menuElement && !menuElement.contains(target)) {
            // Pequeno delay para permitir que eventos de botões internos (se houver) processem
            // Ou simplesmente fechar se não for o botão de trigger (que já tem stopPropagation)
            ContextMenu.hideAll();
        }
    };
}
