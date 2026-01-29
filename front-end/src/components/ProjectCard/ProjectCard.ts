import template from './ProjectCard.html';
import './ProjectCard.css';
import { Project } from '../../models/Project';

interface ProjectCardOptions {
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export class ProjectCard {
  private element: HTMLElement;
  private dropdown: HTMLElement | null = null;

  constructor(
    private project: Project,
    private options?: ProjectCardOptions
  ) {
    // Cria um container temporário para fazer o parse do HTML
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template;

    // Pega o primeiro elemento (o article)
    this.element = wrapper.firstElementChild as HTMLElement;

    this.dropdown = this.element.querySelector('[data-dropdown]');

    this.bindData();
    this.bindEvents();
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  private bindData(): void {
    const nameEl = this.element.querySelector('[data-bind="name"]');
    const descEl = this.element.querySelector('[data-bind="description"]');
    const initialEl = this.element.querySelector('[data-bind="initial"]');

    if (nameEl) nameEl.textContent = this.project.name;
    if (descEl) descEl.textContent = this.project.description;
    if (initialEl) initialEl.textContent = this.project.name.charAt(0);
  }

  private bindEvents(): void {
    const btn = this.element.querySelector('[data-action="access"]');

    btn?.addEventListener('click', () => {
      window.history.pushState(
        {},
        '',
        `/projects/${this.project.id}`
      );

      // Dispara evento para o Router detectar a mudança
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    const menuBtn = this.element.querySelector('[data-action="menu"]');
    menuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    const editBtn = this.element.querySelector('[data-action="edit"]');
    editBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeDropdown();
      this.options?.onEdit?.(this.project);
    });

    const deleteBtn = this.element.querySelector('[data-action="delete"]');
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeDropdown();
      this.options?.onDelete?.(this.project);
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
      if (!this.element.contains(e.target as Node)) {
        this.closeDropdown();
      }
    });
  }

  private toggleDropdown(): void {
    if (!this.dropdown) return;

    const isOpen = this.dropdown.classList.contains('show');

    // Fecha todos os dropdowns abertos
    document.querySelectorAll('.project-card__dropdown.show').forEach(dropdown => {
      dropdown.classList.remove('show');
    });

    // Abre o dropdown atual se estava fechado
    if (!isOpen) {
      this.dropdown.classList.add('show');
    }
  }

  private closeDropdown(): void {
    this.dropdown?.classList.remove('show');
  }
}
