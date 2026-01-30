import template from './ProjectModal.html';
import './ProjectModal.css';
import { ProjectService } from '../../services/ProjectService';
import { Project } from '../../models/Project';

export interface ProjectModalOptions {
    mode: 'create' | 'edit';
    projectId?: number;
    onSuccess?: (project: Project) => void;
    onCancel?: () => void;
}

export class ProjectModal {
    private overlay: HTMLElement | null = null;
    private options: ProjectModalOptions;
    private project: Project | null = null;

    constructor(options: ProjectModalOptions) {
        this.options = options;
    }

    async show(): Promise<void> {
        // Remove any existing modal
        this.hide();

        // Load project data if in edit mode
        if (this.options.mode === 'edit' && this.options.projectId) {
            try {
                this.project = await ProjectService.getProjectById(this.options.projectId);
            } catch (error) {
                console.error('Erro ao carregar projeto:', error);
                this.showError('Erro ao carregar projeto. Tente novamente.');
                return;
            }
        }

        // Create and append modal to document
        const div = document.createElement('div');
        div.innerHTML = this.render();
        this.overlay = div.firstElementChild as HTMLElement;
        document.body.appendChild(this.overlay);

        // Populate form if editing
        if (this.project) {
            this.populateForm();
        }

        // Show modal with animation
        requestAnimationFrame(() => {
            this.overlay?.classList.add('modal-overlay--visible');
        });

        // Bind events
        this.bindEvents();

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Focus first input
        const firstInput = this.overlay.querySelector('input') as HTMLInputElement;
        firstInput?.focus();
    }

    private render(): string {
        const title = this.options.mode === 'create' ? 'Novo Projeto' : 'Editar Projeto';
        const submitText = this.options.mode === 'create' ? 'Criar' : 'Salvar';

        return template
            .replace('{{title}}', title)
            .replace('{{submitText}}', submitText);
    }

    private populateForm(): void {
        if (!this.overlay || !this.project) return;

        const nameInput = this.overlay.querySelector('[data-bind="name"]') as HTMLInputElement;
        const descInput = this.overlay.querySelector('[data-bind="description"]') as HTMLTextAreaElement;

        if (nameInput) nameInput.value = this.project.name || '';
        if (descInput) descInput.value = this.project.description || '';
    }

    private bindEvents(): void {
        if (!this.overlay) return;

        const closeBtn = this.overlay.querySelector('[data-action="close"]');
        const cancelBtn = this.overlay.querySelector('[data-action="cancel"]');
        const saveBtn = this.overlay.querySelector('[data-action="save"]');
        const form = this.overlay.querySelector('[data-form="project"]') as HTMLFormElement;

        closeBtn?.addEventListener('click', () => {
            this.options.onCancel?.();
            this.hide();
        });

        cancelBtn?.addEventListener('click', () => {
            this.options.onCancel?.();
            this.hide();
        });

        saveBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.options.onCancel?.();
                this.hide();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', this.handleEscKey);
    }

    private async handleSubmit(): Promise<void> {
        if (!this.overlay) return;

        const nameInput = this.overlay.querySelector('[data-bind="name"]') as HTMLInputElement;
        const descInput = this.overlay.querySelector('[data-bind="description"]') as HTMLTextAreaElement;

        const name = nameInput?.value.trim();
        const description = descInput?.value.trim();

        // Validation
        if (!name) {
            this.showError('O nome do projeto é obrigatório.');
            nameInput?.focus();
            return;
        }

        // Disable buttons during save
        const saveBtn = this.overlay.querySelector('[data-action="save"]') as HTMLButtonElement;
        const cancelBtn = this.overlay.querySelector('[data-action="cancel"]') as HTMLButtonElement;

        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Salvando...';
        }
        if (cancelBtn) cancelBtn.disabled = true;

        try {
            let savedProject: Project;

            if (this.options.mode === 'create') {
                savedProject = await ProjectService.createProject(name, description);
            } else if (this.options.projectId) {
                savedProject = await ProjectService.updateProject(this.options.projectId, {
                    name,
                    description
                });
            } else {
                throw new Error('ID do projeto não fornecido');
            }

            this.options.onSuccess?.(savedProject);
            this.hide();
        } catch (error: any) {
            console.error('Erro ao salvar projeto:', error);
            this.showError(error.message || 'Erro ao salvar projeto. Tente novamente.');

            // Re-enable buttons
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.textContent = this.options.mode === 'create' ? 'Criar' : 'Salvar';
            }
            if (cancelBtn) cancelBtn.disabled = false;
        }
    }

    private showError(message: string): void {
        if (!this.overlay) return;

        const errorEl = this.overlay.querySelector('[data-bind="error"]') as HTMLElement;
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';

            setTimeout(() => {
                errorEl.style.display = 'none';
            }, 5000);
        }
    }

    private handleEscKey = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            this.options.onCancel?.();
            this.hide();
        }
    };

    hide(): void {
        if (this.overlay) {
            this.overlay.classList.remove('modal-overlay--visible');
            setTimeout(() => {
                this.overlay?.remove();
                this.overlay = null;
            }, 200);
        }
        document.removeEventListener('keydown', this.handleEscKey);
        document.body.style.overflow = '';
    }

    static hideAll(): void {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
        document.body.style.overflow = '';
    }
}
