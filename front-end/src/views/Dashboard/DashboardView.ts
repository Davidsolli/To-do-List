import { Component } from '../../core/Component';
import template from './DashboardView.html';
import './DashboardView.css';
import { Button } from '../../components/Button/Button';
import { ProjectCard } from '../../components/ProjectCard/ProjectCard';
import { Table } from '../../components/Table/Table';
import { ProjectService } from '../../services/ProjectService';
import { TaskService } from '../../services/TaskService';
import { app } from '../../App';

export class DashboardView extends Component {

    getTemplate(): string {
        // Botão para ir para a página de todos os projetos
        const btnAll = new Button({
            text: 'Ver todos os projetos',
            variant: 'primary',
            action: 'go-projects'
        });

        return template.replace('{{btn_all_projects}}', btnAll.render());
    }

    protected afterRender(): void {
        this.loadRecentProjects();
        this.loadUserTasks();
        this.bindEvents();
    }

    private bindEvents(): void {
        // 1. Botão "Ver todos os projetos"
        const btnAll = this.container.querySelector('[data-action="go-projects"]');
        btnAll?.addEventListener('click', () => app.navigate('/projects'));

        // 2. Event Delegation para o Menu (3 pontinhos)
        // Nota: O clique do botão "Acessar" já é tratado dentro do loadRecentProjects
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const menuBtn = target.closest('[data-action="menu"]');

            if (menuBtn) {
                const id = menuBtn.getAttribute('data-id');
                // Aqui você implementará o Dropdown no futuro
                alert(`Menu do projeto ${id} clicado!`);
            }
        });
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
                return;
            }

            // Pega apenas os 5 primeiros
            const recentProjects = projects.slice(0, 5);

            // Renderiza os Cards
            carousel.innerHTML = recentProjects
                .map(p => new ProjectCard(p).render())
                .join('');

            // Adiciona evento de navegação aos botões "Acessar projeto"
            const btns = carousel.querySelectorAll('.btn--link');
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
            // 1. Pega o retorno cru da API
            const response: any = await TaskService.getUserTasks();
            
            console.log("📦 RESPOSTA DA API:", response); // Olhe no F12 o que aparece aqui!

            // 2. Lógica para encontrar a lista (Array) onde quer que ela esteja
            let tasks: any[] = [];

            if (Array.isArray(response)) {
                // Cenário A: A API devolveu a lista direta: [ {...}, {...} ]
                tasks = response;
            } else if (response && Array.isArray(response.data)) {
                // Cenário B: A API devolveu embrulhado: { data: [...] }
                tasks = response.data;
            } else if (response && Array.isArray(response.tasks)) {
                // Cenário C: A API devolveu embrulhado: { tasks: [...] }
                tasks = response.tasks;
            } else {
                // Cenário D: Não achou lista nenhuma (pode ser erro ou objeto vazio)
                console.warn("Não foi possível encontrar uma lista de tarefas na resposta.");
                tasks = [];
            }

            // 3. Se a lista estiver vazia
            if (tasks.length === 0) {
                container.innerHTML = '<div class="empty-state-msg">Nenhuma tarefa pendente encontrada.</div>';
                return;
            }

            // 4. Agora é seguro fazer o .map, pois garantimos que 'tasks' é uma lista
            const rows = tasks.map((t: any) => `
                <tr>
                    <td><strong>${t.title}</strong></td>
                    <td class="text-secondary">${t.project_name || (t.project ? t.project.name : '-')}</td>
                    <td>${this.getPriorityBadge(t.priority)}</td>
                    <td>${this.getStatusBadge(t.status)}</td>
                    <td class="text-secondary">${t.due_date || 'Sem prazo'}</td>
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

    // Helpers para as Badges Coloridas
    private getPriorityBadge(priority: string): string {
        const map: any = { 'Alta': 'high', 'Média': 'medium', 'Baixa': 'low' };
        const type = map[priority] || 'low';
        return `<span class="badge badge--${type}">${priority}</span>`;
    }

    private getStatusBadge(status: string): string {
        const map: any = { 'Pendente': 'pending', 'Em andamento': 'doing', 'Concluída': 'done' };
        const type = map[status] || 'pending';
        return `<span class="badge badge--${type}">${status}</span>`;
    }
}