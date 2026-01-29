import { Component } from '../../core/Component';
import template from './ProjectsView.html';
import './ProjectsView.css';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import { Project } from '../../models/Project';
import { ProjectService } from '../../services/ProjectService';
import { Modal } from '../../components/Modal/Modal';
import { ProjectForm } from '../../components/ProjectForm/ProjectForm';
import { AuthService } from '../../services/AuthService';

export class ProjectsView extends Component {
    private projects: Project[] = [];
    private filteredProjects: Project[] = [];
    private currentModal: Modal | null = null;

    getTemplate(): string {
        return template;
    }

    protected async afterRender(): Promise<void> {
        this.bindEvents();
        await this.loadProjects();
        this.renderProjects();
    }

    private async loadProjects(): Promise<void> {
        try {
            const user = AuthService.user;
            if (!user) {
                console.error('User not authenticated');
                this.projects = [];
                this.filteredProjects = [];
                return;
            }

            this.projects = await ProjectService.getAll(user.id);
            this.filteredProjects = this.projects;
        } catch (error) {
            console.error('Failed to load projects', error);
            // TODO: Show nice error message
            this.projects = [];
            this.filteredProjects = [];
        }
    }

    private renderProjects(): void {
        const list = this.container.querySelector(
            '[data-bind="projects-list"]'
        );

        const emptyState = this.container.querySelector(
            '[data-bind="empty-state"]'
        );

        if (!list || !emptyState) return;

        list.innerHTML = '';

        if (this.filteredProjects.length === 0) {
            emptyState.removeAttribute('hidden');
            return;
        }

        emptyState.setAttribute('hidden', 'true');

        this.filteredProjects.forEach(project => {
            const card = new ProjectCard(project, {
                onEdit: (p) => this.openEditModal(p),
                onDelete: (p) => this.handleDeleteProject(p)
            });
            list.appendChild(card.getElement());
        });
    }

    private bindEvents(): void {
        const searchInput = this.container.querySelector<HTMLInputElement>(
            '[data-action="search"]'
        );

        searchInput?.addEventListener('input', () => {
            const value = searchInput.value.toLowerCase();

            this.filteredProjects = this.projects.filter(project =>
                project.name.toLowerCase().includes(value) ||
                project.description.toLowerCase().includes(value)
            );

            this.renderProjects();
        });

        const newProjectBtn = this.container.querySelector(
            '[data-action="new-project"]'
        );

        const emptyNewBtn = this.container.querySelector(
            '[data-action="empty-new-project"]'
        );

        newProjectBtn?.addEventListener('click', () => this.openCreateModal());
        emptyNewBtn?.addEventListener('click', () => this.openCreateModal());
    }

    private openCreateModal(): void {
        console.log('openCreateModal called');

        const form = new ProjectForm({
            onSubmit: (project) => this.handleCreateProject(project),
            onCancel: () => this.closeModal()
        });

        this.currentModal = new Modal({
            title: 'Criar Novo Projeto',
            content: form.render(),
            onClose: () => {
                this.currentModal = null;
            }
        });

        console.log('Opening modal...');
        this.currentModal.open();

        // Aguarda o próximo ciclo do event loop para garantir que o DOM está pronto
        setTimeout(() => {
            const modalElement = this.currentModal?.getElement();
            console.log('Modal element:', modalElement);
            if (modalElement) {
                form.bindEvents(modalElement);
                console.log('Events bound successfully');
            }
        }, 0);
    }

    private async handleCreateProject(project: Partial<Project>): Promise<void> {
        try {
            const user = AuthService.user;
            if (!user) {
                console.error('User not authenticated');
                return;
            }

            const projectWithUser = {
                ...project,
                user_id: user.id
            };

            const createdProject = await ProjectService.create(projectWithUser);
            this.projects.push(createdProject);
            this.filteredProjects = this.projects;
            this.renderProjects();
            this.closeModal();
        } catch (error) {
            console.error('Failed to create project', error);
            // TODO: Show error toast
        }
    }

    private openEditModal(project: Project): void {
        const form = new ProjectForm({
            initialData: project,
            onSubmit: (updatedData) => this.handleUpdateProject(project.id, updatedData),
            onCancel: () => this.closeModal()
        });

        this.currentModal = new Modal({
            title: 'Editar Projeto',
            content: form.render(),
            onClose: () => {
                this.currentModal = null;
            }
        });

        this.currentModal.open();

        setTimeout(() => {
            const modalElement = this.currentModal?.getElement();
            if (modalElement) {
                form.bindEvents(modalElement);
            }
        }, 0);
    }

    private async handleUpdateProject(id: string, project: Partial<Project>): Promise<void> {
        try {
            const updatedProject = await ProjectService.update(id, project);
            const index = this.projects.findIndex(p => p.id === id);
            if (index !== -1) {
                this.projects[index] = updatedProject;
                this.filteredProjects = this.projects;
                this.renderProjects();
            }
            this.closeModal();
        } catch (error) {
            console.error('Failed to update project', error);
        }
    }

    private async handleDeleteProject(project: Project): Promise<void> {
        const confirmed = confirm(`Tem certeza que deseja deletar o projeto "${project.name}"?`);

        if (!confirmed) return;

        try {
            await ProjectService.delete(project.id);
            this.projects = this.projects.filter(p => p.id !== project.id);
            this.filteredProjects = this.projects;
            this.renderProjects();
        } catch (error) {
            console.error('Failed to delete project', error);
        }
    }

    private closeModal(): void {
        if (this.currentModal) {
            this.currentModal.close();
        }
    }
}
