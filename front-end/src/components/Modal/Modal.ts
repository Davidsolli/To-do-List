import template from './Modal.html';
import './Modal.css';

interface ModalProps {
  title: string;
  content: string;
  onClose?: () => void;
}

export class Modal {
  private overlay: HTMLElement | null = null;
  private props: ModalProps;

  constructor(props: ModalProps) {
    this.props = props;
  }

  /**
   * Renderiza o modal e o adiciona ao body
   */
  public open(): void {
    if (this.overlay) return;

    const modalHtml = template
      .replace('{{title}}', this.props.title)
      .replace('{{content}}', this.props.content);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    this.overlay = wrapper.firstElementChild as HTMLElement;

    document.body.appendChild(this.overlay);

    this.bindEvents();
    this.enableBodyScrollLock();

    setTimeout(() => {
      this.overlay?.classList.add('modal--open');
    }, 10);
  }

  /**
   * Fecha e remove o modal do DOM
   */
  public close(): void {
    if (!this.overlay) return;

    this.overlay.classList.remove('modal--open');

    setTimeout(() => {
      this.overlay?.remove();
      this.overlay = null;
      this.disableBodyScrollLock();

      if (this.props.onClose) {
        this.props.onClose();
      }
    }, 300);
  }

  /**
   * Vincula eventos de fechamento
   */
  private bindEvents(): void {
    if (!this.overlay) return;

    const closeBtn = this.overlay.querySelector('[data-action="close-modal"]');
    const backdrop = this.overlay.querySelector('[data-action="close-backdrop"]');

    closeBtn?.addEventListener('click', () => this.close());
    backdrop?.addEventListener('click', () => this.close());

    document.addEventListener('keydown', this.handleEscapeKey);
  }

  /**
   * Fecha o modal ao pressionar ESC
   */
  private handleEscapeKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.close();
      document.removeEventListener('keydown', this.handleEscapeKey);
    }
  };

  /**
   * Previne scroll no body quando modal está aberto
   */
  private enableBodyScrollLock(): void {
    document.body.style.overflow = 'hidden';
  }

  /**
   * Restaura scroll no body
   */
  private disableBodyScrollLock(): void {
    document.body.style.overflow = '';
  }

  /**
   * Retorna o elemento do modal para manipulação externa
   */
  public getElement(): HTMLElement | null {
    return this.overlay;
  }
}
