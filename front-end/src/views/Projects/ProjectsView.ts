import { Component } from '../../core/Component';
import template from './ProjectsView.html';
import './ProjectsView.css';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import { Project } from '../../models/Project';
import { ProjectService } from '../../services/ProjectService';
import { ProjectModal } from '../../components/ProjectModal/ProjectModal';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import { Button } from '../../components/Button/Button';
import { app } from '../../App';
import { ProjectRole } from '../../models/Collaboration';

export class ProjectsView extends Component {
    private projects: Project[] = [];
    private filteredProjects: Project[] = [];
    private currentPage: number = 1;
    private totalPages: number = 1;
    private itemsPerPage: number = 12;

    getTemplate(): string {
        const btnNewProject = new Button({
            text: 'Novo Projeto',
            variant: 'primary',
            action: 'new-project',
            icon: 'fa-solid fa-plus'
        });

        return template.replace('{{btn_new_project}}', btnNewProject.render());
    }

    protected async afterRender(): Promise<void> {
        await this.loadProjects();
        this.renderProjects();
        this.bindEvents();
    }

    private async loadProjects(): Promise<void> {
        try {
            this.projects = await ProjectService.getUserProjects();
            this.filteredProjects = this.projects;
        } catch (error) {
            console.error('Failed to load projects', error);
            this.projects = [];
            this.filteredProjects = [];
        }
    }

    private renderProjects(): void {
        const list = this.container.querySelector('[data-bind="projects-list"]') as HTMLElement;
        const emptyState = this.container.querySelector('[data-bind="empty-state"]') as HTMLElement;

        if (!list || !emptyState) return;

        list.innerHTML = '';

        if (this.filteredProjects.length === 0) {
            list.style.display = 'none';
            emptyState.style.display = 'block';
            this.updatePagination();
            return;
        }

        list.style.display = 'grid';
        emptyState.style.display = 'none';

        // Calcular paginação
        this.totalPages = Math.ceil(this.filteredProjects.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProjects = this.filteredProjects.slice(startIndex, endIndex);

        paginatedProjects.forEach(project => {
            const card = new ProjectCard(project);
            const cardHtml = card.render();

            const wrapper = document.createElement('div');
            wrapper.innerHTML = cardHtml;
            const cardElement = wrapper.firstElementChild as HTMLElement;

            list.appendChild(cardElement);

            // Bind eventos do card
            const accessBtn = cardElement.querySelector('[data-action="access-project"]');
            accessBtn?.addEventListener('click', () => {
                app.navigate(`/projetos/${project.id}`);
            });

            const menuBtn = cardElement.querySelector('[data-action="menu"]');
            menuBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showProjectMenu(menuBtn as HTMLElement, project);
            });
        });

        this.updatePagination();
    }

    private updatePagination(): void {
        const pageInfo = this.container.querySelector('#page-info');
        const prevBtn = this.container.querySelector('#btn-prev-page') as HTMLButtonElement;
        const nextBtn = this.container.querySelector('#btn-next-page') as HTMLButtonElement;

        if (pageInfo) pageInfo.textContent = `Página ${this.currentPage} de ${this.totalPages}`;
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= this.totalPages;
    }

    private showProjectMenu(triggerElement: HTMLElement, project: Project): void {
        // Determinar permissões baseadas no role
        const role = project.role;
        if (!role) return; // Se não tem role, não mostra menu
        
        const showEdit = role === ProjectRole.OWNER || role === ProjectRole.ADMIN;
        const showDelete = role === ProjectRole.OWNER;

        const menu = new ContextMenu({
            id: project.id,
            showEdit,
            showDelete,
            onEdit: () => {
                this.openEditModal(project);
            },
            onDelete: () => {
                this.handleDeleteProject(project);
            }
        });

        menu.show(triggerElement);
    }

    private bindEvents(): void {
        const view = this.container.querySelector('.projects-container');
        if (!view) return;

        const searchInput = view.querySelector<HTMLInputElement>('[data-action="search"]');

        searchInput?.addEventListener('input', () => {
            const value = searchInput.value.toLowerCase();

            this.filteredProjects = this.projects.filter(project =>
                project.name.toLowerCase().includes(value) ||
                (project.description && project.description.toLowerCase().includes(value))
            );

            this.currentPage = 1;
            this.renderProjects();
        });

        const newProjectBtn = view.querySelector('[data-action="new-project"]');
        newProjectBtn?.addEventListener('click', () => this.openCreateModal());

        // Pagination
        this.container.querySelector("#btn-prev-page")?.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderProjects();
                this.container.querySelector('.projects-grid')?.scrollIntoView({ behavior: 'smooth' });
            }
        });

        this.container.querySelector("#btn-next-page")?.addEventListener("click", () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.renderProjects();
                this.container.querySelector('.projects-grid')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    private openCreateModal(): void {
        const modal = new ProjectModal({
            mode: 'create',
            onSuccess: (project) => {
                this.projects.push(project);
                this.filteredProjects = this.projects;
                this.renderProjects();
                app.sidebar?.refreshProjectsList();
            }
        });

        modal.show();
    }

    private openEditModal(project: Project): void {
        const modal = new ProjectModal({
            mode: 'edit',
            projectId: project.id,
            onSuccess: (updatedProject) => {
                const index = this.projects.findIndex(p => p.id === project.id);
                if (index !== -1) {
                    this.projects[index] = updatedProject;
                    this.filteredProjects = this.projects;
                    this.renderProjects();
                    app.sidebar?.refreshProjectsList();
                }
            }
        });

        modal.show();
    }

    private handleDeleteProject(project: Project): void {
        const dialog = new ConfirmDialog({
            title: 'Excluir Projeto',
            message: `Tem certeza que deseja excluir o projeto "${project.name}"? Esta ação não pode ser desfeita.`,
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    await ProjectService.deleteProject(project.id);
                    this.projects = this.projects.filter(p => p.id !== project.id);
                    this.filteredProjects = this.projects;
                    this.renderProjects();
                    app.sidebar?.refreshProjectsList();
                } catch (error) {
                    console.error('Failed to delete project', error);
                }
            }
        });

        dialog.show();
    }
}
