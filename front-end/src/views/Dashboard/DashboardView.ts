import { Component } from '../../core/Component';
import template from './DashboardView.html';
import './DashboardView.css';
import { Button } from '../../components/Button/Button';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import { Table } from '../../components/Table/Table';
import { ProjectService } from '../../services/ProjectService';
import { TaskService, TaskResponse } from '../../services/TaskService';
import { TaskPriority, TaskStatus } from '../../models/Task';
import { ContextMenu } from '../../components/ContextMenu/ContextMenu';
import { ProjectModal } from '../../components/ProjectModal/ProjectModal';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';
import { DateFormatter } from '../../utils/DateFormatter';
import { app } from '../../App';

export class DashboardView extends Component {

    getTemplate(): string {
        // Botão para ir para a página de todos os projetos
        const btnAll = new Button({
            text: 'Ver todos os projetos',
            variant: 'ghost',
            action: 'go-projects',
            icon: 'fa-solid fa-arrow-right'
        });

        return template.replace('{{btn_all_projects}}', btnAll.render());
    }

    protected afterRender(): void {
        this.loadRecentProjects();
        this.loadUserTasks();
        this.bindEvents();
    }

    private bindEvents(): void {
        const dashboard = this.container.querySelector('.dashboard-container');
        if (!dashboard) return;

        // 1. Botão "Ver todos os projetos"
        const btnAll = dashboard.querySelector('[data-action="go-projects"]');
        btnAll?.addEventListener('click', () => app.navigate('/projetos'));

        // 2. Event Delegation para o Menu (3 pontinhos)
        dashboard.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const menuBtn = target.closest('[data-action="menu"]') as HTMLElement;

            if (menuBtn) {
                e.stopPropagation();
                const id = menuBtn.getAttribute('data-id');

                if (id) {
                    this.showProjectMenu(menuBtn, id);
                }
            }
        });
    }

    private showProjectMenu(triggerElement: HTMLElement, projectId: string): void {
        const menu = new ContextMenu({
            id: projectId,
            onEdit: (id) => {
                this.showEditProjectModal(Number(id));
            },
            onDelete: (id) => {
                this.showDeleteProjectConfirm(Number(id));
            }
        });

        menu.show(triggerElement);
    }

    private showEditProjectModal(projectId: number): void {
        const modal = new ProjectModal({
            mode: 'edit',
            projectId,
            onSuccess: () => {
                this.loadRecentProjects();
                app.sidebar?.refreshProjectsList();
            }
        });

        modal.show();
    }

    private showDeleteProjectConfirm(projectId: number): void {
        const dialog = new ConfirmDialog({
            title: 'Excluir Projeto',
            message: 'Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    await ProjectService.deleteProject(projectId);
                    this.loadRecentProjects();
                    app.sidebar?.refreshProjectsList();
                } catch (error) {
                    console.error('Erro ao excluir projeto:', error);
                }
            }
        });

        dialog.show();
    }

    private async loadRecentProjects() {
        const carousel = this.container.querySelector('#projects-carousel');
        if (!carousel) return;

        try {
            // Chamada real à API
            const projects = await ProjectService.getUserProjects();

            if (projects.length === 0) {
                carousel.innerHTML = '<div class="empty-state-msg">Você ainda não tem projetos recentes.</div>';
                carousel.classList.remove('projects-carousel');
                (carousel as HTMLElement).style.display = 'block'; // Garante que a mensagem ocupe a largura toda
                return;
            }

            // Pega apenas os 5 primeiros
            const recentProjects = projects.slice(0, 5);

            // Renderiza os Cards
            carousel.innerHTML = recentProjects
                .map(p => new ProjectCard(p).render())
                .join('');

            // Adiciona evento de navegação aos botões "Acessar projeto"
            const btns = carousel.querySelectorAll('[data-action="access-project"]');
            btns.forEach((btn, index) => {
                btn.addEventListener('click', () => app.navigate(`/projetos/${recentProjects[index].id}`));
            });

        } catch (error) {
            console.error(error);
            carousel.innerHTML = '<p class="form-error">Erro ao carregar projetos.</p>';
        }
    }

    private async loadUserTasks() {
        const container = this.container.querySelector('#tasks-container');
        if (!container) return;

        try {
            const response: any = await TaskService.getUserTasks();

            console.log("📦 RESPOSTA DA API:", response);

            // Lógica para encontrar a lista (Array) onde quer que ela esteja
            let tasks: TaskResponse[] = [];

            if (Array.isArray(response)) {
                tasks = response;
            } else if (response && Array.isArray(response.data)) {
                tasks = response.data;
            } else if (response && Array.isArray(response.tasks)) {
                tasks = response.tasks;
            } else {
                console.warn("Não foi possível encontrar uma lista de tarefas na resposta.");
                tasks = [];
            }

            // Filtrar tarefas concluídas
            tasks = tasks.filter(task => task.status !== TaskStatus.COMPLETED);

            // Ordenar por prazo (estimate) e prioridade
            tasks.sort((a, b) => {
                // 1. Prazo: menor timestamp (mais próximo/antigo) primeiro. Sem prazo (=undefined) vai pro final.
                const dateA = a.estimate || Number.MAX_SAFE_INTEGER;
                const dateB = b.estimate || Number.MAX_SAFE_INTEGER;

                if (dateA !== dateB) return dateA - dateB;

                // 2. Prioridade: Alta > Média > Baixa
                const priorityWeight: Record<string, number> = {
                    [TaskPriority.HIGH]: 3,
                    [TaskPriority.MEDIUM]: 2,
                    [TaskPriority.LOW]: 1
                };

                const pA = priorityWeight[a.priority] || 0;
                const pB = priorityWeight[b.priority] || 0;

                return pB - pA;
            });

            // Pegar apenas as 10 primeiras
            tasks = tasks.slice(0, 10);

            if (tasks.length === 0) {
                container.innerHTML = '<div class="empty-state-msg">Nenhuma tarefa pendente encontrada.</div>';
                return;
            }

            // Buscar nomes dos projetos para as tarefas que têm project_id
            const tasksWithProjects = await this.enrichTasksWithProjectNames(tasks);

            const rows = tasksWithProjects.map((task: TaskResponse) => `
                <tr>
                    <td><strong>${task.title}</strong></td>
                    <td class="text-secondary">${task.project_name || '-'}</td>
                    <td>${this.getPriorityBadge(task.priority)}</td>
                    <td>${this.getStatusBadge(task.status)}</td>
                    <td class="text-secondary">${DateFormatter.formatDate(task.estimate)}</td>
                </tr>
            `);

            const table = new Table({
                headers: ['Nome da Tarefa', 'Projeto', 'Prioridade', 'Status', 'Prazo'],
                rows: rows
            });

            container.innerHTML = table.render();

        } catch (error: any) {
            console.error("ERRO CRÍTICO:", error);
            container.innerHTML = `<p class="form-error">Erro ao carregar: ${error.message || 'Erro desconhecido'}</p>`;
        }
    }

    private async enrichTasksWithProjectNames(tasks: TaskResponse[]): Promise<TaskResponse[]> {
        // Busca todos os projetos do usuário uma única vez
        try {
            const projects = await ProjectService.getUserProjects();

            // Cria um mapa de id -> nome para acesso rápido
            const projectMap = new Map(projects.map(p => [p.id, p.name]));

            // Enriquece cada tarefa com o nome do projeto
            return tasks.map(task => ({
                ...task,
                project_name: task.project_id ? projectMap.get(task.project_id) : undefined
            }));
        } catch (error) {
            console.error('Erro ao buscar nomes dos projetos:', error);
            // Se falhar, retorna as tarefas sem os nomes dos projetos
            return tasks;
        }
    }

    // Helpers para as Badges Coloridas
    private getPriorityBadge(priority: TaskPriority): string {
        const labels: Record<TaskPriority, string> = {
            [TaskPriority.HIGH]: 'Alta',
            [TaskPriority.MEDIUM]: 'Média',
            [TaskPriority.LOW]: 'Baixa'
        };

        const cssClasses: Record<TaskPriority, string> = {
            [TaskPriority.HIGH]: 'high',
            [TaskPriority.MEDIUM]: 'medium',
            [TaskPriority.LOW]: 'low'
        };

        const label = labels[priority] || 'Baixa';
        const cssClass = cssClasses[priority] || 'low';

        return `<span class="badge badge--${cssClass}">${label}</span>`;
    }

    private getStatusBadge(status: TaskStatus): string {
        const labels: Record<TaskStatus, string> = {
            [TaskStatus.PENDING]: 'Pendente',
            [TaskStatus.IN_PROGRESS]: 'Em andamento',
            [TaskStatus.COMPLETED]: 'Concluída',
            [TaskStatus.UNDER_REVIEW]: 'Em revisão'
        };

        const cssClasses: Record<TaskStatus, string> = {
            [TaskStatus.PENDING]: 'pending',
            [TaskStatus.IN_PROGRESS]: 'doing',
            [TaskStatus.COMPLETED]: 'done',
            [TaskStatus.UNDER_REVIEW]: 'doing' // Usa mesmo estilo de "em andamento"
        };

        const label = labels[status] || 'Pendente';
        const cssClass = cssClasses[status] || 'pending';

        return `<span class="badge badge--${cssClass}">${label}</span>`;
    }
}