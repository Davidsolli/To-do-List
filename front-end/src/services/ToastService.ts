import template from '../components/Toast/Toast.html';
import '../components/Toast/Toast.css';

export type ToastType = 'success' | 'error' | 'alert' | 'info';

export class ToastService {
    private container: HTMLElement;

    constructor() {
        // Tenta encontrar ou cria o container
        let el = document.getElementById('toast-container');
        if (!el) {
            el = document.createElement('div');
            el.id = 'toast-container';
            document.body.appendChild(el);
        }
        this.container = el;
    }

    /**
     * Exibe um Toast na tela.
     * @param message A mensagem principal.
     * @param type O tipo do toast (success, error, alert, info).
     * @param title Opcional: Título da notificação (se não passado, assume um default baseado no tipo).
     * @param duration Duração em ms (default 3000ms).
     */
    public show(message: string, type: ToastType = 'info', title?: string, duration: number = 3000): void {
        const toastElement = document.createElement('div');

        // Dados de renderização
        const finalTitle = title || this.getDefaultTitle(type);
        const iconClass = this.getIcon(type);

        toastElement.innerHTML = template
            .replace('{{type}}', type)
            .replace('{{icon}}', iconClass)
            .replace('{{title}}', finalTitle)
            .replace('{{message}}', message);

        // Pega o primeiro filho (a div .toast)
        const toastNode = toastElement.firstElementChild as HTMLElement;

        // Adiciona ao container
        this.container.appendChild(toastNode);

        // Configura remoção automática
        const timeout = setTimeout(() => {
            this.removeToast(toastNode);
        }, duration);

        // Botão de fechar manual
        const closeBtn = toastNode.querySelector('[data-action="close"]');
        closeBtn?.addEventListener('click', () => {
            clearTimeout(timeout);
            this.removeToast(toastNode);
        });
    }

    public success(message: string, title?: string): void {
        this.show(message, 'success', title);
    }

    public error(message: string, title?: string): void {
        this.show(message, 'error', title);
    }

    public alert(message: string, title?: string): void {
        this.show(message, 'alert', title);
    }

    public info(message: string, title?: string): void {
        this.show(message, 'info', title);
    }

    private removeToast(element: HTMLElement): void {
        element.classList.add('toast--closing');
        element.addEventListener('animationend', () => {
            if (element.parentElement) {
                element.parentElement.removeChild(element);
            }
        });
    }

    private getDefaultTitle(type: ToastType): string {
        switch (type) {
            case 'success': return 'Sucesso!';
            case 'error': return 'Erro!';
            case 'alert': return 'Atenção!';
            case 'info': return 'Informação';
            default: return '';
        }
    }

    private getIcon(type: ToastType): string {
        switch (type) {
            case 'success': return 'fa-solid fa-circle-check';
            case 'error': return 'fa-solid fa-circle-xmark';
            case 'alert': return 'fa-solid fa-triangle-exclamation';
            case 'info': return 'fa-solid fa-circle-info';
            default: return 'fa-solid fa-info';
        }
    }
}

// Singleton Global
export const toast = new ToastService();
