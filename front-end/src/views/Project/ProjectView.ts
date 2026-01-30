import { Component } from '../../core/Component';
import { TaskCard } from '../../components/TaskCard/TaskCard';
import { Task, TaskStatus, TaskPriority } from '../../models/Task';
import { Project } from '../../models/Project';
import { ProjectService } from '../../services/ProjectService';
import { TaskService } from '../../services/TaskService';
import template from './KanbanView.html'; // Usando o template do Kanban
import './KanbanView.css';                // Usando o CSS do Kanban

export class ProjectView extends Component {
    private projectId: string | null = null;

    // Armazena o projeto carregado para uso interno
    private currentProject: Project | null = null;

    getTemplate(): string {
        return template;
    }

    protected async afterRender(): Promise<void> {
        // 1. Tenta pegar o ID da URL (?id=123)
        const params = new URLSearchParams(window.location.search);
        this.projectId = params.get('id');

        // Se não tiver ID, usa um fallback para desenvolvimento
        if (!this.projectId) {
            console.warn('ID do projeto não fornecido, voltando...');
            // window.history.back();
            return;
        }

        // 2. Busca os dados
        try {
            const data = await ProjectService.getById(this.projectId);
            this.updateHeader(data.project);
            this.renderTasks(data.tasks);
        } catch (err) {
            console.error(err);
            // Redirecionar ou mostrar erro
        }

        // 4. Bind de eventos específicos da página (botão Nova Tarefa, filtros, etc)
        this.bindPageEvents();
        this.bindDragEvents();
    }

    private async loadProjectData(): Promise<void> {
        if (!this.projectId) return;
        try {
            const data = await ProjectService.getById(this.projectId);
            this.currentProject = data.project;
            this.updateHeader(data.project);
            this.renderTasks(data.tasks);
        } catch (err: any) {
            console.error(err);
            (window as any).toast.error(err.message || 'Erro ao carregar projeto.');
        }
    }

    private bindPageEvents(): void {
        const btnAdd = this.container.querySelector('#btn-add-task');
        btnAdd?.addEventListener('click', () => {
            this.handleAddTask();
        });

        // Project Actions
        this.container.querySelector('#btn-edit-project')?.addEventListener('click', () => this.handleEditProject());
        this.container.querySelector('#btn-delete-project')?.addEventListener('click', () => this.handleDeleteProject());
    }

    private bindDragEvents() {
        const columns = this.container.querySelectorAll('.kanban-column');
        columns.forEach(col => {
            col.addEventListener('dragover', (e: Event) => {
                const dragEvent = e as DragEvent;
                dragEvent.preventDefault();
                dragEvent.dataTransfer!.dropEffect = 'move';
                col.classList.add('drag-over');
            });

            col.addEventListener('dragleave', () => {
                col.classList.remove('drag-over');
            });

            col.addEventListener('drop', (e: Event) => {
                const dragEvent = e as DragEvent;
                dragEvent.preventDefault();
                col.classList.remove('drag-over');
                const taskId = dragEvent.dataTransfer?.getData('text/plain');
                const status = (col as HTMLElement).dataset.status;

                if (taskId && status) {
                    this.handleTaskMove(taskId, status);
                }
            });
        });
    }

    private async handleTaskMove(taskId: string, newStatus: string) {
        try {
            await TaskService.updateStatus(taskId, newStatus);
            this.loadProjectData();
            (window as any).toast.success('Tarefa movida!');
        } catch (error: any) {
            (window as any).toast.error('Erro ao mover tarefa.');
        }
    }

    private async handleAddTask() {
        if (!this.projectId) return;
        const title = prompt("Título da nova tarefa:");
        if (title) {
            try {
                await TaskService.create({
                    title,
                    project_id: Number(this.projectId),
                    status: TaskStatus.PENDING,
                    priority: TaskPriority.MEDIUM,
                    description: '',
                    estimate: 1 // Default estimate
                });
                (window as any).toast.success('Tarefa criada com sucesso!');
                this.loadProjectData();
            } catch (error: any) {
                console.error(error);
                (window as any).toast.error('Erro ao criar tarefa.');
            }
        }
    }

    private async handleEditProject() {
        if (!this.currentProject) return;
        const newName = prompt("Novo nome do projeto:", this.currentProject.name);
        if (newName && newName !== this.currentProject.name) {
            try {
                await ProjectService.update(String(this.currentProject.id), { name: newName });
                (window as any).toast.success('Projeto atualizado.');
                this.loadProjectData();
            } catch (error: any) {
                (window as any).toast.error('Erro ao editar projeto.');
            }
        }
    }

    private async handleDeleteProject() {
        if (!this.currentProject) return;
        if (confirm(`Excluir o projeto "${this.currentProject.name}"?`)) {
            try {
                await ProjectService.delete(String(this.currentProject.id));
                (window as any).toast.success('Projeto excluído.');
                (window as any).app.navigate('/projects');
            } catch (error: any) {
                (window as any).toast.error('Erro ao excluir projeto.');
            }
        }
    }

    private updateHeader(project: Project): void {
        const titleEl = this.container.querySelector('#project-title');
        const descEl = this.container.querySelector('#project-desc');

        if (titleEl) titleEl.textContent = project.name;
        if (descEl) descEl.textContent = project.description;
    }

    private renderTasks(tasks: Task[]): void {
        // Mapeamento correto entre o Status da Task e o ID da Coluna no HTML
        // TaskStatus ('pending', 'in_progress', 'completed') -> HTML ID
        const statusToColumnId: Record<string, string> = {
            pending: 'col-pending',
            in_progress: 'col-in_progress',
            completed: 'col-completed'
        };

        // Seleciona os elementos das colunas
        const cols: Record<string, Element | null> = {
            pending: this.container.querySelector('#' + statusToColumnId.pending),
            in_progress: this.container.querySelector('#' + statusToColumnId.in_progress),
            completed: this.container.querySelector('#' + statusToColumnId.completed)
        };

        // Contadores
        const counts = {
            pending: this.container.querySelector('#count-pending'),
            in_progress: this.container.querySelector('#count-in_progress'),
            completed: this.container.querySelector('#count-completed')
        };

        // Limpa o conteúdo atual das colunas
        Object.values(cols).forEach(el => { if (el) el.innerHTML = ''; });

        let countMap: Record<string, number> = { pending: 0, in_progress: 0, completed: 0 };

        tasks.forEach(task => {
            // Verifica se pertence ao projeto (se necessário, mas o service já filtra)
            if (String(task.project_id) === String(this.projectId)) {
                const statusKey = task.status; // pending, in_progress, completed

                // Pega o ID da coluna DOM
                const targetColId = statusToColumnId[statusKey];

                const cardComponent = new TaskCard(`task-${task.id}`, task);
                const cardElement = cardComponent.getElement();

                // Event Listeners for TaskCard
                cardElement.addEventListener('task-deleted', () => this.loadProjectData());
                cardElement.addEventListener('task-edited', () => this.loadProjectData());

                // Insere na coluna correta
                if (cols[statusKey]) {
                    cols[statusKey]?.appendChild(cardElement);
                    if (countMap[statusKey] !== undefined) {
                        countMap[statusKey]++;
                    }
                }
            }
        });

        // Atualiza os contadores
        if (counts.pending) counts.pending.textContent = countMap.pending.toString();
        if (counts.in_progress) counts.in_progress.textContent = countMap.in_progress.toString();
        if (counts.completed) counts.completed.textContent = countMap.completed.toString();
    }
}