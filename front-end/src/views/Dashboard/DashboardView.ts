import { Component } from '../../core/Component';
import template from './DashboardView.html';
import './DashboardView.css';
import { Button } from '../../components/Button/Button';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import { Table } from '../../components/Table/Table';
import { ProjectService } from '../../services/ProjectService';
import { Project } from '../../models/Project';
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

        // Botão para ver todas as tarefas
        const btnAllTasks = new Button({
            text: 'Ver todas as tarefas',
            variant: 'ghost',
            action: 'go-all-tasks',
            icon: 'fa-solid fa-arrow-right'
        });

        return template
            .replace('{{btn_all_projects}}', btnAll.render())
            .replace('{{btn_all_tasks}}', btnAllTasks.render());
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

        // 2. Botão "Ver todas as tarefas"
        const btnAllTasks = dashboard.querySelector('[data-action="go-all-tasks"]');
        btnAllTasks?.addEventListener('click', () => app.navigate('/minhas-tarefas'));

        // 3. Event Delegation para o Menu (3 pontinhos)
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
            const user = JSON.parse(localStorage.getItem('user_data') || '{}');
            
            // Chamada real à API
            const allProjects = await ProjectService.getUserProjects();
            
            // Filtrar projetos com tarefas pendentes onde o usuário é responsável ou revisor
            const projectsWithPendingTasks = await Promise.all(
                allProjects.map(async (project) => {
                    try {
                        const tasksResponse = await TaskService.getProjectTasks(project.id);
                        const tasks = tasksResponse.tasks || [];
                        
                        // Verificar se há tarefas pendentes onde o usuário é assignee ou reviewer
                        const hasPendingUserTasks = tasks.some(task => {
                            const isPending = task.status !== 'completed';
                            const isAssignee = task.assignees?.some(a => a.user_id === user.id);
                            const isReviewer = task.reviewers?.some(r => r.user_id === user.id);
                            return isPending && (isAssignee || isReviewer);
                        });
                        
                        return hasPendingUserTasks ? project : null;
                    } catch (error) {
                        console.error(`Erro ao filtrar projeto ${project.id}:`, error);
                        return null;
                    }
                })
            );
            
            const projects = projectsWithPendingTasks.filter(p => p !== null) as Project[];

            if (projects.length === 0) {
                carousel.innerHTML = '<div class="empty-state-msg">Você não tem tarefas pendentes em nenhum projeto.</div>';
                carousel.classList.remove('projects-carousel');
                (carousel as HTMLElement).style.display = 'block';
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
            const user = JSON.parse(localStorage.getItem('user_data') || '{}');
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

            console.log('📋 Total de tarefas recebidas:', tasks.length);
            console.log('👤 User ID:', user.id, 'Tipo:', typeof user.id);
            console.log('📦 Primeira tarefa (exemplo):', tasks[0]);

            // Filtrar tarefas de acordo com o papel do usuário:
            // 1. Se é APENAS assignee: mostrar apenas pending ou in_progress
            // 2. Se é assignee E reviewer: mostrar todos menos completed
            // 3. Se é APENAS reviewer: mostrar apenas ready ou under_review
            tasks = tasks.filter(task => {
                const isAssignee = task.assignees?.some(a => {
                    // Comparar convertendo ambos para número
                    const assigneeId = typeof a.user_id === 'string' ? parseInt(a.user_id) : a.user_id;
                    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
                    return assigneeId === userId;
                });
                const isReviewer = task.reviewers?.some(r => {
                    // Comparar convertendo ambos para número
                    const reviewerId = typeof r.user_id === 'string' ? parseInt(r.user_id) : r.user_id;
                    const userId = typeof user.id === 'string' ? parseInt(user.id) : user.id;
                    return reviewerId === userId;
                });
                
                console.log(`Task "${task.title}": isAssignee=${isAssignee}, isReviewer=${isReviewer}, status=${task.status}`);
                
                // Se é tanto assignee quanto reviewer: mostrar todos menos completed
                if (isAssignee && isReviewer) {
                    return task.status !== TaskStatus.COMPLETED;
                }
                
                // Se é APENAS assignee: mostrar apenas pending ou in_progress
                if (isAssignee && !isReviewer) {
                    return task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS;
                }
                
                // Se é APENAS reviewer: mostrar apenas ready ou under_review
                if (isReviewer && !isAssignee) {
                    return task.status === TaskStatus.READY || task.status === TaskStatus.UNDER_REVIEW;
                }
                
                return false;
            });

            console.log('✅ Tarefas após filtro:', tasks.length);

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
                <tr data-project-id="${task.project_id}" style="cursor: pointer;">
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

            // Adicionar eventos de clique nas linhas da tabela
            const tableRows = container.querySelectorAll('tr[data-project-id]');
            tableRows.forEach(row => {
                row.addEventListener('click', () => {
                    const projectId = row.getAttribute('data-project-id');
                    if (projectId) {
                        app.navigate(`/projetos/${projectId}`);
                    }
                });
            });

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
            [TaskStatus.READY]: 'Pronto',
            [TaskStatus.COMPLETED]: 'Concluída',
            [TaskStatus.UNDER_REVIEW]: 'Em revisão'
        };

        const cssClasses: Record<TaskStatus, string> = {
            [TaskStatus.PENDING]: 'pending',
            [TaskStatus.IN_PROGRESS]: 'doing',
            [TaskStatus.READY]: 'ready',
            [TaskStatus.COMPLETED]: 'done',
            [TaskStatus.UNDER_REVIEW]: 'doing' // Usa mesmo estilo de "em andamento"
        };

        const label = labels[status] || 'Pendente';
        const cssClass = cssClasses[status] || 'pending';

        return `<span class="badge badge--${cssClass}">${label}</span>`;
    }
}